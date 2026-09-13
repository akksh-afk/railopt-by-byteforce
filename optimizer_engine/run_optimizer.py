"""
RailOpt — Layer 6 Runner: Optimizer Pipeline
Owner: Person 3 (Optimization Engineer)

Executes end-to-end constraint optimization:
    1. Reads scored tasks from ml_engine / defects_SCORED.csv
    2. Retrieves real timetable capacity gaps from CorridorCapacityEngine
    3. Solves multi-corridor CP-SAT optimization with Google OR-Tools
    4. Outputs draft_schedule.json (Interface 4 format) for Layer 7 Safety Validation
"""

import os
import sys
import csv
import json
from collections import defaultdict
from corridor_capacity_engine import CorridorCapacityEngine
from block_optimizer import BlockOptimizer

def run_optimizer():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(base_dir, ".."))
    
    scored_csv = os.path.join(repo_root, "data", "synthetic", "defects_SCORED.csv")
    if not os.path.exists(scored_csv):
        scored_csv = os.path.join(repo_root, "data", "synthetic", "defects.csv")

    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    print("=========================================================")
    print("RAILOPT — LAYER 6: OR-TOOLS CP-SAT BLOCK OPTIMIZATION")
    print("=========================================================")

    tasks_by_corridor = defaultdict(list)
    total_loaded = 0

    if os.path.exists(scored_csv):
        with open(scored_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                cid = row.get("corridor_id", "COR03213")
                tasks_by_corridor[cid].append(row)
                total_loaded += 1

    print(f"[1/4] Loaded {total_loaded} prioritized tasks across {len(tasks_by_corridor)} corridors.")

    # Initialize engines
    capacity_engine = CorridorCapacityEngine()
    optimizer = BlockOptimizer(time_limit_seconds=3)

    all_scheduled_blocks = []
    total_requests_merged = 0

    print("[2/4] Running Google OR-Tools CP-SAT multi-window packing...")
    for corridor_id, tasks in tasks_by_corridor.items():
        free_windows = capacity_engine.get_free_windows_for_corridor(corridor_id)
        blocks = optimizer.optimize_corridor_blocks(corridor_id, tasks, free_windows)
        
        for b in blocks:
            all_scheduled_blocks.append(b)
            total_requests_merged += b.get("merged_count", 1)

    print(f"[3/4] Optimization Solved:")
    print(f"      • Original Multi-Department Requests : {total_requests_merged}")
    print(f"      • Optimized Joint Scheduled Blocks   : {len(all_scheduled_blocks)}")
    if all_scheduled_blocks:
        merge_ratio = round(total_requests_merged / len(all_scheduled_blocks), 2)
        print(f"      • Cross-Department Merge Ratio       : {merge_ratio} : 1")

    # Export Interface 4 draft schedule
    output_file = os.path.join(output_dir, "draft_schedule.json")
    draft_payload = {
        "status": "DRAFT_READY_FOR_VALIDATION",
        "generated_by": "OR-Tools CP-SAT Solver v9.15",
        "total_blocks": len(all_scheduled_blocks),
        "schedule": all_scheduled_blocks
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(draft_payload, f, indent=2)

    print(f"[4/4] Draft Block Schedule exported to: {output_file}")
    print("=========================================================\n")
    return draft_payload


if __name__ == "__main__":
    run_optimizer()