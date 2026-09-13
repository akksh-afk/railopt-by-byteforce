# RailOpt — CONTRACTS.md

**Read this before writing any code that consumes or produces data for another
layer.** This file defines the EXACT format of every handoff between team
members' work. If your code's input/output doesn't match what's written here,
integration will break — so if you need to deviate, raise it with the team
before changing anything, don't just change it silently in your own folder.

Every interface below is based on code that is ALREADY BUILT AND WORKING
(Layers 1-5, ML model, and Person 4's validator) — this isn't a plan, it's
documentation of what already exists plus what still needs to be built to
match it.

---

## INTERFACE 1 — Real/Synthetic Data → ML Priority Engine
**Owner: Person 1 (data side) → Person 1 (ML side, same person)**
**Status: DONE. File: `data/synthetic/ml_training_dataset.csv`**

| column | type | example |
|---|---|---|
| record_id | string | `SYN005596` |
| department | string (enum) | `Engineering` / `Signal & Telecommunication` / `Traction Distribution` |
| corridor_id | string | `COR03213` |
| zone | string | `WR` |
| defect_type | string | `rail_fracture` |
| severity_class | string (enum) | `A` / `B` / `C` |
| severity_score | int | `3` |
| days_overdue | int | `67` |
| corridor_traffic_density | int | `14` |
| estimated_repair_duration_hrs | float | `3.4` |
| requires_traffic_or_power_block | string (bool) | `True` / `False` |
| label_failure_within_90_days | int (0/1) | `0` — SYNTHETIC target, training only |

---

## INTERFACE 2 — ML Priority Engine → Optimizer (Person 1 → Person 3)
**Status: DONE on Person 1's side (`predict_priority.py`). Person 3 needs to
consume this.**

Calling `score_record(record)` (see `ml_engine/predict_priority.py`) returns:

```json
{
  "ml_failure_probability": 0.577,
  "base_score_0_100": 57.7,
  "safety_bonus_applied": 15,
  "final_priority_score": 72.7,
  "explanation": "Model estimates 57.7% chance this leads to failure within 90 days, based mainly on severity_class='A', days_overdue=60, and corridor_traffic_density=30. +15 safety bonus applied for Class A criticality."
}
```

**What Person 3 needs to build:** a loop that calls `score_record()` for every
pending defect record (pulled from Person 2's database), attaches
`final_priority_score` to each task, and sorts descending — this ranked list
is the optimizer's primary input.

**Combined task object the optimizer should work with (per task):**
```json
{
  "record_id": "SYN005596",
  "corridor_id": "COR03213",
  "department": "Engineering",
  "estimated_repair_duration_hrs": 3.4,
  "requires_traffic_or_power_block": true,
  "final_priority_score": 72.7,
  "explanation": "..."
}
```

---

## INTERFACE 3 — Corridor Availability → Optimizer (Person 1 → Person 3)
**Status: DONE. File: `data/derived/corridor_free_windows.csv`**

| column | type | example |
|---|---|---|
| from_station | string | `NDLS` |
| to_station | string | `GZB` |
| free_from_hhmm | string (HH:MM) | `09:00` |
| free_to_hhmm | string (HH:MM) | `13:00` |
| free_duration_min | int | `240` |

**Note for Person 3:** join this to tasks via `corridor_id` → you'll need
`corridor_master.csv` (`from_station`+`to_station` → `corridor_id` mapping)
to connect the two. Both files are in `data/derived/`.

---

## INTERFACE 4 — Optimizer → Validation Engine (Person 3 → Person 4)
**Status: NEEDS TO BE BUILT by Person 3, in this exact shape, since Person
4's validator already expects this format (confirmed from her test files:
`test_headway_violation_fails`, `PowerZoneEngine`, `run_full_validation`).**

A **draft schedule** = a list of block objects:
```json
{
  "block_id": "BLK00001",
  "corridor_id": "COR03213",
  "from_station": "NDLS",
  "to_station": "GZB",
  "start_time": "2026-08-28 09:00",
  "end_time": "2026-08-28 11:30",
  "departments": ["Engineering", "Signal & Telecommunication"],
  "tasks": ["SYN005596", "SYN004448"],
  "block_type": "traffic_block"
}
```
`block_type` must be one of: `traffic_block`, `power_block`, `corridor_block`,
`megablock` (matches real IR block terminology, see project brief).

**Action needed:** Person 3 and Person 4 should confirm this matches her
`run_full_validation(schedule)` function's expected input exactly — she may
need slightly different field names based on what she's already built. Check
this FIRST before writing more optimizer code.

---

## INTERFACE 5 — Validation Engine → Dashboard + Simulation Sandbox
**(Person 4 → Person 5, Person 4 → Person 6)**
**Status: Person 4's validator produces a report — needs confirmation of
exact output shape from her.**

Expected shape (to be confirmed with Person 4):
```json
{
  "schedule": [ /* same block objects as Interface 4, now marked approved */ ],
  "violations": [
    {"code": "ERR_POWER_ZONE_CONFLICT", "block_id": "BLK00002", "detail": "..."}
  ],
  "status": "PASS"
}
```
If `status` is `FAIL`, the schedule goes back to Person 3 (Interface 4) with
the `violations` list attached, so the optimizer knows what to avoid on retry.

**Action needed:** Person 4 to confirm/correct this against her actual code.

---

## INTERFACE 6 — Approved Schedule → What-If Sandbox (Person 4 → Person 6)
Person 6 takes a **copy** of the approved schedule (Interface 5 output,
`status: PASS`), lets the user modify `start_time`/`end_time` of one block,
then re-runs Interface 4 + 5 logic (lightweight) on just that change —
without writing back to the real approved schedule.

---

## Open items — resolve these THIS WEEK, in order of urgency
1. **Person 3 + Person 4:** confirm Interface 4's exact field names match her
   existing validator code — this blocks the optimizer from being usable at all.
2. **Person 4:** confirm Interface 5's output shape (or paste her actual
   function signature here).
3. **Person 2:** confirm how the database will expose Interface 1/2 data —
   i.e., what function/query other layers call to get pending defect records
   (rather than reading CSVs directly).
4. **Person 5 + Person 6:** once Interface 5 is confirmed, both can start
   building against a hand-written sample JSON file matching the format,
   without waiting for Person 3's optimizer to be fully done.

---

## Golden rule
If your code's actual output doesn't match what's written here, **update
this file in the same commit** and mention it to the team — don't let this
document go stale while the code changes underneath it. A wrong contract is
worse than no contract, because everyone will trust it blindly.
