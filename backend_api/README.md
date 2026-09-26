# backend_api — Data Ingestion, Normalization, Query API & Notifications

**Owner: Person 2 (Backend/database + data connectors) — RailOpt / SIH26027**

New to this code? Start with [ONBOARDING.md](ONBOARDING.md) (every command, and how it works inside). Next tasks, demo script and judge Q&A: [PERSON2_NOTES.md](PERSON2_NOTES.md). Where the backend is heading, stage by stage: [ROADMAP.md](ROADMAP.md).

## What this does

Three departments — Engineering (TMS), Signal & Telecommunication
(SMMS), Traction Distribution (TDMS) — each publish a defect CSV
(`data/synthetic/`). This layer:

1. **Ingests** each department's CSV as-is -> `raw_defect_ingest`
2. **Loads** `data/derived/corridor_master.csv` (real corridor
   reference data) -> `corridor_master`
3. **Normalizes**: derives `severity_score` from `severity_class`,
   joins `corridor_traffic_density` from `corridor_master`, sets
   `status = 'pending'` -> writes to `defect_records`
4. **Exposes** `get_pending_defects()` — the function other layers
   call instead of reading CSVs or querying SQL directly
5. **Scores and notifies**: runs Person 1's `score_all_pending_tasks()`
   over the pending defects, records alerts in `notifications`, and
   exports them to `dashboard/public/notifications.json` for the
   dashboard's Alerts feed

```
TMS CSV        SMMS CSV       TDMS CSV
     \             |              /
      v             v             v
          raw_defect_ingest table
                     |
                     v      corridor_master table
                     |            |
                     v            v
                 normalizer.py ---------------> notifications (RECORD_SKIPPED)
                     |
                     v
          defect_records table
                     |
                     v
       api/query_api.get_pending_defects()
                     |
                     v
   ml_engine score_all_pending_tasks() ------> notifications (HIGH_PRIORITY_DEFECT,
                                                               NEEDS_REVIEW)
   Layer 7 report -> on_schedule_approved() -> notifications (BLOCK_ASSIGNED,
                                                               VALIDATION_FAIL)
                                                     |
                                                     v
                              dashboard/public/notifications.json
```

## Field derivations

| Field | How it's derived |
|---|---|
| `severity_score` | From `severity_class`: A=3, B=2, C=1 |
| `corridor_traffic_density` | Joined from `corridor_master.num_trains_using` via `corridor_id` |
| `requires_traffic_or_power_block` | TMS/SMMS use `requires_traffic_block`; TDMS uses `requires_power_block` — both map to this one field |
| `status` | `'pending'` when normalized; `'scheduled'` once a schedule containing it passes Layer 7 (CONTRACTS.md Interface 1) |

## Project structure

```
backend_api/
├── connectors/
│   ├── engineering_connector.py   # loads synthetic_TMS_engineering_defects.csv
│   ├── signal_connector.py        # loads synthetic_SMMS_signal_defects.csv
│   └── traction_connector.py      # loads synthetic_TDMS_traction_defects.csv
├── normalize/
│   ├── corridor_master_loader.py  # loads corridor_master.csv
│   └── normalizer.py              # raw_defect_ingest -> defect_records
├── api/
│   └── query_api.py               # get_pending_defects(), mark_scheduled(), notification functions
├── db/
│   ├── schema.sql                 # CREATE TABLE statements (source of truth)
│   └── railway.db                 # gitignored — built from schema.sql, never commit
├── run_pipeline.py                # runs everything end to end
└── test_pipeline.py               # end-to-end check on a throwaway database
```

## How to run it

```bash
pip install -r ../requirements.txt

# Applies schema.sql -> loads corridors -> runs all 3 connectors ->
# normalizes -> scores -> raises and exports notifications
python3 run_pipeline.py

# End-to-end check (never touches db/railway.db)
python3 test_pipeline.py
```

Safe to re-run: records are ingested, normalized and notified once, so a
second run reports `0 new` everywhere. An existing `railway.db` is upgraded
in place (new table and index), no need to delete it.

Expect:
```
raw_defect_ingest total: 11500
defect_records total:    11500
By department: [('Engineering', 6000), ('Signal & Telecommunication', 3000), ('Traction Distribution', 2500)]
get_pending_defects() returned: 11500 records
Notifications by type: [('HIGH_PRIORITY_DEFECT', 620)]
```
(620 = 310 defects at ≥ 99.5% failure probability, each sent to the
Controller and to its own department.)

## How other layers should use this

```python
from api.query_api import get_pending_defects, on_schedule_approved
from predict_priority import score_all_pending_tasks

records = get_pending_defects()                          # all pending
records = get_pending_defects(department="Engineering")  # filtered
records = get_pending_defects(corridor_id="COR03086")    # filtered

# field names already match: pass the whole list, get it back ranked
ranked = score_all_pending_tasks(records)

# after Layer 7 checks a schedule (PASS or FAIL), hand both over.
# PASS marks the tasks scheduled and notifies each department in a block;
# FAIL raises one alert per violation and marks nothing.
on_schedule_approved(report, schedule)
```

Don't call `mark_scheduled()` when a record goes into a *draft*: if Layer 7
then rejects the draft, that defect disappears from `get_pending_defects()`
and never gets rescheduled. `on_schedule_approved()` only marks after PASS.

## Notifications (CONTRACTS.md Interface 7)

| Event | Raised by | Sent to |
|---|---|---|
| `HIGH_PRIORITY_DEFECT` | `notify_scored()`, for `ml_failure_probability >= ALERT_MIN_PROBABILITY` (0.995, set in `ml_engine/predict_priority.py`) | Controller + the defect's department |
| `NEEDS_REVIEW` | `notify_scored()`, when the model met a category it never saw in training | Controller |
| `RECORD_SKIPPED` | `normalizer.py`, when a record's corridor or severity isn't recognised | Controller |
| `VALIDATION_FAIL` | `on_schedule_approved()` on a FAIL report, one per violation | Controller |
| `BLOCK_ASSIGNED` | `on_schedule_approved()` on a PASS report, one per department per block | each department in the block |

- `notify(list_of_dicts)` records alerts; repeats of the same event, reference
  and recipient are ignored.
- `get_notifications(recipient=None, unread_only=False)` and
  `mark_read(id)` read them back.
- `export_notifications(path)` writes the dashboard JSON.

There's no web server, so the dashboard reads the exported file, the same
way it reads `allCorridors.json`. New alerts show up after the next
pipeline run and a page refresh. Email, SMS and live push are left out
until there is a server (see ROADMAP.md).

## Open items

- `on_schedule_approved()` isn't called by anyone yet — Person 3's
  `multi_horizon.py` is the natural caller (on PASS and on FAIL).
- The optimizer still reads `data/synthetic/defects_SCORED.csv` instead
  of `get_pending_defects()` + `score_all_pending_tasks()` — see
  ROADMAP.md.
