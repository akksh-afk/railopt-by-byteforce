"""
Run Pipeline
------------
Single entry point for backend_api (Person 2 — Layers 1-3), using
REAL data files (see each connector's docstring for exact source
paths in the actual repo):

    1. Load corridor_master.csv (needed for corridor_traffic_density join)
    2. Run each department connector (load real CSVs -> raw_defect_ingest)
    3. Run the normalizer (raw_defect_ingest -> defect_records)
    4. Confirm the query API works (get_pending_defects)

Usage:
    python3 run_pipeline.py
"""

import sqlite3
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "connectors"))
sys.path.append(os.path.join(os.path.dirname(__file__), "normalize"))
sys.path.append(os.path.join(os.path.dirname(__file__), "api"))

import engineering_connector
import signal_connector
import traction_connector
import corridor_master_loader
import normalizer
import query_api

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", "railway.db")


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
    conn.close()

    pending = query_api.get_pending_defects(db_path=db_path)

    print("\n=== PIPELINE SUMMARY ===")
    print(f"corridor_master loaded: {corridor_count}")
    print(f"raw_defect_ingest total: {raw_count}")
    print(f"defect_records total:    {norm_count}")
    print(f"By department: {by_dept}")
    print(f"get_pending_defects() returned: {len(pending)} records")
    if pending:
        print(f"Sample record: {pending[0]}")


def run():
    print("[1/5] Loading corridor_master...")
    corridor_master_loader.load(db_path=DB_PATH)

    print("[2/5] Running Engineering connector (TMS data)...")
    engineering_connector.run(db_path=DB_PATH)

    print("[3/5] Running Signal & Telecommunication connector (SMMS data)...")
    signal_connector.run(db_path=DB_PATH)

    print("[4/5] Running Traction Distribution connector (TDMS data)...")
    traction_connector.run(db_path=DB_PATH)

    print("[5/5] Running normalizer...")
    normalizer.run(db_path=DB_PATH)

    print_summary()


if __name__ == "__main__":
    run()
