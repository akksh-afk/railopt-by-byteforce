# Backend & Database Roadmap

How the backend and database work today, and how they grow in four stages
into the system the officers will use. Each stage describes **how it
works** at that point: what data comes in, where it's stored, who reads it,
and what changes from the stage before.

- Commands and code walk-through: [ONBOARDING.md](ONBOARDING.md)
- Task list, demo script, judge Q&A: [PERSON2_NOTES.md](PERSON2_NOTES.md)
- Whole-project roadmap: [../ROADMAP.md](../ROADMAP.md)
- Exact data shapes: [../CONTRACTS.md](../CONTRACTS.md)

| Stage | Name | Status |
|---|---|---|
| 0 | Batch pipeline: defects in, scores and alerts out | **Done** |
| 1 | One connected pipeline: block requests + approvals flowing back | Next, before the demo |
| 2 | The officer system: web API, login, audit trail, Postgres | After the pipeline works |
| 3 | Production: real feeds, live alerts, scale | After SIH |

---

## The job, in one sentence

The backend is the project's **single source of truth**. Every department's
records come in through it, get cleaned into one standard shape, and are
kept there. Every other part (ML, optimizer, validator, dashboard) reads from
it and reports back to it, instead of passing files between each other.

---

## Stage 0 — Batch pipeline (done)

### How it works
One command, `python run_pipeline.py`, runs everything top to bottom and
then stops. There's no server. It's a batch job, like a nightly import.

```
 TMS CSV   SMMS CSV   TDMS CSV            corridor_master.csv (8,622 real sections)
    │         │          │                          │
    └──── connectors ────┘                          │
              │                                     │
              ▼                                     ▼
      raw_defect_ingest  ───►  normalizer  ◄──  corridor_master
       (exact copies)              │
                                   ▼
                            defect_records ── status: pending / scheduled
                                   │
                  get_pending_defects()
                                   │
                        ML scores all 11,500 (0.13 s)
                                   │
                         notify_scored()
                                   ▼
                            notifications ──► notifications.json ──► dashboard
```

### The database at this stage (SQLite, one file: `db/railway.db`)

| Table | Holds | Filled by | Key rule |
|---|---|---|---|
| `corridor_master` | 8,622 real track sections, with station codes, zone and traffic | loader | `corridor_id` is unique |
| `raw_defect_ingest` | every department row exactly as received, plus the full row as JSON | connectors | unique per (department, source ID) |
| `defect_records` | the same defects in one standard shape, with `status` | normalizer | `record_id` is unique |
| `notifications` | alerts per recipient | normalizer, scoring, approvals | unique per (event, reference, recipient) |

### The rules that make it trustworthy
- **Two layers of storage.** Raw copies are never edited, and the clean
  copies are derived from them. If the cleaning rules change, the clean
  table can be rebuilt from the raw copies, and nothing needs re-importing.
- **Idempotent.** Unique keys plus `INSERT OR IGNORE` mean running twice
  changes nothing.
- **No silent loss.** A row that can't be cleaned raises a `RECORD_SKIPPED`
  alert.
- **One door in.** Other code calls `api/query_api.py` functions and never
  writes SQL against the tables.
- **Status only moves forward after a safety PASS.** `pending → scheduled`
  happens only in `on_schedule_approved()`, when Layer 7 approves.

### Limits of this stage
There's a single writer (the pipeline), and alerts reach the dashboard only
when the pipeline writes a file. Nobody can submit anything; it only
imports.

---

## Stage 1 — One connected pipeline (next, before the demo)

**Goal:** a defect goes in one end, and an approved block plus department
alerts come out the other, with the database recording every step.

### What's added and how it works

**1. Block requests come in (COA connector).** A new connector reads
`synthetic_COA_block_demands.csv` (4,600 requests) into a new
`block_requests` table. It works like the existing connectors (raw row kept,
unique key, `INSERT OR IGNORE`). Start and end times are worked out once at
import, so overlap checks are plain SQL. Each request links to the defect
it's for (`record_id`) and to its track section (`corridor_id`).

**2. Overlap detection.** A single SQL query compares requests with each
other: same section, different departments, times overlapping. These are
the "these could share one closure" candidates. *Data caveat:* the current
file has no overlapping requests. Person 1 must add overlap scenarios, or
the query finds nothing to show.

**3. Approvals flow back.** After Person 3's safety check runs, it hands its
report and the plan to `on_schedule_approved()`:

```
 optimizer (Person 1) ──draft plan──► validator (Person 3)
                                          │
                              report + plan
                                          ▼
                              on_schedule_approved()
                        ┌─────────────┴──────────────┐
                    PASS│                            │FAIL
                        ▼                            ▼
        defects → scheduled                   nothing marked
        BLOCK_ASSIGNED to each dept           VALIDATION_FAIL to Controller
                        └─────────────┬──────────────┘
                                      ▼
                         notifications.json → dashboard
```

**4. Station codes on defects.** `get_pending_defects()` joins
`corridor_master` so each defect carries real `from_station`/`to_station`.
The optimizer stops inventing them.

### The database after Stage 1
Everything from Stage 0, plus:

| Table | Holds |
|---|---|
| `block_requests` | each department's closure request, with computed start and end, linked to its defect and section |

### Done when
One run takes 11,500 defects to a plan that passed the safety check.
Defects in it show `scheduled`, and each department in a shared block has a
`BLOCK_ASSIGNED` alert on the dashboard.

---

## Stage 2 — The officer system (after Stage 1)

**Goal:** officers stop being just recipients. They log in, submit and edit
requests, see their alerts live, and every action is recorded.

### How it works
A web service (FastAPI, Python) sits in front of the same functions.
Nothing is rewritten; the service wraps what exists:

```
 Browser (dashboard)
      │  HTTPS + login token
      ▼
 FastAPI service ── checks who you are and what your role allows
      │
      ├── GET  /defects                  → get_pending_defects()
      ├── GET  /notifications            → get_notifications()   (replaces the JSON file)
      ├── POST /notifications/{id}/read  → mark_read()
      ├── POST /schedules/validated      → on_schedule_approved()
      ├── GET/POST /block-requests       → Stage 1 table
      └── GET  /block-requests/conflicts → the overlap query
      │
      ├── every create / change / approve  → one row in audit_log
      ▼
 PostgreSQL (replaces SQLite once several people write at once)
```

### What changes, and why
| Change | How it works | Why |
|---|---|---|
| **Web API** | Each endpoint is a thin wrapper that calls an existing `query_api` function | The dashboard can read live data and send actions, instead of reading a file |
| **Login + roles** | Passwords stored hashed (bcrypt). A login returns a token the browser sends with every request. Department officers can see and edit their own department's requests; Controllers can see everything and approve | Only the right people can change things |
| **Audit trail** | A new `audit_log` table (who, what action, which record, when, details). The API adds a row on every change and has no way to edit or delete one | Accountability for safety-critical decisions |
| **Postgres** | Same tables and logic. The syntax differences are listed in PERSON2_NOTES.md (IDs, `now()`, `ON CONFLICT DO NOTHING`, parameter style, booleans) | SQLite allows one writer at a time; a multi-user API needs many |
| **Dashboard reads the API** | Person 4 points `getAlerts()` at `GET /notifications`; `notifications.json` is retired | Alerts are current without re-running the pipeline |

### The database after Stage 2 (Postgres)
Everything from Stage 1, plus:

| Table | Holds |
|---|---|
| `users` | officer accounts: name, department, role, password hash |
| `audit_log` | append-only record of every action |

`notifications.read_at` finally gets used, when an officer marks an alert
read in the browser.

---

## Stage 3 — Production (after SIH)

Each item is added only when the stated condition becomes true.

| Item | How it works | Add it when |
|---|---|---|
| Real TMS / SMMS / TDMS / COA feeds | Replace each connector's "read the CSV" part with "read the real system". Everything downstream stays the same | Railways grants authorised access |
| Scheduled runs | The pipeline runs automatically (e.g. hourly) instead of by hand. It's already safe to repeat | Real feeds update on their own |
| Live alerts | The server pushes new alerts to open dashboards (server-sent events) instead of waiting for a refresh | Controllers keep the dashboard open during a shift |
| SMS / email to field crews | Same `notifications` rows, sent through an SMS or email service | Crews are real users |
| Background workers + queue | Slow jobs (optimizer runs) go to a worker, so the API answers straight away | Optimizer runs start slowing down requests |
| Containers, scaling, monitoring | Package the API and workers, and watch response times and errors | More than one server is needed |

---

## How the data model grows

```
Stage 0   corridor_master · raw_defect_ingest · defect_records · notifications
Stage 1   + block_requests
Stage 2   + users · audit_log          (moved to PostgreSQL)
Stage 3   no new core tables. New sources plug into the same raw → clean pattern
```

The pattern never changes: **keep the raw copy, derive the clean record,
key everything so repeats are harmless, and let other code in only through
the query functions.** Any new source, real or synthetic, follows it.
