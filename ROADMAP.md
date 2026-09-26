# RailOpt — Roadmap

What every feature does, where it stands today, and what comes next. For the
problem and approach see [README.md](README.md); for the exact data handed
between layers see [CONTRACTS.md](CONTRACTS.md).

**One principle runs through all of it:** RailOpt recommends and explains; a
human Controller/DRM decides. Nothing here authorises a block on its own, and
nothing will. That's a deliberate choice for safety-critical infrastructure,
not a missing feature.

---

## Where things stand

| # | Feature | Owner | Status |
|---|---|---|---|
| 1 | Data ingestion (TMS, SMMS, TDMS connectors) | Person 2 | **Done** · COA connector missing |
| 2 | Unified database | Person 2 | **Done** (SQLite) |
| 3 | Normalization | Person 2 | **Done** |
| 4 | ML priority engine | Person 1 | **Done** |
| 5 | Corridor capacity engine | Person 3 | **Done** · falls back to made-up windows for unknown corridors |
| 6 | Constraint optimizer (OR-Tools) | Person 3 | **Works on demo data** · not yet fed from the database |
| 7 | Safety rule engine | Person 3 | **Done** · input shape doesn't match the optimizer's output yet |
| 8 | Weekly + monthly plans | Person 3 | **Works on sample data** |
| 9 | Controller dashboard | Person 4 | **Built** · corridors and alerts are real, the rest is mock data |
| 10 | What-if sandbox | Person 4 | **Done** as a standalone demo |
| — | Notifications | Person 1 + 2 | **Done** for the backend and the dashboard feed |

The one gap that matters most: **the layers work, but they aren't one
pipeline yet.** The optimizer plans 15 hand-made records instead of the
11,500 in the database, and nothing connects its output to the validator.
Phase 1 below closes that.

---

## The features, explained

### 1–3. Ingestion, database and normalization (`backend_api/`)
Each department keeps its records differently. TMS and SMMS say
`requires_traffic_block`, TDMS says `requires_power_block`, and each has its
own ID scheme. Three connectors load each department's file untouched into
`raw_defect_ingest`, with the original row kept as JSON so nothing is lost.
The normalizer then maps everything onto one schema:
- `severity_class` becomes a score.
- Each defect is joined to one of **8,622 real corridors**, derived from
  data.gov.in timetables.
- The two block flags are unified into one field.

Other layers call one function, `get_pending_defects()`, instead of reading
files. Re-running the pipeline is safe: nothing is ingested twice.

*Why it matters:* this is the "unified view" the problem statement asks for.
Swapping a synthetic file for a real TMS feed means changing one connector;
nothing downstream changes.

### 4. ML priority engine (`ml_engine/`)
Scores every defect 0–100 by how likely it is to cause a failure within
90 days if ignored, and gives a one-line reason. It's an XGBoost classifier
trained on 11,500 records. On 2,300 held-out records it gets **95.9% recall,
0.986 ROC-AUC** and 64.4% precision. It's tuned for recall on purpose: a
false alarm costs a site visit, a missed defect can cost a derailment. A
fixed safety bonus (+15 for Class A, +5 for B) sits on top of the model, so
the model is never the only safety check. Records with categories the model
has never seen are still scored, but flagged `needs_review`.

*Honest caveat for judges:* the failure label is synthetic, calibrated to CAG
Audit Report No. 45. The metrics show the model learned that calibrated
pattern, not that it's proven on real failures. The training script is
reproducible byte-for-byte and retrains unchanged on real history.

### 5. Corridor capacity engine (`optimizer_engine/corridor_capacity_engine.py`)
Works out when each corridor is actually free: 24 hours minus real timetable
occupancy (`data/derived/corridor_free_windows.csv`). It offers the optimizer
up to three windows of at least 1.5 hours per corridor.
*Known gap:* for a corridor it can't find, it quietly returns three default
windows (09:30, 13:00, 23:00). That's fine for a demo, but it should say so
rather than pass them off as real capacity.

### 6. Constraint optimizer (`optimizer_engine/block_optimizer.py`)
The core idea: **three departments' separate requests become one shared
block.** Google OR-Tools CP-SAT packs ranked tasks into free windows. The
objective rewards priority and charges for every window opened, so the
solver puts compatible tasks from different departments into the same
window.
*Known gaps:* see Phase 1. The inputs are 15 demo rows whose zones and
defect types the model was never trained on (e.g. `zone=Northern`), so their
priority scores are fallback guesses; the scorer now flags all 15
`needs_review`. Station names come from slicing the corridor ID. Blocks that
cross midnight keep the same date, and blocks are labelled `APPROVED` before
anything has validated them.

### 7. Safety rule engine (`validation_engine/src/safety_engine.py`)
A deterministic, non-ML check that rejects any draft breaking a hard rule:
two tasks on the same track segment at once, less than 15 minutes' headway
to a train, or cutting power on a zone an electric train is about to use.
It returns PASS, or FAIL with the exact rule and tasks involved. On FAIL,
the violations become "cuts" the optimizer avoids on its next attempt.

### 8. Multi-horizon plans (`validation_engine/multi_horizon.py`)
Produces both plans the problem statement asks for: a **weekly** tactical
plan (minute-level) and a **monthly** strategic plan. Each one is validated
before export. Today it runs on sample data.

### 9. Controller dashboard (`dashboard/`)
React map, calendar and detail views for the Controller, with a
plain-English "why was this scheduled here" trace for each block. Corridors
come from real data and **alerts now come from the pipeline**. Summary,
schedule and decision trace are still mock data until Phase 1 delivers a
validated plan to show.

### 10. What-if sandbox (`simulation_sandbox/`)
Drag a block to another time and immediately see PASS/FAIL and the change in
downtime, on a copy, so the approved plan is never touched. It has its own
lightweight rule check, with a clear point to plug in the full Layer 7
engine (see `PERSON6_NOTES.md`).

### Notifications (`backend_api/api/query_api.py` → dashboard Alerts feed)
The pipeline tells people when something needs attention (CONTRACTS.md
Interface 7):

| Event | Who hears | When |
|---|---|---|
| High-priority defect | Controller + that department | Failure probability ≥ 99.5% (310 of 11,500 today) |
| Needs review | Controller | The model saw a category it wasn't trained on |
| Record skipped | Controller | A defect couldn't be matched to a corridor, so it would silently miss planning |
| Validation failed | Controller | Layer 7 rejects a schedule, with the rule broken |
| Block assigned | Each department in the block | A schedule passes. This is where "Engineering and S&T share block X" reaches the crews |

Sending the same alert twice is a no-op, so re-runs don't spam. There's no
server yet, so the pipeline writes `dashboard/public/notifications.json` and
the dashboard reads it on load.

---

## Phase 1 — Make it one pipeline (before the demo)

The goal is one run from defect records to a validated weekly plan on the
dashboard. Everything here is small; the risk is in not doing it.

| Task | Owner | Notes |
|---|---|---|
| Feed the optimizer from the database: `score_all_pending_tasks(get_pending_defects())` | Person 3 | Take the top N ranked tasks per horizon. All 11,500 would mean thousands of corridor solves. The capacity engine re-reads a 273k-row CSV for every corridor, so load it once into a dict first. |
| Fix block fields: real station names, date rollover past midnight, `block_type`, `status: DRAFT` | Person 3 | CONTRACTS.md Interface 4 |
| Adapter from blocks to one row per task for the validator | Person 3 | Both sides of Interface 4 are now Person 3's |
| Call `on_schedule_approved(report, schedule)` after every validation | Person 3 | Turns on the block-assigned and validation-failed alerts, and marks defects scheduled only on PASS |
| Show the validated weekly/monthly plan instead of mock schedule data | Person 4 | Read the Layer 8 CSVs, or a JSON export of them |
| Plug the Layer 7 engine into the what-if sandbox | Person 4 | Replaces the sandbox's own rule subset; the seam is marked in `what_if_sandbox.py` |
| Say when default windows are used instead of real ones | Person 3 | A `source: "default"` field on the window is enough |
| COA connector: load `synthetic_COA_block_demands.csv` (4,600 block requests) | Person 2 | This is the "departments request blocks independently" half of the problem. It's also the input for Phase 2 |

**Done when:** one command takes the 11,500 defects to a weekly plan that
passed Layer 7, the dashboard shows that plan, and each department's
"block assigned" alert is in the feed.

## Phase 2 — The officer workflow (after the pipeline works)

These are the parts of the proposed PRD worth adopting. They add the
request-driven side of the problem, officers submitting blocks, on top of
the engine that already exists instead of replacing it.

| Feature | What it adds | Builds on |
|---|---|---|
| **Block request intake** | Officers submit or edit a request (corridor, time, work type) and see its status | COA connector + a `block_requests` table |
| **Conflict classification** | Every pair of requests is labelled: no conflict, time overlap, same asset, multi-department opportunity, or clash with trains | Validator rules + corridor free windows |
| **Coordination recommendations** | For overlapping requests, a suggested shared window that fits every department's work *and* the corridor's free time. The optimizer already computes this. The PRD's simple union/intersection of times doesn't work: one can hit trains, the other is too short for the work. | Optimizer |
| **Explanations on every recommendation** | Which departments, which corridor, which windows overlap, which constraints were checked, and what was assumed | ML `explanation` + optimizer `reason` |
| **Audit trail** | Who created, changed, viewed or accepted what, and when; can't be edited from the UI | A new append-only table |
| **Web API** | One Python service (FastAPI) wrapping the existing functions, so the dashboard can fetch live data and mark alerts read | Everything above |
| **Login and roles** | Department officers see and edit their own requests; Controllers see everything and approve | Web API |
| **Demo scenario generator** | Deliberate cases on the real corridors: no overlap, partial, full, three-department, train clash | Existing synthetic generator |

Recommended stack for this phase: keep Python end to end (FastAPI), and move
from SQLite to PostgreSQL once the API has more than one writer.
`schema.sql` ports with small changes. We're not adding a second backend
language: the ML, optimizer, validator and connectors are all Python.

## Phase 3 — Toward production (after SIH)

Deferred on purpose. Each item has the condition that would justify it.

| Item | Add it when |
|---|---|
| Real TMS / SMMS / TDMS / COA feeds | Railways grants authorised access (swap one connector each) |
| Retrain on real failure history | Real labels exist. The training script runs unchanged |
| SMS / email notifications to field crews | A server exists and crews are real users. The events are already defined |
| Live dashboard updates (server-sent events) | Controllers keep the dashboard open during a shift |
| Queue + background workers (e.g. Redis) | Optimizer runs take long enough to block API requests |
| Containers + orchestration, autoscaling | More than one server is needed. Docker Compose is enough until then |
| Metrics, tracing, dashboards | There's production traffic to watch |

## Not planned

- Automatically authorising blocks, or controlling signalling or traction
  equipment.
- Replacing BDMS, COA, TMS, SMMS or TDMS. RailOpt sits beside them.
- Performance claims about real railway load. Any numbers we show come
  from synthetic data on a laptop.
