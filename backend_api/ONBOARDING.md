# Backend onboarding — how `backend_api/` works

A guide for a new engineer taking over the backend and database (Person 2 in
[CONTRACTS.md](../CONTRACTS.md)). It explains every command you'll use and
what happens inside when you run it. Read this first, then
[PERSON2_NOTES.md](PERSON2_NOTES.md) for the task list.

All commands are run from the **repo root** unless a step says
`cd backend_api`. They work the same in Git Bash, PowerShell and Linux
terminals. Where a command differs by shell, both versions are given.

---

## 1. The big picture in one diagram

```
 data/synthetic/*.csv          data/derived/corridor_master.csv
 (TMS, SMMS, TDMS files)       (8,622 real track sections)
          │                                  │
          ▼                                  ▼
   connectors/*.py                corridor_master_loader.py
          │                                  │
          ▼                                  ▼
   raw_defect_ingest  ──────►  normalizer.py  ◄──── corridor_master
   (copied as-is)                   │
                                    ▼
                             defect_records          (one clean, standard shape)
                                    │
                                    ▼
                 api/query_api.py  get_pending_defects()
                                    │
                   ┌────────────────┼──────────────────────────┐
                   ▼                ▼                          ▼
      ml_engine scores them   optimizer (Person 1)    notifications table
                   │                                           │
                   └──► notify_scored() ───────────────────────┤
                                                               ▼
                                    dashboard/public/notifications.json
                                         (read by the dashboard)
```

Everything lives in one SQLite file, `backend_api/db/railway.db`. It's
gitignored and rebuilt from the CSVs whenever you want.

---

## 2. One-time setup

### `pip install -r requirements.txt`
**What it does:** installs the Python libraries the project needs, at the
exact versions listed in `requirements.txt` at the repo root.

**How it works:** `pip` reads the file line by line. `xgboost==3.2.0` means
"exactly this version". The versions are pinned because the trained model
(`ml_engine/models/`) can only be loaded by the library versions that saved
it. A different scikit-learn version can fail to read `label_encoders.pkl`.

**Tip:** do it inside a virtual environment, so these versions don't clash
with other projects on your machine:
```bash
python -m venv .venv
# Git Bash / Linux / macOS:
source .venv/bin/activate          # (Git Bash on Windows: source .venv/Scripts/activate)
# PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
`python -m venv .venv` creates a private folder `.venv/` holding its own
Python. "Activating" it makes `python` and `pip` point at that folder until
you close the terminal.

The backend itself only uses Python's built-in `sqlite3`, `csv` and `json`.
The extra libraries are for the ML scoring step.

---

## 3. The main command

### `cd backend_api` then `python run_pipeline.py`
**What it does:** builds or updates the whole database and exports the
alerts. It's safe to run any number of times.

**What happens inside, step by step** (these are the `[0/6]`…`[6/6]` lines
it prints):

| Printed step | Code | What it does |
|---|---|---|
| `[0/6] Applying schema` | `apply_schema()` | Runs every statement in `db/schema.sql`. Each one is `CREATE … IF NOT EXISTS`, so on an existing database it only adds what's missing. That's how an old `railway.db` picks up new tables without being deleted. |
| `[1/6] Loading corridor_master` | `normalize/corridor_master_loader.py` → `load()` | Reads `data/derived/corridor_master.csv` and inserts each track section. A section already present raises `IntegrityError` (same primary key), which is caught and skipped. |
| `[2/6]`–`[4/6]` connectors | `connectors/engineering_connector.py`, `signal_connector.py`, `traction_connector.py` → `run()` | Each reads one department's CSV and inserts every row into `raw_defect_ingest` **as-is**. The whole original row is also saved as JSON in `raw_payload`. Uses `INSERT OR IGNORE` (explained below), so rows already ingested are skipped. Prints `Loaded N new of M`. |
| `[5/6] Running normalizer` | `normalize/normalizer.py` → `run()` | Takes raw rows not yet in `defect_records` and converts each to the standard shape (below). A row it can't place (unknown track section or severity) is skipped and raises a `RECORD_SKIPPED` alert. |
| `[6/6] Scoring … notifications` | `run()` in `run_pipeline.py` | Fetches pending defects, scores all of them in one batch with the ML model, turns the most urgent into alerts (`notify_scored()`), then writes all alerts to `dashboard/public/notifications.json` (`export_notifications()`). |
| `=== PIPELINE SUMMARY ===` | `print_summary()` | Counts rows in each table so you can see the result at a glance. |

**What the normalizer changes, field by field:**

| Raw field (per department) | Becomes | Rule |
|---|---|---|
| `tms_record_id` / `smms_record_id` / `tdms_record_id` | `record_id` | rename only |
| `requires_traffic_block` (TMS, SMMS) or `requires_power_block` (TDMS) | `requires_traffic_or_power_block` | done by the connectors; stored as 1/0 |
| `severity_class` A / B / C | `severity_score` 3 / 2 / 1 | fixed mapping |
| *(not in the file)* | `corridor_traffic_density` | looked up: `corridor_master.num_trains_using` for that `corridor_id` |
| *(not in the file)* | `status` | always `'pending'` when first normalized |

**Expected output on the current data:**
```
raw_defect_ingest total: 11500
defect_records total:    11500
By department: [('Engineering', 6000), ('Signal & Telecommunication', 3000), ('Traction Distribution', 2500)]
get_pending_defects() returned: 11500 records
Notifications by type: [('HIGH_PRIORITY_DEFECT', 620)]
```
Run it a second time and every step says `0 new`. That's the "safe to re-run"
guarantee.

### The two tricks that make re-runs safe
1. **A unique key.** `schema.sql` has
   `CREATE UNIQUE INDEX … ON raw_defect_ingest(department, source_record_id)`.
   The database itself refuses a second row with the same department and
   record ID.
2. **`INSERT OR IGNORE`.** A plain `INSERT` that breaks a unique key throws
   an error. `INSERT OR IGNORE` quietly skips that row instead. The
   connectors count what was really added using `conn.total_changes`
   (SQLite's running count of changed rows): the value after the inserts
   minus the value before.

The `notifications` table uses the same pair,
`UNIQUE (event_type, ref_id, recipient)` plus `INSERT OR IGNORE`, so the same
alert is never stored twice. The normalizer avoids duplicates differently: it
uses a `LEFT JOIN … WHERE d.record_id IS NULL` to pick only the raw rows that
have no matching `defect_records` row yet.

---

## 4. The test

### `cd backend_api` then `python test_pipeline.py`
**What it does:** proves the backend still works, without touching your real
database. Run it before every push that changes `backend_api/`. It ends with
`OK: backend pipeline, notifications and scorer checks passed`, or stops at
the first failing `assert`.

**How it works:**
- `tempfile.TemporaryDirectory()` makes a throwaway folder that's deleted
  afterwards. The whole pipeline runs into a database there (`run(db, out)`
  takes the database and export paths as arguments).
- **Re-run check:** it runs the pipeline twice and asserts the row counts
  didn't change.
- **Export check:** it asserts the JSON has the keys the dashboard reads.
- **Approval checks:** it sends a fake FAIL report and asserts nothing was
  marked scheduled and one `VALIDATION_FAIL` alert exists. Then it sends a
  PASS and asserts two defects became `scheduled` and each of the two
  departments got a `BLOCK_ASSIGNED` alert.
- **Scorer checks:** it asserts that `"true"`, `"TRUE"`, `1`, `"1"` and
  `"yes"` all score the same as `True`, and that an unknown defect type comes
  back with `needs_review`.

`assert x == y` means "stop the program with an error if this isn't true".
That's the whole test framework here, with no extra tools.

---

## 5. Running pieces on their own

Every module can also be run by itself. That's useful when you're changing
just one part. Run these inside `backend_api/`, after `run_pipeline.py` has
created the database at least once:

| Command | What it does |
|---|---|
| `python connectors/engineering_connector.py` | Ingests just the TMS file (same for `signal_connector.py`, `traction_connector.py`) |
| `python normalize/corridor_master_loader.py` | Loads just the track sections |
| `python normalize/normalizer.py` | Normalizes whatever raw rows are waiting |
| `python api/query_api.py` | Prints how many defects are pending, plus 3 examples. A quick "is the database healthy?" check |

They work because each file ends with `if __name__ == "__main__": run()`.
That block runs only when you start the file directly, not when another file
imports it.

---

## 6. Looking inside the database

`railway.db` is an ordinary SQLite file. You don't need to install anything
to query it, because Python has SQLite built in:

```bash
cd backend_api
python -c "import sqlite3; c = sqlite3.connect('db/railway.db'); print(c.execute('SELECT status, COUNT(*) FROM defect_records GROUP BY status').fetchall())"
```
- `sqlite3.connect(...)` opens the file.
- `.execute('SQL')` runs a query.
- `.fetchall()` returns the rows as a Python list.

Swap in any SQL you like. Some handy queries:

```sql
SELECT name FROM sqlite_master WHERE type = 'table';                 -- list tables
SELECT * FROM defect_records WHERE record_id = 'TMS000001';          -- one defect
SELECT event_type, recipient, COUNT(*) FROM notifications
  GROUP BY event_type, recipient;                                     -- who got which alerts
SELECT raw_payload FROM raw_defect_ingest LIMIT 1;                    -- an original row, untouched
```
If you prefer a visual tool, "DB Browser for SQLite" opens the file directly.

### Starting from scratch
Delete the database file, then run the pipeline again:
```bash
rm db/railway.db              # Git Bash / Linux / macOS
del db\railway.db             # Windows cmd
Remove-Item db\railway.db     # PowerShell
python run_pipeline.py
```
You rarely need this: an existing database upgrades itself (step 0 above).

---

## 7. How the functions other people call work

All in `api/query_api.py`. Each opens its own database connection, does one
job and closes it.

| Function | How it works |
|---|---|
| `get_pending_defects(department=None, corridor_id=None)` | `SELECT … FROM defect_records WHERE status = 'pending'`, adding `AND department = ?` / `AND corridor_id = ?` only if you pass them. The `?` placeholders keep input as data, so it can never be run as SQL (no SQL injection). Converts the stored 1/0 back to `True`/`False`. |
| `mark_scheduled(record_id)` | `UPDATE defect_records SET status = 'scheduled' WHERE record_id = ?`. Returns `True` if a row changed. Don't call it for draft plans; use `on_schedule_approved()`. |
| `notify(list_of_dicts)` | One `executemany` of `INSERT OR IGNORE INTO notifications`, one commit for the whole list. Returns how many were new. |
| `notify_scored(ranked, min_probability)` | Loops over scored defects. Probability ≥ threshold (0.995) → two `HIGH_PRIORITY_DEFECT` alerts (Controller + department); `needs_review` → one `NEEDS_REVIEW`. Then calls `notify()`. |
| `on_schedule_approved(report, schedule)` | If `report["status"]` isn't `PASS`, turns each violation into a `VALIDATION_FAIL` alert and stops. Nothing is marked. If PASS, calls `mark_scheduled()` for every task in every block and sends `BLOCK_ASSIGNED` to each department in the block. |
| `get_notifications(recipient=None, unread_only=False)` / `mark_read(id)` | Read alerts back / stamp `read_at`. Ready for the future web API. |
| `export_notifications(path)` | Joins `notifications` with `corridor_master` (to add zone and station names) and writes a JSON list with the same keys the dashboard's mock alerts used. |

**How the dashboard gets alerts:** there's no web server yet. The pipeline
writes `dashboard/public/notifications.json`. The dashboard's `getAlerts()`
(in `dashboard/src/api/api.js`) fetches that file when the page loads, and
falls back to its built-in mock alerts if the file is missing. New alerts
appear after the next pipeline run plus a page refresh.

---

## 8. The SQL in PERSON2_NOTES.md, explained

### Creating the `block_requests` table (next task)
```sql
CREATE TABLE IF NOT EXISTS block_requests (
    request_id TEXT PRIMARY KEY, ...
    start_time TEXT NOT NULL,   -- 'YYYY-MM-DD HH:MM'
    end_time   TEXT NOT NULL, ...
);
```
- `CREATE TABLE IF NOT EXISTS` creates the table only if it isn't there, so
  it's safe in `schema.sql`, which runs every time.
- `PRIMARY KEY` makes `request_id` unique, which is what `INSERT OR IGNORE`
  relies on.
- `NOT NULL` means the database rejects a row without that value.
- `DEFAULT (datetime('now'))` fills in the current UTC time if you don't
  supply one.

Times are stored as text in `'YYYY-MM-DD HH:MM'` form on purpose. In that
format, comparing the text alphabetically gives the same answer as comparing
the times (`'2026-01-09 23:00' < '2026-01-10 01:00'`), so SQL can compare
them directly. When you compute `end_time`, add the duration to a real
`datetime` in Python (`start + timedelta(hours=...)`) so a closure that runs
past midnight moves to the next date.

### Finding overlapping requests
```sql
SELECT a.request_id, b.request_id, a.corridor_id
FROM block_requests a
JOIN block_requests b
  ON a.corridor_id = b.corridor_id      -- same stretch of track
 AND a.request_id < b.request_id        -- each pair once, never a row with itself
 AND a.department <> b.department       -- different departments
 AND a.start_time < b.end_time          -- a starts before b ends...
 AND b.start_time < a.end_time;         -- ...and b starts before a ends = they overlap
```
This is a **self-join**: the table is compared with itself, under two
nicknames (`a` and `b`). The last two lines are the standard test for "two
time ranges overlap". If either one is false, one range ends before the
other begins. On the current data this returns **0 rows**. That's a data
problem, not a query problem: see PERSON2_NOTES.md.

### Adding station codes to pending defects
```sql
SELECT d.*, c.from_station, c.to_station
FROM defect_records d JOIN corridor_master c USING (corridor_id)
WHERE d.status = 'pending'
```
`JOIN … USING (corridor_id)` matches each defect to its track section by the
shared `corridor_id` column. `d.*` means "all defect columns". The station
codes come from the matched section.

### The SQLite → Postgres checklist
When several people use the system at once through a web API, SQLite
(one writer at a time) should become Postgres. The notes list the syntax
differences: auto-numbered IDs, the "now" function, `INSERT OR IGNORE`
becoming `ON CONFLICT DO NOTHING`, parameter style, and booleans. The table
design and the logic don't change.

---

## 9. Your first day

1. `pip install -r requirements.txt` (in a virtual environment).
2. `cd backend_api`, then `python run_pipeline.py`. Check the summary matches
   section 3.
3. Run `python run_pipeline.py` again. Everything should say `0 new`.
4. `python test_pipeline.py`. It should end with `OK`.
5. Run the queries in section 6 and look at a raw row next to its
   normalized row.
6. Read [PERSON2_NOTES.md](PERSON2_NOTES.md) and start on task 1 (the COA
   connector). Copy the pattern of `connectors/engineering_connector.py`.
