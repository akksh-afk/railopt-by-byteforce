"""
Normalizer
----------
Reads raw_defect_ingest, applies the transformations verified against
the real data files, and writes clean rows into defect_records
matching CONTRACTS.md Interface 1 exactly (plus status, our addition).

Transformations (each verified against ml_training_dataset.csv):
    - source_record_id -> record_id (straight rename, values unchanged)
    - severity_class -> severity_score: A=3, B=2, C=1 (deterministic, 100% consistent in real data)
    - requires_block -> requires_traffic_or_power_block (straight rename,
      already unified across departments at ingest time)
    - corridor_traffic_density: joined from corridor_master.num_trains_using
      via corridor_id (verified: exact match, 0 discrepancies across 11,500 real rows)

Safe to re-run: only processes raw rows whose record_id isn't already
in defect_records.

Skipped records (unknown corridor or severity) raise a RECORD_SKIPPED
notification, so they don't just vanish from the plan.
"""

import sqlite3
import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "api"))
from query_api import notify

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "db", "railway.db")

SEVERITY_SCORE_MAP = {"A": 3, "B": 2, "C": 1}


def get_unnormalized_raw_records(conn):
    cur = conn.cursor()
    cur.execute(
        """
        SELECT r.raw_id, r.department, r.source_record_id, r.corridor_id, r.zone, r.defect_type,
               r.severity_class, r.days_overdue, r.estimated_repair_duration_hrs, r.requires_block
        FROM raw_defect_ingest r
        LEFT JOIN defect_records d ON r.source_record_id = d.record_id
        WHERE d.record_id IS NULL
        """
    )
    return cur.fetchall()


def get_corridor_traffic_density(conn, corridor_id):
    cur = conn.cursor()
    cur.execute("SELECT num_trains_using FROM corridor_master WHERE corridor_id = ?", (corridor_id,))
    row = cur.fetchone()
    return row[0] if row else None


def normalize(conn):
    """Returns the skipped records as (record_id, department, corridor_id, severity_class) tuples."""
    raw_records = get_unnormalized_raw_records(conn)
    normalized_count = 0
    skipped = []
    cur = conn.cursor()

    for (raw_id, department, source_record_id, corridor_id, zone, defect_type,
         severity_class, days_overdue, estimated_repair_duration_hrs, requires_block) in raw_records:

        severity_score = SEVERITY_SCORE_MAP.get(severity_class)
        corridor_traffic_density = get_corridor_traffic_density(conn, corridor_id)

        if severity_score is None or corridor_traffic_density is None:
            print(f"[normalizer] WARNING: incomplete data for record_id={source_record_id} "
                  f"(severity_class={severity_class}, corridor_id={corridor_id}) — skipping")
            skipped.append((source_record_id, department, corridor_id, severity_class))
            continue

        cur.execute(
            """
            INSERT INTO defect_records
                (record_id, department, corridor_id, zone, defect_type, severity_class,
                 severity_score, days_overdue, corridor_traffic_density,
                 estimated_repair_duration_hrs, requires_traffic_or_power_block, status, raw_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (
                source_record_id, department, corridor_id, zone, defect_type, severity_class,
                severity_score, days_overdue, corridor_traffic_density,
                estimated_repair_duration_hrs, requires_block, raw_id,
            ),
        )
        normalized_count += 1

    conn.commit()
    print(f"[normalizer] Normalized {normalized_count} records, skipped {len(skipped)}.")
    return skipped


def run(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    skipped = normalize(conn)
    conn.close()
    notify([{
        "event_type": "RECORD_SKIPPED", "severity": "MODERATE", "recipient": "Controller",
        "ref_id": record_id, "corridor_id": corridor_id,
        "title": f"{record_id} left out of planning",
        "message": f"{department} record {record_id} has corridor_id={corridor_id} and "
                   f"severity_class={severity_class}; one of them isn't recognised, so it "
                   f"wasn't normalized and won't be scored or scheduled.",
    } for record_id, department, corridor_id, severity_class in skipped], db_path=db_path)


if __name__ == "__main__":
    run()
