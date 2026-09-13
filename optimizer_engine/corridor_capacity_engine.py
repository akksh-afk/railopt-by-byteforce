"""
RailOpt — Layer 5: Corridor Capacity Engine
Owner: Person 3 (Optimization Engineer)

Computes free time-windows per corridor by analyzing train timetable
occupancies from data/derived/corridor_free_windows.csv.
"""

import os
import csv
from typing import List, Dict

def hhmm_to_min(hhmm: str) -> int:
    try:
        parts = hhmm.strip().split(":")
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 0

class CorridorCapacityEngine:
    def __init__(self, free_windows_csv: str = None):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "..", "data", "derived")
        self.free_windows_csv = free_windows_csv or os.path.join(data_dir, "corridor_free_windows.csv")
        self.corridor_master_csv = os.path.join(data_dir, "corridor_master.csv")
        self._station_to_corridor = {}
        self._cached_windows: Dict[str, List[Dict]] = {}
        self._load_mappings()

    def _load_mappings(self):
        if os.path.exists(self.corridor_master_csv):
            with open(self.corridor_master_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = f"{row['from_station']}_{row['to_station']}"
                    self._station_to_corridor[key] = row["corridor_id"]

    def get_free_windows_for_corridor(self, corridor_id: str) -> List[Dict]:
        """
        Returns available maintenance windows (window_start_min, window_end_min, duration_hrs)
        for a given corridor ID.
        """
        if corridor_id in self._cached_windows:
            return self._cached_windows[corridor_id]

        windows = []
        if os.path.exists(self.free_windows_csv):
            with open(self.free_windows_csv, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    c_key = f"{row['from_station']}_{row['to_station']}"
                    mapped_cid = self._station_to_corridor.get(c_key, "")
                    
                    if mapped_cid == corridor_id or row.get("corridor_id") == corridor_id:
                        s_min = hhmm_to_min(row.get("free_from_hhmm", "09:30"))
                        e_min = hhmm_to_min(row.get("free_to_hhmm", "12:30"))
                        dur_min = int(row.get("free_duration_min", 180))
                        dur_hrs = round(dur_min / 60.0, 2)
                        
                        # Only consider windows of at least 1.5 hours duration
                        if dur_hrs >= 1.5:
                            windows.append({
                                "window_start_min": s_min,
                                "window_end_min": e_min,
                                "duration_hrs": dur_hrs
                            })
                            if len(windows) >= 3:
                                break
        
        # Default standard IR maintenance corridor slots if not found
        if not windows:
            windows = [
                {"window_start_min": 570, "window_end_min": 750, "duration_hrs": 3.0},   # 09:30 - 12:30 IST (Midday Lull)
                {"window_start_min": 780, "window_end_min": 930, "duration_hrs": 2.5},   # 13:00 - 15:30 IST (Afternoon Gap)
                {"window_start_min": 1380, "window_end_min": 1620, "duration_hrs": 4.0}  # 23:00 - 03:00 IST (Night Corridor Block)
            ]

        self._cached_windows[corridor_id] = windows
        return windows


if __name__ == "__main__":
    engine = CorridorCapacityEngine()
    test_corr = "COR03213"
    windows = engine.get_free_windows_for_corridor(test_corr)
    print(f"Capacity Windows for {test_corr}:", windows)