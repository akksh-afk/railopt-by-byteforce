# Public API Roadmap

How to turn `backend_api/` into a public web API that anyone (the dashboard,
the Control Desk, other teams, judges) can call over the internet. It goes in
four phases, from "working online in a day" to "safe to run for real".

Each phase says **what gets built**, **how it works**, and **when it's done**.
Build the phases in order: each one relies on the one before.

Related: the whole-project plan is in [../ROADMAP.md](../ROADMAP.md), and
the exact data shapes are in [../CONTRACTS.md](../CONTRACTS.md). The
backend's own stage-by-stage roadmap is `backend_api/ROADMAP.md`, added in
PR #4.

| Phase | Name | Effort | Result |
|---|---|---|---|
| 1 | Public read-only API | 1–2 days | A live HTTPS address with docs; anyone can read data |
| 2 | Safe writes + real consumers | 3–5 days | Dashboards use the API; changes need a key; abuse is limited |
| 3 | Persistent and multi-user | 1–2 weeks | Postgres, logins, roles, audit trail; data survives restarts |
| 4 | Production-grade | ongoing | Monitoring, backups, scheduled imports, real data (privately) |

---

## The one rule for a public API

**Anyone may read. Only known callers may change anything.** Everything
that returns data is open. Everything that changes data needs a key (Phase 2)
and later a logged-in user with the right role (Phase 3).

The data behind the public API is **synthetic defect data on real
corridors**, and the API says so in its description. Real TMS / SMMS / TDMS /
COA data must never sit behind a public, open endpoint. It's internal and
safety-sensitive (see Phase 4).

---

## Phase 1: Public read-only API (1–2 days)

### What gets built
- `backend_api/api/server.py`: a FastAPI app that wraps the existing
  `query_api` functions. No business logic is rewritten.
- `backend_api/test_api.py`: checks every endpoint with FastAPI's
  `TestClient`, with no server needed.
- `render.yaml` at the repo root, so Render can set the service up from the
  file.
- `fastapi` and `uvicorn` added to `requirements.txt`.

### Endpoints
| Method | Path | Wraps | Notes |
|---|---|---|---|
| GET | `/v1/health` | — | Returns `{"status": "ok"}` and row counts. Used by the host and uptime checks |
| GET | `/v1/defects?department=&corridor_id=&limit=&offset=` | `get_pending_defects()` | Paginated; `limit` capped at 500; returns `{total, items}` |
| GET | `/v1/notifications?recipient=&unread_only=` | `get_notifications()` | Same data as `notifications.json` |
| GET | `/v1/corridors?zone=&limit=&offset=` | new `get_corridors()` | The 8,622 real track sections |
| GET | `/docs` | automatic | Interactive docs FastAPI generates from the code |

### How it works
```
 caller (browser, script, other team)
        │  HTTPS GET /v1/defects?department=Engineering
        ▼
 Render web service ── uvicorn runs the FastAPI app
        │
        ▼
 query_api.get_pending_defects()  ──►  SQLite (db/railway.db)
        │
        ▼
 JSON response  {"total": 6000, "items": [...]}
```
- **Hosting:** Render, free web service.
  - Build command: `pip install -r requirements.txt && cd backend_api && python run_pipeline.py`
  - Start command: `cd backend_api && uvicorn api.server:app --host 0.0.0.0 --port $PORT`
- **The database is rebuilt on every deploy.** The free disk is wiped on
  restart, so the build step re-imports the CSVs. That takes a few seconds
  and is safe because the pipeline is re-runnable.
- **Why Render and not Vercel** (where the dashboard lives): Vercel runs
  short-lived functions, while this API keeps a database file and the ML
  model loaded. That suits a normal always-on server.
- **CORS** is open (`*`) in this phase, because the API is read-only and
  public.

### Known limits of this phase
- The free tier sleeps after about 15 minutes idle, so the first request
  after that is slow (up to a minute).
- Nothing written survives a restart. That doesn't matter yet, because
  there are no writes.

### Done when
The public address's `/docs` page loads, every GET works from the browser,
and `python test_api.py` passes in CI or locally.

---

## Phase 2: Safe writes and real consumers (3–5 days)

### What gets built
**1. Write endpoints, protected by an API key.**

| Method | Path | Wraps |
|---|---|---|
| POST | `/v1/notifications/{id}/read` | `mark_read()` |
| POST | `/v1/schedules/validated` (body: report + schedule) | `on_schedule_approved()` |

A caller sends the key in an `X-API-Key` header. The server compares it with
the `RAILOPT_API_KEY` environment variable set in Render, so the key is
never in the code. A wrong or missing key gets `401`.

**2. Block requests** (the COA connector from the backend task list):

| Method | Path | What it does |
|---|---|---|
| GET | `/v1/block-requests` | List requests |
| GET | `/v1/block-requests/conflicts` | Overlapping cross-department requests |

**3. Consumers switch over.**
- `dashboard/`'s `getAlerts()` and the Control Desk's `data.js` call the API
  instead of reading static files.
- CORS narrows from `*` to those two sites' addresses for write calls.

**4. Guard rails.**

| Guard | How |
|---|---|
| Rate limiting | `slowapi`, e.g. 60 requests per minute per IP. Excess gets `429 Too Many Requests` |
| One error format | Every error returns `{"error": {"code": ..., "message": ...}}`, so callers handle all errors one way |
| Request log | One line per request: time, path, status, duration. Render keeps these logs |

### Done when
The dashboard's alerts come from the API. A write without a key is refused
and a write with the key works. Hammering the API gets `429`, and the tests
cover all of it.

---

## Phase 3: Persistent and multi-user (1–2 weeks)

### What gets built
| Piece | How it works | Why |
|---|---|---|
| **PostgreSQL** | A hosted database (Render, Neon or Supabase free tier), connected by a `DATABASE_URL` environment variable. `schema.sql` is ported using the checklist in `backend_api/PERSON2_NOTES.md` | Data survives restarts; many writers at once |
| **Migrations** | Numbered SQL files (`001_init.sql`, `002_block_requests.sql`, …) run in order, with the applied ones recorded in a table (the same pattern SecureDocs uses) | The schema can change without wiping data |
| **Logins + roles** | `POST /v1/auth/login` returns a token (JWT). Roles: `department_officer` (their own department's requests), `controller` (everything, can approve), `admin` | Real people, not one shared key |
| **API keys per caller** | An `api_keys` table stores a **hash** of each key, its owner and its rights; keys can be revoked individually | One leaked key doesn't compromise everyone |
| **Audit trail** | An `audit_log` table: who, action, what, when, details. Written on every change; no endpoint can edit or delete it | Accountability for safety-critical decisions |
| **Officer endpoints** | `POST /v1/block-requests`, `PATCH /v1/block-requests/{id}`, `POST /v1/closures/{id}/approve`, `…/send-back` | The workflow the Control Desk UI already shows |

### How it works after Phase 3
```
 Officer's browser ──login──► /v1/auth/login ──► token
        │ token on every request
        ▼
 FastAPI ── checks token + role ──► query functions ──► PostgreSQL
        │                                                 ▲
        └── every change ──► audit_log ───────────────────┘
```

### Done when
Data survives a restart and a redeploy. An S&T officer can't edit an
Engineering request. Every approval appears in `audit_log` with who and
when. The Control Desk runs on live data instead of `data.js`.

---

## Phase 4: Production-grade (ongoing)

Add each item when its condition is true, not before.

| Item | How | Add it when |
|---|---|---|
| Uptime monitoring | A free external pinger (e.g. UptimeRobot) calls `/v1/health` every 5 min and alerts on failure | The API is used outside the team |
| Error tracking | Sentry or similar reports crashes with the stack trace | Real users report problems you can't reproduce |
| Backups | Daily automatic database backup (built into hosted Postgres), and a restore test once a month | Anything in the database can't be rebuilt from CSVs |
| Scheduled imports | A scheduled job runs the pipeline hourly (already safe to repeat) | Source data updates on its own |
| Paid tier / no sleep | Upgrade the hosting plan | Cold starts annoy real users |
| Versioning policy | Breaking changes go to `/v2`; `/v1` keeps working with a published end date | Outside callers depend on `/v1` |
| Caching | `ETag` headers so unchanged data isn't re-sent | Traffic grows |
| **Real railway data** | A **separate, private** deployment: login required for every call, no open endpoints, hosted where Railways approves | Railways formally grants access to TMS / SMMS / TDMS / COA |

---

## Security checklist (applies from Phase 1)

- [ ] HTTPS only (Render provides it)
- [ ] Secrets (API keys, database URL, JWT secret) in environment variables, never in git
- [ ] All SQL uses `?` placeholders. `query_api` already does, which prevents SQL injection
- [ ] Input limits on every list endpoint (`limit` ≤ 500)
- [ ] Writes need a key (Phase 2), then a role (Phase 3)
- [ ] Error responses never include stack traces or file paths
- [ ] Only synthetic data on the public deployment, stated in the API description

---

## Hosting options at a glance

| Host | Free tier | Fits this API? |
|---|---|---|
| **Render** | Yes (sleeps when idle) | **Recommended.** Simple, runs a normal Python server, Postgres available |
| Railway | Trial credit | Yes. Similar to Render, pay-as-you-go afterwards |
| Fly.io | Small allowance | Yes, but more setup (Docker) |
| Vercel | Yes | Not a good fit: short-lived functions, no persistent disk for SQLite or the model |
