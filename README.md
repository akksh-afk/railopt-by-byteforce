# RailOpt — Project Brief for AI-Powered Automatic Block Planning 
## What is this project?
We are building "RailOpt" — an AI-driven system that solves problem statement, issued by the Ministry of Railways:
"AI-Powered Automatic Block Planning to Maximize Asset Availability for
Train Operations."

## What is the problem?
Indian Railways has three departments that maintain physical rail
infrastructure: Engineering (track), Signal & Telecommunication (signals),
and Traction Distribution (electrical/OHE wiring). Each department
independently requests "maintenance blocks" (time windows where trains
are stopped so repair work can happen safely) through a system called
BDMS. Because these requests aren't coordinated across departments, the
same corridor might get three separate, overlapping block requests when
one shared block would do — wasting time, confusing scheduling, and
sometimes clashing with train timetables. This causes unnecessary train
delays, poor use of maintenance windows, and reduced availability of
railway infrastructure.

Additionally: real internal data from TMS (Track Management System),
SMMS (Signal Maintenance & Management System), TDMS (Traction
Distribution Management System), and COA (Control Office Application,
which manages block/corridor availability) is NOT publicly available —
it's internal, safety-sensitive Indian Railways data. This is expected;
judges know this. Our approach handles this honestly (see "Data
Strategy" below).

## How are we solving it?
We built a 10-layer pipeline:
1. Data Ingestion — pulls records from TMS/SMMS/TDMS/COA (synthetic-fed
   for now, designed to plug into real systems later)
2. Unified Data Lake — all raw records in one central database
3. Normalization — maps each department's inconsistent naming
   (e.g. "Section A" vs "Block A") to one master schema
4. ML Priority Engine — an XGBoost model scores every defect/maintenance
   record 0-100 based on severity, how overdue it is, and corridor
   traffic density, predicting likelihood of failure if ignored
5. Corridor Capacity Engine — computes real free time-windows per
   corridor by subtracting train timetable occupancy from 24 hours
6. Constraint-Based Optimizer (Google OR-Tools, CP-SAT solver) — matches
   ranked tasks to free windows, MERGING multiple departments' requests
   into one shared block wherever compatible (this is the core
   innovation: 3 separate requests -> 1 coordinated block)
7. Validation & Safety Rule Engine — a deterministic (non-ML) rule
   checker that rejects any draft schedule violating safety rules
   (e.g. no overlapping power blocks with live traction)
8. Multi-Horizon Plan Generator — produces both weekly AND monthly block
   plans, as the problem statement explicitly requires
9. Controller Dashboard — an interactive map/calendar UI showing the
   final plan, with a plain-English "why was this scheduled here"
   explanation for every block. This is DECISION SUPPORT for a human
   Controller/DRM to approve — not full automation. We deliberately keep
   a human in the loop since this is safety-critical infrastructure.
10. What-If Simulation Sandbox — lets a controller drag a block to a
    different time and instantly see recalculated downtime/train impact,
    without touching the real approved plan. 

## Data Strategy (important context)
- Real data: Indian Railways station list, train routes, and timetables,
  sourced from data.gov.in (via a CC0-licensed compiled dataset at
  github.com/datameet/railways). We derived 8,622 real corridor
  (block-section) definitions and real free-time-window calendars
  directly from this real data.
- Synthetic data: since TMS/SMMS/TDMS/COA internal records aren't public,
  we generated synthetic defect/maintenance records, but anchored every
  synthetic record to a REAL corridor, and calibrated distributions
  against real government CAG Audit Report No. 45 (2017/2018) findings
  on track maintenance backlogs and defect rates. We are transparent
  about what's real vs synthetic — this is disclosed, not hidden.

## What work is already done
- Real data collected, verified, and processed (corridor derivation,
  free-window calendars) — DONE
- Synthetic TMS/SMMS/TDMS/COA datasets generated, calibrated to real
  government audit statistics — DONE
- ML Priority Model (Layer 4) trained on 11,500 records: XGBoost
  classifier, 94.8% accuracy, 96.8% recall (deliberately optimized for
  recall over raw accuracy, since missing a real safety defect is worse
  than a false alarm), 0.987 ROC-AUC — DONE, fully reproducible script
- Validation & Safety Rule Engine (Layer 7) — DONE (built by teammate)
- Optimizer (Layer 6, OR-Tools) — IN PROGRESS
- Dashboard (Layer 9) — IN PROGRESS
- What-If Simulation Sandbox (Layer 10) — NOT STARTED, this is your task

## Who is the reader / team structure
- Person 1: ML model + overall data schema/contracts
- Person 2: Backend/database + data connectors
- Person 3: Optimizer (OR-Tools scheduler)
- Person 4: Validation & Safety Rule Engine — COMPLETE
- Person 5: Dashboard/frontend
- Person 6: What-If Simulation Sandbox
