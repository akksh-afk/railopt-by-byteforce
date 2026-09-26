# Person 2 — Backend / Database + Data Connectors (Layers 1–3)

Notes for the backend and database engineer: what already exists, what other
people rely on, what's left, and what to say in the demo. Ownership and exact
data shapes are in [CONTRACTS.md](../CONTRACTS.md); where things are heading
is in [ROADMAP.md](../ROADMAP.md).

## What you own
- **Layers 1–3:** ingestion (connectors), the database, normalization.
- **Notification storage and delivery** (CONTRACTS.md Interface 7). Person 1
  decides *which* events exist; you store them and get them to the dashboard.
- **Folder:** `backend_api/`. Everything else in the repo talks to your data
  through `api/query_api.py`, never through SQL or the raw CSVs.

## What's already delivered (on `main`)

`python run_pipeline.py` does this, in order:

| Step | What happens | Result on current data |
|---|---|---|
| 0 | Applies `db/schema.sql` (all `IF NOT EXISTS`, so safe on an old database) | tables + indexes |
| 1 | Loads `data/derived/corridor_master.csv` | 8,622 real corridors |
| 2–4 | Three connectors (TMS, SMMS, TDMS) → `raw_defect_ingest`, original row kept as JSON in `raw_payload` | 6,000 + 3,000 + 2,500 |
| 5 | Normalizer → `defect_records` (unified field names, `severity_score`, `corridor_traffic_density` joined from corridors, `status='pending'`) | 11,500 |
| 6 | Scores pending defects with Person 1's model, raises alerts, exports `dashboard/public/notifications.json` | 620 notifications (310 defects × Controller + department) |

**Tables:** `corridor_master`, `raw_defect_ingest`, `defect_records`,
`notifications`.

**Functions other people call** (`api/query_api.py`):

| Function | Who calls it | What it does |
|---|---|---|
| `get_pending_defects(department=, corridor_id=)` | Person 1 (optimizer) | Pending defects in Interface 1 shape; `requires_traffic_or_power_block` is a real `bool` |
| `on_schedule_approved(report, schedule)` | Person 3 (after every validation) | PASS: marks tasks `scheduled` + `BLOCK_ASSIGNED` to each department. FAIL: one `VALIDATION_FAIL` per violation, marks nothing |
| `notify(list_of_dicts)` | anyone | Records alerts; the same event + reference + recipient is stored once |
| `notify_scored(ranked, min_probability)` | the pipeline | `HIGH_PRIORITY_DEFECT` / `NEEDS_REVIEW` from scores |
| `get_notifications()`, `mark_read(id)` | future web API | Read back / acknowledge |
| `export_notifications(path)` | the pipeline | JSON the dashboard's Alerts feed reads |

**Properties you can rely on (and say out loud):**
- **Re-runnable.** Unique keys plus `INSERT OR IGNORE`. A second run reports
  `0 new` everywhere and changes nothing.
- **Nothing silently lost.** Raw rows keep their full original JSON. Records
  the normalizer can't place raise a `RECORD_SKIPPED` alert instead of just
  a console line.
- **A rejected plan can't lose work.** Defects are only marked `scheduled`
  after Layer 7 says PASS.

## How to run and check
```bash
pip install -r requirements.txt          # from the repo root
cd backend_api
python run_pipeline.py                   # builds/updates db/railway.db (gitignored)
python test_pipeline.py                  # throwaway DB: re-runs, PASS/FAIL paths, export keys, scorer
```
Run `test_pipeline.py` before every push that touches `backend_api/`. It
takes a few seconds.

## Known limits (deliberate, with the upgrade path)
| Limit | Why it's fine now | When it changes |
|---|---|---|
| SQLite, single writer | Zero setup, one file, the pipeline is the only writer | Web API with several writers → Postgres (checklist below) |
| No server; dashboard reads a static JSON file | Same approach as `allCorridors.json` | Web API (Phase 2) |
| `mark_read()` has no caller | Nothing in the browser can reach it without a server | Web API |
| Same event on the same reference alerts only once | Stops re-runs spamming | If a block can fail, get fixed, then fail again, add a date or attempt number to `ref_id` |
| Timestamps are UTC (`created_at`), shown as "… UTC" | Honest, unambiguous | Convert to IST in the dashboard if Controllers ask |
| `defect_records` has no station codes | Not in Interface 1 | See task 3 below |

## Your next tasks, in order

### 1. COA connector: block requests (Phase 1, the big one)
The problem statement is about departments **requesting blocks
independently**. That data exists, `data/synthetic/synthetic_COA_block_demands.csv`,
but nothing loads it yet.

What's in the file (checked):
- **Size:** 4,600 requests, IDs unique: Engineering 2,441, S&T 1,198,
  Traction 961.
- **Block types:** `traffic_block` 3,639, `power_block` 961. All are
  `pending`.
- **Dates:** 2024-01-03 to 2026-01-09; durations 0.5–6 hours.
- **Links:** every `corridor_id` is in `corridor_master`, and every
  `source_record_id` is a real defect in `defect_records`.

A table that follows the existing pattern (raw payload kept, unique key,
`INSERT OR IGNORE`):
```sql
CREATE TABLE IF NOT EXISTS block_requests (
    request_id              TEXT PRIMARY KEY,   -- block_demand_id, e.g. 'BD000001'
    department              TEXT NOT NULL,      -- source_department
    record_id               TEXT,               -- source_record_id -> defect_records.record_id
    corridor_id             TEXT NOT NULL,
    start_time              TEXT NOT NULL,      -- requested_date + preferred_start_hhmm, 'YYYY-MM-DD HH:MM'
    end_time                TEXT NOT NULL,      -- start + requested_duration_hrs (roll the date past midnight!)
    block_type_requested    TEXT,               -- traffic_block | power_block
    status                  TEXT DEFAULT 'pending',
    raw_payload             TEXT,
    ingested_at             TEXT DEFAULT (datetime('now'))
);
```
Store `start_time` and `end_time` already computed, in `'YYYY-MM-DD HH:MM'`
form. Strings in that format sort correctly, so overlap checks become plain
SQL:
```sql
-- requests from different departments on the same corridor at the same time
SELECT a.request_id, b.request_id, a.corridor_id
FROM block_requests a
JOIN block_requests b
  ON a.corridor_id = b.corridor_id
 AND a.request_id < b.request_id
 AND a.department <> b.department
 AND a.start_time < b.end_time
 AND b.start_time < a.end_time;
```

**Heads-up, and raise it with Person 1 early:** on the current file that
query returns **0 rows**. No two requests overlap on the same corridor, and
only 4 pairs even share a corridor and a date. The requests are spread over
two years and thousands of corridors. So the "three departments' requests
become one block" story has no example in the request data yet. Person 1
(who owns the data) needs to add deliberate scenarios on real corridors:
partial overlap, full overlap, three departments, a train clash. Without
them the demo has nothing to merge.

Add a `get_block_requests(corridor_id=, status=)` next to
`get_pending_defects()`, and a line in CONTRACTS.md for the new table shape
(Person 1 owns that file; send them the table above).

### 2. Get `on_schedule_approved()` actually called
It's written and tested, but nothing calls it yet. Person 3 should call it
after every validation in `validation_engine/multi_horizon.py`, on PASS and
on FAIL. Pair with them once. Until it's called, `BLOCK_ASSIGNED` and
`VALIDATION_FAIL` never appear and no defect ever leaves `pending`. Watch out:
the validator works on one row per task (`task_id`), not per block. The
function accepts both shapes, but check that the `task_id`s it receives are
real `record_id`s, or nothing gets marked.

### 3. Small, helps Person 1: station codes in `get_pending_defects()`
The optimizer currently makes up `from_station`/`to_station` by slicing the
corridor ID (`"COR-"`, `"04"`). Join them in from `corridor_master`:
```sql
SELECT d.*, c.from_station, c.to_station
FROM defect_records d JOIN corridor_master c USING (corridor_id)
WHERE d.status = 'pending'
```
Extra fields don't break the scorer (it ignores them), and Person 1's
block-field fix becomes a lookup-free one-liner. Mention it in CONTRACTS.md
Interface 1 as "also returned".

### 4. Phase 2: the backend for the officer workflow
Do this after Phase 1 works end to end. See ROADMAP.md Phase 2.

**Web API (FastAPI, one service).** Thin wrappers over functions that
already exist:

| Endpoint | Wraps |
|---|---|
| `GET /defects?department=&corridor_id=` | `get_pending_defects()` |
| `GET /notifications?recipient=&unread_only=` | `get_notifications()` |
| `POST /notifications/{id}/read` | `mark_read()` |
| `POST /schedules/validated` (body: report + schedule) | `on_schedule_approved()` |
| `GET /block-requests`, `POST /block-requests` | task 1 + an insert |
| `GET /block-requests/conflicts` | the overlap query above |

Once `GET /notifications` exists, Person 4 points `getAlerts()` at it instead
of the static file. The static export can then go.

**Audit trail.** Add an append-only `audit_log` table (who, action, entity,
entity_id, time, details JSON). Write a row from the API on
create/update/accept. The API never exposes update or delete for this table.

**Login and roles.** Department officers see and edit their own requests;
Controllers see everything and approve. Keep passwords hashed (bcrypt).

**SQLite → Postgres checklist.** Switch when the API has concurrent writers;
everything else stays.

| SQLite (now) | Postgres |
|---|---|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `BIGINT GENERATED ALWAYS AS IDENTITY` |
| `datetime('now')` | `now()` with `TIMESTAMPTZ` columns |
| `INSERT OR IGNORE` | `INSERT … ON CONFLICT DO NOTHING` |
| `conn.total_changes` diffs | `cursor.rowcount` / `RETURNING` |
| named params `:name` | `%(name)s` (psycopg) |
| 0/1 flags | `BOOLEAN` |
| `conn.executescript(schema)` | run `schema.sql` once through `psql` or a migration tool |

## Demo script (~60 seconds)
1. **The problem.** "Three departments, three formats. TMS and SMMS say
   `requires_traffic_block`, TDMS says `requires_power_block`, and each has
   its own ID scheme." Show the three CSV headers side by side.
2. **Run it.** Run `python run_pipeline.py`: 11,500 records in, 11,500
   normalized, every one tied to one of 8,622 real corridors, and 620 alerts
   raised.
3. **Run it again.** Everything reports `0 new`. "It's safe to re-run. A
   crash halfway through or a repeated nightly job never duplicates
   anything."
4. **Open the dashboard's Alerts feed.** "These are real alerts from the
   pipeline, not mock data. Each department sees its own."
5. **One line on the future.** "Today the connectors read synthetic files.
   Swapping one for a real TMS feed changes one file; nothing downstream
   changes."

## Questions judges will ask you
- **"Is this real railway data?"** Corridors and timetables are real
  (data.gov.in via datameet, CC0). Defect and request records are
  synthetic, because TMS/SMMS/TDMS/COA aren't public, but every record sits
  on a real corridor and the distributions are calibrated to CAG Audit
  Report No. 45. We say which is which.
- **"What happens to bad or unmatched records?"** They're kept in
  `raw_defect_ingest` with their full original JSON, and the Controller gets
  a `RECORD_SKIPPED` alert. Nothing disappears quietly.
- **"What if it runs twice, or dies halfway?"** Every insert is keyed and
  idempotent, and the normalizer only picks up rows it hasn't processed. Just
  run it again.
- **"Could a rejected plan lose maintenance work?"** No. A defect only leaves
  `pending` when Layer 7 passes the schedule containing it; on FAIL nothing
  is marked.
- **"How do departments learn they share a block?"** On PASS, every
  department in a merged block gets a `BLOCK_ASSIGNED` alert naming the
  others.
- **"Why SQLite?"** One file, no setup, and the pipeline is the only writer.
  The schema is plain SQL; moving to Postgres for the multi-user API is a
  short, known list of changes (above).
