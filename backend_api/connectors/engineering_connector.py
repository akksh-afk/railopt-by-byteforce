"""
Engineering Connector (TMS data)
---------------------------------
Reads data/synthetic/synthetic_TMS_engineering_defects.csv and loads
it into raw_defect_ingest. This is real data already generated and
calibrated by Person 1 (see CONTRACTS.md, project README) — this
connector does NOT generate its own synthetic data.

Source columns (verified against the actual file):
    tms_record_id, corridor_id, from_station, to_station, zone,
    defect_type, severity_class, detected_date, originally_due_date,
    days_overdue, inspection_method, estimated_repair_duration_hrs,
    requires_traffic_block, department

CSV_PATH below points at the reference copy used to build/test this
connector. In the real repo, update it to the actual path:
    data/synthetic/synthetic_TMS_engineering_defects.csv
"""

import sqlite3
import csv
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "db", "railway.db")
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "synthetic", "synthetic_TMS_engineering_defects.csv")
DEPARTMENT = "Engineering"


def load_records(csv_path=CSV_PATH):
    records = []
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            records.append(row)
    return records


def insert_records(records, conn):
    """Returns how many records were new (already-ingested ones are skipped)."""
    before = conn.total_changes
    cur = conn.cursor()
    for r in records:
        cur.execute(
            """
            INSERT OR IGNORE INTO raw_defect_ingest
                (department, source_record_id, corridor_id, zone, defect_type, severity_class,
                 days_overdue, estimated_repair_duration_hrs, requires_block, raw_payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                DEPARTMENT,
                r["tms_record_id"],
                r["corridor_id"],
                r["zone"],
                r["defect_type"],
                r["severity_class"],
                int(r["days_overdue"]),
                float(r["estimated_repair_duration_hrs"]),
                1 if r["requires_traffic_block"].strip().lower() == "true" else 0,
                json.dumps(r),
            ),
        )
    conn.commit()
    return conn.total_changes - before


def run(csv_path=CSV_PATH, db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    records = load_records(csv_path)
    added = insert_records(records, conn)
    print(f"[Engineering connector] Loaded {added} new of {len(records)} records from {os.path.basename(csv_path)}.")
    conn.close()


if __name__ == "__main__":
    run()
