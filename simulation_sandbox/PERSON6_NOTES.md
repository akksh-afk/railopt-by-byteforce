# Person 6 — What-If Simulation Sandbox (Layer 10)

## What's delivered
1. **`what_if_sandbox.py`** — the real engine, matching Interface 6 exactly:
   takes an approved schedule (Interface 5, `status: "PASS"`), works on a
   deep copy, lets you move one block's `start_time`/`end_time`, and
   re-validates *only that block's corridor* (the "lightweight" part of
   Interface 6) before returning a PASS/FAIL report plus a downtime-impact
   delta. The original schedule object is never mutated — run it and check:
   the last printed block is the untouched original.
2. **`sample_approved_schedule.json`** — a hand-written Interface-5-shaped
   sample (per README open item #4: *"Person 5 + Person 6... can start
   building against a hand-written sample JSON file... without waiting for
   Person 3's optimizer to be fully done"*). Two corridors, four blocks,
   one power_block + one traffic_block deliberately close together so the
   conflict rule has something real to catch.
3. **`what_if_sandbox.html`** — a standalone interactive demo: drag a block
   left/right on the timeline (or type exact times), and watch the
   PASS/FAIL banner and downtime numbers update live. This is what you
   drive during the presentation — no server, no build step, just open it.

## The one honest caveat — say this out loud in the demo, don't hide it
Interface 4/5's exact field names from Person 4's `run_full_validation()`
were still unconfirmed at the time this was built (CONTRACTS.md "Open
items" #1–2). So the sandbox ships its **own lightweight rule check**
(corridor overlap, power-zone isolation buffer, headway) rather than
literally calling her function. It's built to the *shape* documented in
Interface 4/5, and the integration point is marked clearly in
`what_if_sandbox.py` (`_validate_corridor`) — swapping in her real
validator is a single function swap, not a rewrite. Framing this as "the
sandbox has its own safety-rule subset for real-time interaction, with a
clean seam to plug in the full Layer 7 engine" is more credible to judges
than pretending it's already wired end-to-end.

## Suggested demo script (~90 seconds)
1. "This is the What-If Sandbox — Layer 10. A controller has an approved
   weekly plan. Before committing a change, they want to know: is this
   still safe, and what does it cost us?"
2. Open `what_if_sandbox.html`. Point at corridor COR03213: one traffic
   block, one power block, one corridor block, safely spaced.
3. Drag the corridor block (BLK00003) left until it collides with the
   power block. **Banner flips to FAIL**, names the exact rule
   (`ERR_POWER_ZONE_CONFLICT`) and the required isolation buffer.
4. Drag it back to a safe slot. **Banner flips to PASS**, downtime delta
   updates in real time.
5. One line on architecture: "Nothing here touches the real approved
   schedule — it's a deep copy, exactly like Interface 6 specifies, so a
   controller can explore freely without risking the live plan."

## If you have slack time before submission (per your role's floater duty)
- Pod 2+3 (backend/optimizer): ask if Interface 4's field names are
  confirmed yet — if so, tell me and I'll wire the real validator call
  into the marked integration point in 5 minutes.
- Pod 4+5 (validation/dashboard): ask Person 4 to sanity-check
  `HEADWAY_BUFFER_MIN` (currently a placeholder 15 min) against whatever
  real number she used, and confirm Interface 5's `violations` object
  shape matches what's in CONTRACTS.md.
- Pitch deck: the demo script above maps directly onto one slide — "Why
  we kept a human in the loop" — since it's the clearest illustration of
  Layer 10's whole reason to exist.
