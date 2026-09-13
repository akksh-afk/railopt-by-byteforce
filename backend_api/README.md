# backend_api — Data Ingestion, Normalization & Query API

**Owner: Person 2 (Backend/database + data connectors) — RailOpt / SIH26027**

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

```
TMS CSV        SMMS CSV       TDMS CSV
     \             |              /
      v             v             v
          raw_defect_ingest table
                     |
                     v      corridor_master table
                     |            |
                     v            v
                 normalizer.py
                     |
                     v
          defect_records table
                     |
                     v
       api/query_api.get_pending_defects()
```

## Field derivations

| Field | How it's derived |
|---|---|
| `severity_score` | From `severity_class`: A=3, B=2, C=1 |
| `corridor_traffic_density` | Joined from `corridor_master.num_trains_using` via `corridor_id` |
| `requires_traffic_or_power_block` | TMS/SMMS use `requires_traffic_block`; TDMS uses `requires_power_block` — both map to this one field |
| `status` | Set to `'pending'` for every newly normalized record |

**Note:** `status` is not part of CONTRACTS.md Interface 1 — it's an
addition needed so `get_pending_defects()` has something to filter on.
Flagging this per the contract's "golden rule" (any deviation should
be documented, not silent).

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
│   └── query_api.py               # get_pending_defects(), mark_scheduled()
├── db/
│   ├── schema.sql                 # CREATE TABLE statements (source of truth)
│   └── railway.db                 # gitignored — rebuild from schema.sql, never commit
└── run_pipeline.py                # runs everything end to end
```

## How to run it

```bash
# Rebuild the database from schema.sql
python3 -c "import sqlite3; conn=sqlite3.connect('db/railway.db'); conn.executescript(open('db/schema.sql').read()); conn.commit()"

# Load corridors -> run all 3 connectors -> normalize -> confirm query API works
python3 run_pipeline.py
```

Expect:
```
raw_defect_ingest total: 11500
defect_records total:    11500
By department: [('Engineering', 6000), ('Signal & Telecommunication', 3000), ('Traction Distribution', 2500)]
get_pending_defects() returned: 11500 records
```

## How other layers should use this

```python
from api.query_api import get_pending_defects, mark_scheduled

records = get_pending_defects()                          # all pending
records = get_pending_defects(department="Engineering")  # filtered
records = get_pending_defects(corridor_id="COR03086")     # filtered

# feed straight into the ML scoring function — field names already match
for r in records:
    score = score_all_pending_tasks(r)

# once a record is placed into a draft schedule:
mark_scheduled(r["record_id"])
```

## Open items

- Person 1 is preparing prioritized/updated data files and will push
  them directly — once those land, re-run `run_pipeline.py` against
  the new files (delete `db/railway.db` and rebuild first, so nothing
  stale lingers).
- `status` column is our addition beyond CONTRACTS.md — flagged above,
  confirm it doesn't conflict with anything downstream builds.
