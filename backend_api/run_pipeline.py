"""
Run Pipeline
------------
Single entry point for backend_api (Person 2 — Layers 1-3), using
REAL data files (see each connector's docstring for exact source
paths in the actual repo):

    0. Apply db/schema.sql (safe to repeat: everything is IF NOT EXISTS)
    1. Load corridor_master.csv (needed for corridor_traffic_density join)
    2. Run each department connector (load real CSVs -> raw_defect_ingest)
    3. Run the normalizer (raw_defect_ingest -> defect_records)
    4. Score pending defects with Person 1's model and raise notifications
    5. Export notifications for the dashboard (dashboard/public/notifications.json)

Safe to re-run: nothing is ingested, normalized or notified twice.

Usage:
    python3 run_pipeline.py
"""

import sqlite3
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(HERE, "connectors"))
sys.path.append(os.path.join(HERE, "normalize"))
sys.path.append(os.path.join(HERE, "api"))
sys.path.append(os.path.join(HERE, "..", "ml_engine"))

import engineering_connector
import signal_connector
import traction_connector
import corridor_master_loader
import normalizer
import query_api
import predict_priority

DB_PATH = os.path.join(HERE, "db", "railway.db")
SCHEMA_PATH = os.path.join(HERE, "db", "schema.sql")
NOTIFICATIONS_JSON = os.path.join(HERE, "..", "dashboard", "public", "notifications.json")


def apply_schema(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    with open(SCHEMA_PATH, encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.close()


def print_summary(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM corridor_master")
    corridor_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM raw_defect_ingest")
    raw_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM defect_records")
    norm_count = cur.fetchone()[0]

    cur.execute("SELECT department, COUNT(*) FROM raw_defect_ingest GROUP BY department")
    by_dept = cur.fetchall()

    cur.execute("SELECT event_type, COUNT(*) FROM notifications GROUP BY event_type")
    by_event = cur.fetchall()
    conn.close()

    pending = query_api.get_pending_defects(db_path=db_path)

    print("\n=== PIPELINE SUMMARY ===")
    print(f"corridor_master loaded: {corridor_count}")
    print(f"raw_defect_ingest total: {raw_count}")
    print(f"defect_records total:    {norm_count}")
    print(f"By department: {by_dept}")
    print(f"get_pending_defects() returned: {len(pending)} records")
    print(f"Notifications by type: {by_event}")
    if pending:
        print(f"Sample record: {pending[0]}")


def run(db_path=DB_PATH, notifications_json=NOTIFICATIONS_JSON):
    print("[0/6] Applying schema...")
    apply_schema(db_path)

    print("[1/6] Loading corridor_master...")
    corridor_master_loader.load(db_path=db_path)

    print("[2/6] Running Engineering connector (TMS data)...")
    engineering_connector.run(db_path=db_path)

    print("[3/6] Running Signal & Telecommunication connector (SMMS data)...")
    signal_connector.run(db_path=db_path)

    print("[4/6] Running Traction Distribution connector (TDMS data)...")
    traction_connector.run(db_path=db_path)

    print("[5/6] Running normalizer...")
    normalizer.run(db_path=db_path)

    print("[6/6] Scoring pending defects and raising notifications...")
    ranked = predict_priority.score_all_pending_tasks(query_api.get_pending_defects(db_path=db_path))
    added = query_api.notify_scored(ranked, predict_priority.ALERT_MIN_PROBABILITY, db_path=db_path)
    written = query_api.export_notifications(notifications_json, db_path=db_path)
    print(f"      {added} new notifications; {written} exported to {os.path.normpath(notifications_json)}")

    print_summary(db_path)


if __name__ == "__main__":
    run()
