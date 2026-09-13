"""
Corridor Master Loader
------------------------
Loads data/derived/corridor_master.csv into the corridor_master
table. Run once (or whenever the file updates) before the normalizer,
since corridor_traffic_density is joined from num_trains_using here.

CSV_PATH below points at the reference copy used to build/test this
loader. In the real repo, update it to the actual path:
    data/derived/corridor_master.csv
"""

import sqlite3
import csv
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "db", "railway.db")
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "derived", "corridor_master.csv")


def load(csv_path=CSV_PATH, db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    loaded = 0
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            # approx_distance_km is missing for some real corridors (~5% of rows);
            # store as NULL rather than failing the whole load.
            distance = row["approx_distance_km"].strip()
            try:
                cur.execute(
                    """
                    INSERT INTO corridor_master
                        (corridor_id, from_station, to_station, from_name, to_name, zone,
                         approx_distance_km, num_trains_using, num_daily_occupancy_events)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        row["corridor_id"], row["from_station"], row["to_station"],
                        row["from_name"], row["to_name"], row["zone"],
                        float(distance) if distance else None,
                        int(row["num_trains_using"]),
                        int(row["num_daily_occupancy_events"]),
                    ),
                )
                loaded += 1
            except sqlite3.IntegrityError:
                pass  # already loaded — safe to re-run
    conn.commit()
    print(f"[corridor_master loader] Loaded {loaded} new corridors (duplicates skipped).")
    conn.close()


if __name__ == "__main__":
    load()
