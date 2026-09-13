# RailOpt — Optimizer Engine (Person 3: Optimization Engineer)

Solves the multi-department maintenance scheduling problem for Smart India Hackathon problem statement **SIH26027**.

## Core Mathematical Formulation
Built using **Google OR-Tools CP-SAT** (Constraint Programming / Integer Linear Programming Solver):
* **Objective:** Maximize priority-weighted task completion while heavily penalizing the opening of fragmented block windows.
* **Result:** Automatically combines 3 separate departmental block requests (Engineering track possession + Signalling point maintenance + Traction OHE isolation) into **1 joint corridor block** ($3 \to 1$ merge).
* **Constraints:**
  * Free capacity window bounds derived from real train timetables (`corridor_free_windows.csv`).
  * Safety headway buffers between maintenance slots.
  * Task execution duration $\le$ allocated possession window.

## Usage
```powershell
cd optimizer_engine
py -3.11 run_optimizer.py
```
Exports `output/draft_schedule.json` matching **CONTRACTS.md Interface 4**, ready for Layer 7 Safety Validation.