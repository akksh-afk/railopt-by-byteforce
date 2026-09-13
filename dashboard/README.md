# TRACKBED — Railway Maintenance Controller Dashboard

A Layer 9 controller dashboard prototype for a 10-layer intelligent railway
maintenance planning system. Built with React + Vite. Black/near-black
control-room UI with an orange rail accent, an interactive corridor map,
a weekly/monthly maintenance calendar, ML "why this block?" explanations,
a live train-tracking feed with animated corridor markers, and a Layer 10
what-if sandbox.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## What's inside

- **Home** — decision-pipeline hero animation, summary stats, the corridor
  network map, and a compact alert feed.
- **Live** — a live operations view modeled on real-time rail control
  software: a searchable tracking list, an animated corridor map (trains
  creep along their corridor in real time), a live telemetry panel for the
  selected train (speed, power, brakes, occupancy, route progress), and a
  strip of live rolling metrics (active trains, telemetry ping latency,
  fleet velocity variance).
- **Plan** — weekly and monthly maintenance calendars. Clicking any block
  opens a detail panel.
- **Alert** — the full operational alert center (conflicts, capacity
  warnings, validation results, high-priority flags).
- **Sim** — the Layer 10 what-if sandbox: pick a block, shift its
  maintenance window, and see a mocked projected availability / conflict
  risk / validation state.

Every block detail view includes:
- **Why this block?** — Layer 4's priority score, level, reasons, asset
  risk, traffic/window reasoning, and crew availability.
- **Decision trace** — Data → Priority Engine → Capacity Engine →
  Optimizer → Safety Validator → Controller.

## Architecture

```
src/
  api/api.js            # single point of contact for all data — swap the
                         # function bodies for real fetch() calls later,
                         # no component changes required
  data/mockData.js       # realistic mock data matching the intended
                         # backend JSON contract (see below)
  components/
    Sidebar.jsx, Topbar.jsx, SummaryCards.jsx
    RailMap.jsx           # shared SVG network renderer (static + live)
    CorridorMap.jsx        # Home view: corridor click → detail drawer
    LiveOperationsView.jsx # Live view: composes the three panels below
    TrackingList.jsx, LiveFeedPanel.jsx, MiniCharts.jsx
    CalendarView.jsx, calendar/WeeklyCalendar.jsx, calendar/MonthlyCalendar.jsx
    MaintenanceBlock.jsx, BlockDetails.jsx
    WhyExplanation.jsx, DecisionTrace.jsx, StatusChip.jsx
    Alerts.jsx, WhatIfPanel.jsx
    JourneyHero.jsx        # scroll-driven signature animation
    States.jsx             # shared loading / empty / error states
  styles.css              # design tokens + all component styles
```

All ML/priority output (score, level, reasons, asset risk, etc.) is treated
as backend data — nothing is computed client-side. `getLiveTrains` /
`getLiveMetrics` in `api/api.js` are the seam where a real telemetry feed
(e.g. a WebSocket or polling endpoint) would plug in.

## Backend data contract

```json
{
  "block_id": "BLK-104",
  "corridor_id": "C02",
  "start": "2026-09-04T10:00:00",
  "end": "2026-09-04T14:00:00",
  "priority_score": 0.91,
  "priority_level": "HIGH",
  "status": "VALIDATED",
  "why": ["High asset risk", "Low traffic window", "Crew available"]
}
```

Suggested endpoints (mocked in `api/api.js`, ready to be swapped for real
`fetch()` calls):

```
GET  /api/corridors
GET  /api/stations
GET  /api/plans/weekly
GET  /api/plans/monthly
GET  /api/blocks/:id
GET  /api/alerts
GET  /api/live/trains
GET  /api/live/metrics
POST /api/whatif/simulate
```

## Accessibility & UX

- Keyboard-operable corridor lines, block markers, and train markers
  (focus rings, `role="button"`, `Enter`/`Space` handlers).
- Loading, empty, and error states on every data-driven panel, with retry.
- Status is never color-only — every chip carries a text label.
- `prefers-reduced-motion` disables ambient animation.
- Responsive down to a single-column mobile layout.
