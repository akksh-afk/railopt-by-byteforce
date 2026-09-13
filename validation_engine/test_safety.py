try:
    import pytest
except ImportError:
    pass
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))
from safety_engine import SafetyRuleEngine

def test_clean_schedule_passes():
    clean_data = pd.DataFrame([
        {
            "task_id": "T1",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 08:00",
            "end_time": "2026-08-28 10:00"
        },
        {
            "task_id": "T2",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 10:15",
            "end_time": "2026-08-28 12:00"
        }
    ])
    engine = SafetyRuleEngine()
    report = engine.run_validation(clean_data)
    assert report["status"] == "PASS"
    assert report["total_violations"] == 0

def test_track_overlap_fails():
    conflict_data = pd.DataFrame([
        {
            "task_id": "T1",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 08:00",
            "end_time": "2026-08-28 10:00"
        },
        {
            "task_id": "T2",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 09:30",
            "end_time": "2026-08-28 11:30"
        }
    ])
    engine = SafetyRuleEngine()
    report = engine.run_validation(conflict_data)
    assert report["status"] == "FAIL"
    assert any(v["rule_code"] == "ERR_TRACK_OVERLAP" for v in report["violations"])

def test_headway_violation_fails():
    timetable = pd.DataFrame([
        {
            "train_id": "TRAIN_99",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "arrival_time": "2026-08-28 10:05",
            "priority_tier": "HIGH"
        }
    ])
    block_schedule = pd.DataFrame([
        {
            "task_id": "T1",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 08:00",
            "end_time": "2026-08-28 10:00"
        }
    ])
    engine = SafetyRuleEngine(timetable_df=timetable, min_headway_minutes=15)
    report = engine.run_validation(block_schedule)
    assert report["status"] == "FAIL"
    assert any(v["rule_code"] == "ERR_TRAIN_HEADWAY_VIOLATION" for v in report["violations"])

def test_power_zone_conflict_fails():
    power_grid = pd.DataFrame([
        {"power_zone_id": "PZ_99", "corridor_id": "CORR_1", "track_segment": "SEG_A"},
        {"power_zone_id": "PZ_99", "corridor_id": "CORR_1", "track_segment": "SEG_B"}
    ])
    schedule = pd.DataFrame([
        {
            "task_id": "T_OHE_01",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_A",
            "start_time": "2026-08-28 08:00",
            "end_time": "2026-08-28 10:00",
            "requires_power_cutoff": True
        }
    ])
    timetable = pd.DataFrame([
        {
            "train_id": "EXP_01",
            "corridor_id": "CORR_1",
            "track_segment": "SEG_B",
            "arrival_time": "2026-08-28 09:00",
            "is_electric": True
        }
    ])
    engine = SafetyRuleEngine(timetable_df=timetable, power_grid_df=power_grid)
    report = engine.run_validation(schedule)
    assert report["status"] == "FAIL"
    assert any(v["rule_code"] == "ERR_POWER_ZONE_CONFLICT" for v in report["violations"])


if __name__ == "__main__":
    print("Running Layer 7 Safety Validation Unit Tests...")
    test_clean_schedule_passes()
    print(" [1/4] test_clean_schedule_passes: PASS")
    test_track_overlap_fails()
    print(" [2/4] test_track_overlap_fails: PASS")
    test_headway_violation_fails()
    print(" [3/4] test_headway_violation_fails: PASS")
    test_power_zone_conflict_fails()
    print(" [4/4] test_power_zone_conflict_fails: PASS")
    print("\nALL 4 SAFETY VALIDATION TESTS PASSED (100% SUCCESS)!")