# RailOpt — CONTRACTS.md

**Read this before writing any code that consumes or produces data for another
layer.** This file defines the EXACT format of every handoff between team
members' work. If your code's input/output doesn't match what's written here,
integration will break — so if you need to deviate, raise it with the team
before changing anything, don't just change it silently in your own folder.

Every interface below is based on code that is ALREADY BUILT AND WORKING
(Layers 1-5, ML model, and the validator) — this isn't a plan, it's
documentation of what already exists plus what still needs to be built to
match it. Where the code and this file disagreed, the section below says
which one is right and what's still open.

---

## Who owns what

| Person | Role | Layers | Folders | Produces | Consumes |
|---|---|---|---|---|---|
| **Person 1** | ML model + optimizer + what-if sandbox, and the data schema/contracts | 4, 5, 6, 10 (plus the real/synthetic data and this file) | `ml_engine/`, `optimizer_engine/`, `simulation_sandbox/`, `data/`, `CONTRACTS.md` | Interfaces 1, 4; Interfaces 2 and 3 are internal; defines the Interface 7 events | Interface 1 (from Person 2's database), Interfaces 5 and 6 (for the sandbox) |
| **Person 2** | Backend/database + data connectors | 1, 2, 3 + notification delivery | `backend_api/` | Interface 1 (`get_pending_defects()`), Interface 7 (storage + export) | Data files (Person 1), validation reports (Person 3) |
| **Person 3** | Safety validation + weekly/monthly plans | 7, 8 | `validation_engine/` | Interfaces 5, 6 | Interface 4 (from Person 1's optimizer) |
| **Person 4** | Dashboard | 9 | `dashboard/` | What the Controller sees and does | Interfaces 5, 7 |

Person 1 owns the whole chain from a pending defect to a draft schedule:
scoring, free windows, optimizer. So Interfaces 2 and 3 are internal, and
the first hand-off to another person is the draft schedule going to Person 3
for validation (Interface 4). Person 1 also owns the sandbox, which takes the
validated schedule back from Person 3 (Interface 6).

**This table is the authority on ownership.** Code comments and older notes
(e.g. `simulation_sandbox/PERSON6_NOTES.md`, `safety_engine.py`) still use
the earlier six-person numbers.

---

## INTERFACE 1 — Real/Synthetic Data → ML Priority Engine
**Owner: Person 1 (data side) → Person 1 (ML side, same person)**
**Status: DONE. Training file: `data/synthetic/ml_training_dataset.csv`.
Live source: `backend_api` → `get_pending_defects()` (Person 2), same fields.**

| column | type | example |
|---|---|---|
| record_id | string | `TMS002047` (prefix is the source system: `TMS` / `SMMS` / `TDMS`) |
| department | string (enum) | `Engineering` / `Signal & Telecommunication` / `Traction Distribution` |
| corridor_id | string | `COR03213` |
| zone | string | `WR` |
| defect_type | string | `rail_fracture` |
| severity_class | string (enum) | `A` / `B` / `C` |
| severity_score | int | `3` |
| days_overdue | int | `67` |
| corridor_traffic_density | int | `14` |
| estimated_repair_duration_hrs | float | `3.4` |
| requires_traffic_or_power_block | bool | `True` / `False` in the CSV, a real bool from `get_pending_defects()`. The scorer also accepts `"true"`, `1`, `"1"`, `"yes"` (and the false equivalents) |
| label_failure_within_90_days | int (0/1) | `0` — SYNTHETIC target, training only |

**Lifecycle (backend only, not sent to the scorer):** every record in
`defect_records` has `status` = `pending` or `scheduled`.
`get_pending_defects()` returns only `pending` ones. A record becomes
`scheduled` only when a schedule containing it PASSES Layer 7, via
`on_schedule_approved()` (Interface 7). Never mark records when they go into a
draft: if the draft is rejected, they'd drop out of planning for good.

---

## INTERFACE 2 — ML Priority Engine → Optimizer (Person 1, internal)
**Status: DONE on the ML side (`ml_engine/predict_priority.py`). The optimizer
still reads a CSV instead (see Open items).**

The call the optimizer should make is one line, on the whole list:
```python
ranked = score_all_pending_tasks(get_pending_defects())
```
It returns the same records, each with these fields added, sorted by
`final_priority_score` (highest first). Many records sit at the 100 cap, so
ties are broken by `ml_failure_probability`. `score_record(record)` returns
the same fields for one record.

```json
{
  "ml_failure_probability": 0.577,
  "base_score_0_100": 57.7,
  "safety_bonus_applied": 15,
  "final_priority_score": 72.7,
  "explanation": "Model estimates 57.7% chance this leads to failure within 90 days, based mainly on severity_class='A', days_overdue=60, and corridor_traffic_density=30. +15 safety bonus applied for Class A criticality.",
  "needs_review": false
}
```
`needs_review` is `true` when a category (e.g. a new `defect_type`) was never
seen in training. The record is still scored, using a fallback category, and
`explanation` says which value was unknown. Treat its score as unreliable.

**Combined task object the optimizer should work with (per task):**
```json
{
  "record_id": "TMS002047",
  "corridor_id": "COR03213",
  "department": "Engineering",
  "estimated_repair_duration_hrs": 3.4,
  "requires_traffic_or_power_block": true,
  "final_priority_score": 72.7,
  "explanation": "...",
  "needs_review": false
}
```

---

## INTERFACE 3 — Corridor Availability → Optimizer (Person 1, internal)
**Status: DONE. File: `data/derived/corridor_free_windows.csv`**

| column | type | example |
|---|---|---|
| from_station | string | `NDLS` |
| to_station | string | `GZB` |
| free_from_hhmm | string (HH:MM) | `09:00` |
| free_to_hhmm | string (HH:MM) | `13:00` |
| free_duration_min | int | `240` |

Windows are a **daily recurring pattern** from the timetable: there's no date.
The optimizer adds the date when it writes `start_time` / `end_time`
(Interface 4).

Joining to tasks: `from_station` + `to_station` → `corridor_id` through
`data/derived/corridor_master.csv`. `optimizer_engine/corridor_capacity_engine.py`
already does this (and also accepts a `corridor_id` column if one is ever
added).

---

## INTERFACE 4 — Optimizer → Validation Engine (Person 1 → Person 3)
**Status: BOTH SIDES EXIST, BUT DON'T MATCH YET (see Open items).**

**What the optimizer writes** (`optimizer_engine/output/draft_schedule.json`,
first block copied as-is):
```json
{
  "status": "DRAFT_READY_FOR_VALIDATION",
  "generated_by": "OR-Tools CP-SAT Solver v9.15",
  "total_blocks": 4,
  "schedule": [
    {
      "block_id": "BLK_COR-04_03",
      "corridor_id": "COR-04",
      "from_station": "COR-",
      "to_station": "04",
      "start_time": "2026-09-01 23:00",
      "end_time": "2026-09-01 03:00",
      "duration_hrs": 4.0,
      "departments": ["Traction Distribution"],
      "merged_count": 1,
      "tasks": ["D006"],
      "priority_score": 100.0,
      "status": "APPROVED",
      "reason": "OR-Tools CP-SAT merged 1 departmental tasks (Traction Distribution) into a single 4.0h window, saving multiple traffic halts."
    }
  ]
}
```
That one block shows four problems (see Open items):
- `from_station` / `to_station` are slices of the corridor ID, not station
  codes. They should come from `corridor_master`.
- A block that crosses midnight keeps the same date, so it ends before it
  starts.
- There's no `block_type` yet. When it's added it must be one of
  `traffic_block`, `power_block`, `corridor_block` or `megablock` (real IR
  block terminology).
- `status: "APPROVED"` is wrong at this stage, because nothing has validated
  the block yet. It should be `DRAFT`.

**What the validator reads** (`SafetyRuleEngine.run_validation(schedule_df)`
in `validation_engine/src/safety_engine.py`): a DataFrame with **one row per
task**, not per block:

| column | required | example |
|---|---|---|
| task_id | yes | `TMS002047` |
| corridor_id | yes | `COR03213` |
| start_time / end_time | yes | `2026-09-01 09:30` (format `%Y-%m-%d %H:%M`) |
| track_segment | no | `SEG_01` |
| requires_power_cutoff | no | `True` |

The fix is an adapter that turns each block into one row per entry in
`tasks`, all with the block's times. The validator's input is the settled
side (it's done and tested), so Person 1 adapts the optimizer's output to it.

---

## INTERFACE 5 — Validation Engine → Dashboard + Simulation Sandbox
**(Person 3 → Person 4 for the dashboard, Person 3 → Person 1 for the sandbox)**
**Status: DONE. This is the actual return value of `run_validation()`.**

```json
{
  "status": "FAIL",
  "total_violations": 1,
  "violations": [
    {
      "rule_code": "ERR_POWER_ZONE_CONFLICT",
      "task_ids": ["TMS002047"],
      "corridor_id": "COR03213",
      "detail": "TMS002047 cuts power 2026-09-01 09:30-2026-09-01 12:00 on power zone shared with ..."
    }
  ]
}
```
`rule_code` is one of `ERR_TRACK_OVERLAP`, `ERR_TRAIN_HEADWAY_VIOLATION`,
`ERR_POWER_ZONE_CONFLICT`. The report doesn't include the schedule, so pass
both along. On `FAIL`, `multi_horizon.generate_cuts_for_solver(violations)`
turns violations into cuts for the optimizer's retry (Person 1).

After every validation, PASS or FAIL, call
`on_schedule_approved(report, schedule)` from `backend_api/api/query_api.py`
(Interface 7).

---

## INTERFACE 6 — Approved Schedule → What-If Sandbox (Person 3 → Person 1)
Person 1's sandbox takes a **copy** of the approved schedule (Interface 5 output,
`status: PASS`), lets the user modify `start_time`/`end_time` of one block,
then re-runs Interface 4 + 5 logic (lightweight) on just that change —
without writing back to the real approved schedule.

---

## INTERFACE 7 — Notifications (all layers → Dashboard)
**Owner: Person 1 defines the events. Person 2 stores and delivers them
(`backend_api`).**
**Status: DONE for the backend and the dashboard feed. Layer 7 still needs to
call `on_schedule_approved()`.**

| event_type | raised by | when | severity | recipient |
|---|---|---|---|---|
| `HIGH_PRIORITY_DEFECT` | `notify_scored()` after scoring | `ml_failure_probability >= ALERT_MIN_PROBABILITY` (0.995, in `predict_priority.py`; ~2.7% of records) | CRITICAL | Controller + the defect's department |
| `NEEDS_REVIEW` | `notify_scored()` after scoring | `needs_review` is true | HIGH | Controller |
| `RECORD_SKIPPED` | normalizer | a defect was dropped: unknown corridor or severity | MODERATE | Controller |
| `VALIDATION_FAIL` | `on_schedule_approved()` | one per violation in a FAIL report | CRITICAL for `ERR_*`, MODERATE otherwise | Controller |
| `BLOCK_ASSIGNED` | `on_schedule_approved()` | PASS: one per department in each block | MODERATE | each department in the block |

The threshold is on the probability, not on `final_priority_score`, because
the score caps at 100 and ~9% of records hit the cap.

Recipient is `Controller` or an exact department name from Interface 1. The
same `event_type` + reference + recipient is recorded only once.

**Export** (`dashboard/public/notifications.json`, written by
`run_pipeline.py`). It uses the same keys as the dashboard's `mockAlerts`, plus
`recipient` and `read`:
```json
{
  "id": "ALT-1",
  "severity": "CRITICAL",
  "rule_code": "HIGH_PRIORITY_DEFECT",
  "title": "Class A rail_fracture scored 100",
  "message": "TMS000025 (Engineering), 1487 days overdue. Model estimates ...",
  "corridor_id": "COR01757",
  "zone": "WCR",
  "section": "BAYANA JN - DUMARIYA",
  "recipient": "Controller",
  "time": "2026-09-26 10:58:24 UTC",
  "read": false,
  "action_taken": "Waiting for a slot in the next block plan."
}
```

---

## Open items
1. **Person 1:** the optimizer reads `data/synthetic/defects_SCORED.csv`, which
   has 15 hand-made rows with corridor IDs like `COR-01` that don't exist in
   `corridor_master` (so it falls back to default windows), and zones and
   defect types the model never saw (so all 15 scores are fallback guesses,
   flagged `needs_review`). Switch the loader
   to `score_all_pending_tasks(get_pending_defects())`. That's 11,500 real
   records, so rank and cap them first, e.g. top N per planning horizon.
2. **Person 1:** the Interface 4 adapter (blocks → one row per task).
3. **Person 1:** in the optimizer's blocks, fix `from_station`/`to_station`
   (look them up in `corridor_master`), roll the date forward when a block
   crosses midnight, add `block_type`, and set `status` to `DRAFT`.
4. **Person 3:** call `on_schedule_approved(report, schedule)` after each
   validation in `multi_horizon.py`, for PASS and for FAIL.
5. **Person 4:** show the validated weekly/monthly plan in the dashboard
   instead of mock schedule data.
6. **Person 1:** swap the sandbox's own rule check for Person 3's Layer 7
   engine (the seam is marked in `what_if_sandbox.py`).
