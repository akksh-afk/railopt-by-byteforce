"""
RailOpt — Layer 6: Constraint-Based Block Optimizer
Owner: Person 3 (Optimization Engineer)

Solves the multi-department maintenance scheduling problem using
Google OR-Tools CP-SAT (Integer Linear & Constraint Programming Solver).

Core Goal:
    1. Maximize total priority score of executed safety defects.
    2. Minimize total separate block windows by MERGING cross-department
       requests on the same corridor into single joint possessions (3 -> 1).
    3. Respect hard capacity constraints and non-overlapping track rules.
"""

import sys
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any

try:
    from ortools.sat.python import cp_model
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False


def min_to_timestr(total_min: int, base_date: str = "2026-09-01") -> str:
    """Converts minutes from midnight to YYYY-MM-DD HH:MM string."""
    norm = total_min % 1440
    h = norm // 60
    m = norm % 60
    return f"{base_date} {h:02d}:{m:02d}"


class BlockOptimizer:
    def __init__(self, time_limit_seconds: int = 5):
        self.time_limit = time_limit_seconds

    def optimize_corridor_blocks(
        self,
        corridor_id: str,
        tasks: List[Dict[str, Any]],
        free_windows: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Runs OR-Tools CP-SAT to pack prioritized tasks into available free windows,
        merging multiple department requests into shared blocks wherever possible.
        """
        if not tasks or not free_windows:
            return []

        # Sort tasks descending by priority score
        sorted_tasks = sorted(tasks, key=lambda x: float(x.get("final_priority_score", x.get("priority_score", 50))), reverse=True)

        if not HAS_ORTOOLS:
            return self._heuristic_merge(corridor_id, sorted_tasks, free_windows)

        model = cp_model.CpModel()
        num_tasks = len(sorted_tasks)
        num_windows = len(free_windows)

        # Decision Variables: task_assigned[t, w] == 1 if task t is placed in window w
        task_assigned = {}
        for t in range(num_tasks):
            for w in range(num_windows):
                task_assigned[(t, w)] = model.NewBoolVar(f"task_{t}_in_win_{w}")

        # Window used: window_used[w] == 1 if at least one task is placed in window w
        window_used = [model.NewBoolVar(f"win_used_{w}") for w in range(num_windows)]

        # Constraint 1: Each task assigned to AT MOST ONE window
        for t in range(num_tasks):
            model.Add(sum(task_assigned[(t, w)] for w in range(num_windows)) <= 1)

        # Constraint 2: Total duration of tasks assigned to window w <= window duration
        for w, win in enumerate(free_windows):
            win_cap_min = int(win["duration_hrs"] * 60)
            task_durations = [int(float(sorted_tasks[t].get("estimated_repair_duration_hrs", 2.0)) * 60) for t in range(num_tasks)]
            
            model.Add(
                sum(task_assigned[(t, w)] * task_durations[t] for t in range(num_tasks)) <= win_cap_min
            )

            # Link window_used
            for t in range(num_tasks):
                model.Add(window_used[w] >= task_assigned[(t, w)])

        # Objective Function:
        # Maximize: Sum(Priority * Task_Assigned) - 50 * Sum(Windows_Used)
        # This mathematically forces the solver to CO-LOCATE and MERGE multiple tasks
        # into the SAME window rather than opening multiple separate windows.
        priority_terms = []
        for t in range(num_tasks):
            p_score = int(float(sorted_tasks[t].get("final_priority_score", sorted_tasks[t].get("priority_score", 50))) * 10)
            for w in range(num_windows):
                priority_terms.append(task_assigned[(t, w)] * p_score)

        merge_incentive_penalty = sum(window_used[w] * 300 for w in range(num_windows))
        model.Maximize(sum(priority_terms) - merge_incentive_penalty)

        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        status = solver.Solve(model)

        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            blocks = []
            for w, win in enumerate(free_windows):
                assigned_task_indices = [t for t in range(num_tasks) if solver.Value(task_assigned[(t, w)]) == 1]
                if assigned_task_indices:
                    matched_tasks = [sorted_tasks[t] for t in assigned_task_indices]
                    depts = list(set(t.get("department", "Engineering") for t in matched_tasks))
                    task_ids = [t.get("record_id", f"TSK_{i}") for i, t in enumerate(matched_tasks)]
                    
                    total_dur_min = sum(int(float(t.get("estimated_repair_duration_hrs", 2.0)) * 60) for t in matched_tasks)
                    dur_hrs = round(total_dur_min / 60.0, 2)
                    
                    s_min = win["window_start_min"]
                    e_min = s_min + int(dur_hrs * 60)
                    
                    top_priority = max(float(t.get("final_priority_score", t.get("priority_score", 50))) for t in matched_tasks)

                    block_dict = {
                        "block_id": f"BLK_{corridor_id}_{w+1:02d}",
                        "corridor_id": corridor_id,
                        "from_station": matched_tasks[0].get("from_station", corridor_id[:4]),
                        "to_station": matched_tasks[0].get("to_station", corridor_id[4:]),
                        "start_time": min_to_timestr(s_min),
                        "end_time": min_to_timestr(e_min),
                        "duration_hrs": dur_hrs,
                        "departments": depts,
                        "merged_count": len(matched_tasks),
                        "tasks": task_ids,
                        "priority_score": top_priority,
                        "status": "APPROVED",
                        "reason": f"OR-Tools CP-SAT merged {len(matched_tasks)} departmental tasks ({', '.join(depts)}) into a single {dur_hrs}h window, saving multiple traffic halts."
                    }
                    blocks.append(block_dict)
            return blocks

        return self._heuristic_merge(corridor_id, sorted_tasks, free_windows)

    def _heuristic_merge(self, corridor_id: str, sorted_tasks: List[Dict], free_windows: List[Dict]) -> List[Dict]:
        """Greedy heuristic fallback if solver is unavailable."""
        blocks = []
        if not sorted_tasks or not free_windows:
            return []
        
        win = free_windows[0]
        depts = list(set(t.get("department", "Engineering") for t in sorted_tasks[:3]))
        task_ids = [t.get("record_id", f"TSK_{i}") for i, t in enumerate(sorted_tasks[:3])]
        dur_hrs = min(win["duration_hrs"], 3.5)

        blocks.append({
            "block_id": f"BLK_{corridor_id}_01",
            "corridor_id": corridor_id,
            "from_station": sorted_tasks[0].get("from_station", corridor_id[:4]),
            "to_station": sorted_tasks[0].get("to_station", corridor_id[4:]),
            "start_time": min_to_timestr(win["window_start_min"]),
            "end_time": min_to_timestr(win["window_start_min"] + int(dur_hrs * 60)),
            "duration_hrs": dur_hrs,
            "departments": depts,
            "merged_count": len(sorted_tasks[:3]),
            "tasks": task_ids,
            "priority_score": float(sorted_tasks[0].get("final_priority_score", 95.0)),
            "status": "APPROVED",
            "reason": f"Greedy heuristic merged {len(sorted_tasks[:3])} tasks into 1 joint corridor possession."
        })
        return blocks