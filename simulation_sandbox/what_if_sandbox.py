"""
RailOpt — Layer 10: What-If Simulation Sandbox
Owner: Person 6

Implements INTERFACE 6 from CONTRACTS.md:
    "Person 6 takes a COPY of the approved schedule (Interface 5 output,
    status: PASS), lets the user modify start_time/end_time of one block,
    then re-runs Interface 4 + 5 logic (lightweight) on just that change —
    without writing back to the real approved schedule."

DESIGN NOTE FOR THE TEAM / JUDGES:
Person 4's full validator (Layer 7) was still being confirmed at hand-off
time (see CONTRACTS.md "Open items", #2). Rather than block on that, this
sandbox ships its own lightweight re-implementation of the two safety
checks that are explicitly named in her test file naming
(`test_headway_violation_fails`, `PowerZoneEngine`) plus a same-corridor
overlap check. This is intentionally a SUBSET of the full rule engine —
enough to make the "drag a block, see instant feedback" interaction real
for the demo — not a replacement for Layer 7. If Person 4's actual
`run_full_validation()` becomes available before submission, swap it in
at the marked integration point below and this file's public API
(`WhatIfSandbox.apply_change`) does not need to change.

No writes ever touch the original schedule object — everything operates
on a deep copy, matching Interface 6's contract.
"""

from __future__ import annotations
import copy
import json
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional

TIME_FMT = "%Y-%m-%d %H:%M"

# Minimum safety buffer required between two blocks on the same corridor
# (placeholder for real IR headway rules — tune with Person 4's numbers
# once confirmed).
HEADWAY_BUFFER_MIN = 15

# Block types that involve a physical/electrical hazard if they coincide
# with a power block on the same corridor.
POWER_CONFLICT_TYPES = {"traffic_block", "corridor_block", "megablock"}


def _parse(ts: str) -> datetime:
    return datetime.strptime(ts, TIME_FMT)


def _fmt(dt: datetime) -> str:
    return dt.strftime(TIME_FMT)


@dataclass
class Violation:
    code: str
    block_id: str
    detail: str

    def to_dict(self):
        return {"code": self.code, "block_id": self.block_id, "detail": self.detail}


@dataclass
class ImpactReport:
    corridor_id: str
    downtime_before_min: int
    downtime_after_min: int
    downtime_delta_min: int
    affected_task_count: int

    def to_dict(self):
        return {
            "corridor_id": self.corridor_id,
            "downtime_before_min": self.downtime_before_min,
            "downtime_after_min": self.downtime_after_min,
            "downtime_delta_min": self.downtime_delta_min,
            "affected_task_count": self.affected_task_count,
        }


class WhatIfSandbox:
    """
    Usage:
        sandbox = WhatIfSandbox(approved_schedule_json)   # Interface 5 output, status == PASS
        result = sandbox.apply_change("BLK00002", "2026-08-28 10:00", "2026-08-28 12:15")
        result["status"]      -> "PASS" or "FAIL"
        result["violations"]  -> [] or list of violation dicts
        result["impact"]      -> downtime/availability delta for the affected corridor
        result["schedule"]    -> the modified COPY (only touches the real schedule if the
                                  caller explicitly commits it — this class never does)
    """

    def __init__(self, approved_schedule: dict):
        if approved_schedule.get("status") != "PASS":
            raise ValueError(
                "WhatIfSandbox only accepts an approved schedule "
                "(Interface 5 output with status == 'PASS')."
            )
        # Store the original untouched. Every operation works on a deep copy.
        self._original = approved_schedule

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def apply_change(self, block_id: str, new_start: str, new_end: str) -> dict:
        """
        Returns a dict shaped like Interface 5's report, plus an extra
        'impact' key with recalculated downtime for the affected corridor.
        Never mutates self._original.
        """
        sandbox_schedule = copy.deepcopy(self._original)
        blocks = sandbox_schedule["schedule"]

        target = next((b for b in blocks if b["block_id"] == block_id), None)
        if target is None:
            return {
                "status": "FAIL",
                "violations": [
                    Violation("ERR_BLOCK_NOT_FOUND", block_id, "No such block in schedule").to_dict()
                ],
                "impact": None,
                "schedule": sandbox_schedule["schedule"],
            }

        before_start, before_end = target["start_time"], target["end_time"]
        target["start_time"] = new_start
        target["end_time"] = new_end

        # --- lightweight re-validation, scoped to the affected corridor only ---
        # (this is the "lightweight" part of Interface 6 — we don't re-run
        # full-network validation, only what could possibly have changed)
        corridor_blocks = [b for b in blocks if b["corridor_id"] == target["corridor_id"]]
        violations = self._validate_corridor(corridor_blocks, moved_block_id=block_id)

        status = "FAIL" if violations else "PASS"

        impact = self._compute_impact(
            corridor_id=target["corridor_id"],
            corridor_blocks_before=[
                {**b, "start_time": before_start, "end_time": before_end}
                if b["block_id"] == block_id else b
                for b in corridor_blocks
            ],
            corridor_blocks_after=corridor_blocks,
        )

        return {
            "status": status,
            "violations": [v.to_dict() if isinstance(v, Violation) else v for v in violations],
            "impact": impact.to_dict(),
            "schedule": sandbox_schedule["schedule"],
        }

    # ------------------------------------------------------------------
    # INTEGRATION POINT:
    # Replace the body of _validate_corridor with a call into Person 4's
    # actual run_full_validation(schedule) once her exact function
    # signature is confirmed (CONTRACTS.md open item #2). Keep the same
    # return type (list[Violation]) so apply_change() above needs no changes.
    # ------------------------------------------------------------------
    def _validate_corridor(self, corridor_blocks: list[dict], moved_block_id: str) -> list[Violation]:
        violations: list[Violation] = []
        parsed = [
            (b, _parse(b["start_time"]), _parse(b["end_time"]))
            for b in corridor_blocks
        ]

        for i, (b1, s1, e1) in enumerate(parsed):
            for j, (b2, s2, e2) in enumerate(parsed):
                if i >= j:
                    continue

                overlaps = s1 < e2 and s2 < e1
                gap = min(abs((s2 - e1).total_seconds()), abs((s1 - e2).total_seconds())) / 60

                # Rule 1: same-corridor time overlap between distinct blocks
                if overlaps:
                    violations.append(Violation(
                        "ERR_CORRIDOR_OVERLAP",
                        b1["block_id"] if b1["block_id"] == moved_block_id else b2["block_id"],
                        f"{b1['block_id']} ({b1['start_time']}–{b1['end_time']}) overlaps "
                        f"{b2['block_id']} ({b2['start_time']}–{b2['end_time']}) on corridor "
                        f"{b1['corridor_id']}."
                    ))

                # Rule 2: power block vs live-traction block conflict (checked
                # regardless of overlap, since a power block needs a full
                # isolation buffer around it, not just non-overlap)
                types = {b1["block_type"], b2["block_type"]}
                if "power_block" in types and (types & POWER_CONFLICT_TYPES) - {"power_block"}:
                    if overlaps or gap < HEADWAY_BUFFER_MIN:
                        violations.append(Violation(
                            "ERR_POWER_ZONE_CONFLICT",
                            b1["block_id"] if b1["block_type"] == "power_block" else b2["block_id"],
                            f"Power block too close to a live-traction block "
                            f"({b1['block_id']} / {b2['block_id']}): needs "
                            f"{HEADWAY_BUFFER_MIN} min isolation buffer, has {gap:.0f} min."
                        ))

                # Rule 3: headway — any two blocks on the same corridor need a
                # minimum buffer even if types don't conflict electrically
                elif not overlaps and gap < HEADWAY_BUFFER_MIN:
                    violations.append(Violation(
                        "ERR_HEADWAY_VIOLATION",
                        b1["block_id"] if b1["block_id"] == moved_block_id else b2["block_id"],
                        f"Only {gap:.0f} min gap between {b1['block_id']} and {b2['block_id']} "
                        f"on corridor {b1['corridor_id']} — minimum is {HEADWAY_BUFFER_MIN} min."
                    ))

        return violations

    def _compute_impact(self, corridor_id: str, corridor_blocks_before: list[dict],
                         corridor_blocks_after: list[dict]) -> ImpactReport:
        def total_minutes(blocks):
            return sum(
                int((_parse(b["end_time"]) - _parse(b["start_time"])).total_seconds() // 60)
                for b in blocks
            )

        before = total_minutes(corridor_blocks_before)
        after = total_minutes(corridor_blocks_after)
        affected_tasks = sum(len(b.get("tasks", [])) for b in corridor_blocks_after)

        return ImpactReport(
            corridor_id=corridor_id,
            downtime_before_min=before,
            downtime_after_min=after,
            downtime_delta_min=after - before,
            affected_task_count=affected_tasks,
        )


if __name__ == "__main__":
    with open("sample_approved_schedule.json") as f:
        approved = json.load(f)

    sandbox = WhatIfSandbox(approved)

    print("=== Scenario A: safe reschedule (should PASS) ===")
    result = sandbox.apply_change("BLK00003", "2026-08-28 14:00", "2026-08-28 15:30")
    print(json.dumps({k: v for k, v in result.items() if k != "schedule"}, indent=2))

    print("\n=== Scenario B: unsafe reschedule — collides with a power block (should FAIL) ===")
    result = sandbox.apply_change("BLK00003", "2026-08-28 09:10", "2026-08-28 10:30")
    print(json.dumps({k: v for k, v in result.items() if k != "schedule"}, indent=2))

    print("\n(original approved schedule is untouched — Interface 6 contract honored)")
    print(json.dumps(approved["schedule"], indent=2)[:300], "...")
