"""
safety_engine.py
=================
RailOpt — Layer 7: Safety Rule Engine (Person 4)

This is the core class test_safety.py and multi_horizon.py both import
but which was never actually sent to the team -- rebuilt here from the
exact behavior her own test file specifies, so it passes all 4 of her
tests unmodified. Deterministic, rule-based -- NOT ML -- exactly as
CONTRACTS.md requires for a safety-critical validation layer.
"""

from __future__ import annotations
import pandas as pd
from datetime import datetime

TIME_FMT = "%Y-%m-%d %H:%M"


def _parse(ts: str) -> datetime:
    return datetime.strptime(ts, TIME_FMT)


class SafetyRuleEngine:
    def __init__(self, timetable_df: pd.DataFrame = None,
                 min_headway_minutes: int = 15,
                 power_grid_df: pd.DataFrame = None):
        self.timetable_df = timetable_df
        self.min_headway_minutes = min_headway_minutes
        self.power_grid_df = power_grid_df

    def run_validation(self, schedule_df: pd.DataFrame) -> dict:
        violations = []
        violations += self._check_track_overlap(schedule_df)
        violations += self._check_headway(schedule_df)
        violations += self._check_power_zone_conflict(schedule_df)

        return {
            "status": "FAIL" if violations else "PASS",
            "total_violations": len(violations),
            "violations": violations,
        }

    # ------------------------------------------------------------------
    # Rule 1: two tasks on the same corridor+track_segment with
    # overlapping time windows
    # ------------------------------------------------------------------
    def _check_track_overlap(self, schedule_df: pd.DataFrame) -> list:
        violations = []
        rows = schedule_df.to_dict("records")
        for i in range(len(rows)):
            for j in range(i + 1, len(rows)):
                a, b = rows[i], rows[j]
                if a["corridor_id"] != b["corridor_id"]:
                    continue
                if a.get("track_segment") != b.get("track_segment"):
                    continue
                s1, e1 = _parse(a["start_time"]), _parse(a["end_time"])
                s2, e2 = _parse(b["start_time"]), _parse(b["end_time"])
                if s1 < e2 and s2 < e1:
                    violations.append({
                        "rule_code": "ERR_TRACK_OVERLAP",
                        "task_ids": [a["task_id"], b["task_id"]],
                        "corridor_id": a["corridor_id"],
                        "detail": f"{a['task_id']} ({a['start_time']}-{a['end_time']}) overlaps "
                                  f"{b['task_id']} ({b['start_time']}-{b['end_time']}) on "
                                  f"{a['corridor_id']}/{a.get('track_segment')}."
                    })
        return violations

    # ------------------------------------------------------------------
    # Rule 2: a block ending too close to a scheduled train's arrival
    # on the same corridor+segment (not enough headway to clear safely)
    # ------------------------------------------------------------------
    def _check_headway(self, schedule_df: pd.DataFrame) -> list:
        violations = []
        if self.timetable_df is None or self.timetable_df.empty:
            return violations

        for _, block in schedule_df.iterrows():
            same_track = self.timetable_df[
                (self.timetable_df["corridor_id"] == block["corridor_id"]) &
                (self.timetable_df["track_segment"] == block.get("track_segment"))
            ]
            for _, train in same_track.iterrows():
                block_end = _parse(block["end_time"])
                train_arrival = _parse(train["arrival_time"])
                gap_minutes = abs((train_arrival - block_end).total_seconds()) / 60
                if gap_minutes < self.min_headway_minutes:
                    violations.append({
                        "rule_code": "ERR_TRAIN_HEADWAY_VIOLATION",
                        "task_ids": [block["task_id"]],
                        "corridor_id": block["corridor_id"],
                        "detail": f"{block['task_id']} ends {block['end_time']}, train "
                                  f"{train['train_id']} arrives {train['arrival_time']} -- "
                                  f"only {gap_minutes:.0f} min gap, needs "
                                  f"{self.min_headway_minutes} min."
                    })
        return violations

    # ------------------------------------------------------------------
    # Rule 3: a block requiring power cutoff conflicts with a live
    # electric train scheduled in the SAME power zone (which can span
    # multiple track segments) during the cutoff window
    # ------------------------------------------------------------------
    def _check_power_zone_conflict(self, schedule_df: pd.DataFrame) -> list:
        violations = []
        if self.power_grid_df is None or self.power_grid_df.empty or self.timetable_df is None:
            return violations

        power_blocks = schedule_df[schedule_df.get("requires_power_cutoff", False) == True]

        for _, block in power_blocks.iterrows():
            # find every (corridor, track_segment) sharing this block's power zone
            block_zone_rows = self.power_grid_df[
                (self.power_grid_df["corridor_id"] == block["corridor_id"]) &
                (self.power_grid_df["track_segment"] == block.get("track_segment"))
            ]
            if block_zone_rows.empty:
                continue
            zone_ids = set(block_zone_rows["power_zone_id"])

            same_zone_segments = self.power_grid_df[self.power_grid_df["power_zone_id"].isin(zone_ids)]

            b_start, b_end = _parse(block["start_time"]), _parse(block["end_time"])

            for _, seg in same_zone_segments.iterrows():
                live_trains = self.timetable_df[
                    (self.timetable_df["corridor_id"] == seg["corridor_id"]) &
                    (self.timetable_df["track_segment"] == seg["track_segment"]) &
                    (self.timetable_df.get("is_electric", False) == True)
                ]
                for _, train in live_trains.iterrows():
                    train_time = _parse(train["arrival_time"])
                    if b_start <= train_time <= b_end:
                        violations.append({
                            "rule_code": "ERR_POWER_ZONE_CONFLICT",
                            "task_ids": [block["task_id"]],
                            "corridor_id": block["corridor_id"],
                            "detail": f"{block['task_id']} cuts power {block['start_time']}-"
                                      f"{block['end_time']} on power zone shared with "
                                      f"{seg['corridor_id']}/{seg['track_segment']}, but electric "
                                      f"train {train['train_id']} arrives there at "
                                      f"{train['arrival_time']}."
                        })
        return violations
