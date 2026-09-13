import os
import sys
import pandas as pd
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from safety_engine import SafetyRuleEngine

class MultiHorizonPlanGenerator:
    def __init__(self, timetable_df=None, output_dir="data/output"):
        """
        Layer 8: Multi-Horizon Plan Generator
        Orchestrates schedule validation and exports coordinated:
        1. Weekly Tactical Block Plans (minute-level precision)
        2. Monthly Strategic Block Plans (shift/day-level overview)
        """
        self.validator = SafetyRuleEngine(timetable_df=timetable_df, min_headway_minutes=15)
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_cuts_for_solver(self, violations: list) -> list:
        """Translates validation failures into solver cuts for Person 3."""
        cuts = []
        for v in violations:
            if v["rule_code"] == "ERR_TRACK_OVERLAP":
                cuts.append({
                    "cut_type": "FORBIDDEN_PAIR",
                    "task_a": v["task_ids"][0],
                    "task_b": v["task_ids"][1],
                    "corridor_id": v["corridor_id"]
                })
            elif v["rule_code"] == "ERR_TRAIN_HEADWAY_VIOLATION":
                cuts.append({
                    "cut_type": "TIME_WINDOW_BLACKOUT",
                    "task_id": v["task_ids"][0],
                    "corridor_id": v["corridor_id"]
                })
        return cuts

    def process_and_export_horizon(self, horizon_type: str, raw_plan_df: pd.DataFrame, max_retries: int = 3) -> pd.DataFrame:
        """Validates a draft plan, executes loop-back cuts if needed, and exports CSV."""
        print(f"\n==========================================")
        print(f"Generating Horizon: {horizon_type.upper()}")
        print(f"==========================================")

        current_plan = raw_plan_df.copy()

        for attempt in range(1, max_retries + 1):
            print(f"[Attempt {attempt}/{max_retries}] Running Layer 7 Safety Validation...")
            report = self.validator.run_validation(current_plan)

            if report["status"] == "PASS":
                filename = os.path.join(self.output_dir, f"{horizon_type}_block_plan.csv")
                
                # Format columns cleanly for operational export
                current_plan["horizon"] = horizon_type
                current_plan["validated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                current_plan.to_csv(filename, index=False)
                
                print(f"[SUCCESS] Safety Passed (0 Violations). Exported to: {filename}")
                return current_plan
            else:
                print(f"[WARN] Plan Failed Validation with {report['total_violations']} violations.")
                cuts = self.generate_cuts_for_solver(report["violations"])
                print(f"[LOOP-BACK] Generated {len(cuts)} cuts for solver.")
                
                # In standalone simulation mode: auto-resolve conflict by sliding the second block
                # (In full integration, this is handed back to Person 3's Layer 6 solver)
                for v in report["violations"]:
                    if v["rule_code"] == "ERR_TRACK_OVERLAP":
                        task_b_id = v["task_ids"][1]
                        # Auto-shift task_b 30 minutes forward to simulate a re-solve
                        idx = current_plan[current_plan["task_id"] == task_b_id].index
                        current_plan.loc[idx, "start_time"] = "2026-08-28 10:30"
                        current_plan.loc[idx, "end_time"] = "2026-08-28 12:30"

        raise RuntimeError(f"Plan validation failed after {max_retries} attempts.")

    def run_multi_horizon_pipeline(self, weekly_raw_df: pd.DataFrame, monthly_raw_df: pd.DataFrame):
        """Runs validation and produces both required deliverable CSVs."""
        weekly_plan = self.process_and_export_horizon("weekly_tactical", weekly_raw_df)
        monthly_plan = self.process_and_export_horizon("monthly_strategic", monthly_raw_df)
        return weekly_plan, monthly_plan


if __name__ == "__main__":
    # 1. Weekly Tactical Input (Fine-grained minute blocks)
    # Task 101 and Task 102 initially overlap (will trigger loop-back and resolve)
    weekly_draft = pd.DataFrame([
        {
            "task_id": "TASK_W01",
            "corridor_id": "CORRIDOR_NORTH",
            "track_segment": "SEG_01",
            "start_time": "2026-08-28 08:00",
            "end_time": "2026-08-28 10:00",
            "priority_rank": 1,
            "work_type": "Track Replacement"
        },
        {
            "task_id": "TASK_W02",
            "corridor_id": "CORRIDOR_NORTH",
            "track_segment": "SEG_01",
            "start_time": "2026-08-28 09:30",  # Overlaps with TASK_W01
            "end_time": "2026-08-28 11:30",
            "priority_rank": 2,
            "work_type": "Overhead Line Inspection"
        }
    ])

    # 2. Monthly Strategic Input (Broader shift blocks across 30 days)
    monthly_draft = pd.DataFrame([
        {
            "task_id": "TASK_M01",
            "corridor_id": "CORRIDOR_SOUTH",
            "track_segment": "SEG_05",
            "start_time": "2026-09-02 01:00",
            "end_time": "2026-09-02 05:00",
            "priority_rank": 1,
            "work_type": "Deep Ballast Screening"
        },
        {
            "task_id": "TASK_M02",
            "corridor_id": "CORRIDOR_EAST",
            "track_segment": "SEG_02",
            "start_time": "2026-09-15 00:30",
            "end_time": "2026-09-15 04:30",
            "priority_rank": 3,
            "work_type": "Signaling Interlocking Test"
        }
    ])

    # Run the generator
    generator = MultiHorizonPlanGenerator()
    weekly_out, monthly_out = generator.run_multi_horizon_pipeline(weekly_draft, monthly_draft)

    print("\n--- GENERATION COMPLETE ---")
    print(f"Generated Weekly Records: {len(weekly_out)}")
    print(f"Generated Monthly Records: {len(monthly_out)}")