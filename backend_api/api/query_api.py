"""
Query API
---------
This is what Interface 1/2 in CONTRACTS.md means by "how the database
will expose data" — Person 3 (or anyone else) should call these
functions instead of writing SQL against defect_records directly.

Resolves CONTRACTS.md Open Item #3:
    "Person 2: confirm how the database will expose Interface 1/2
    data — i.e., what function/query other layers call to get
    pending defect records (rather than reading CSVs directly)."

Usage (from Person 3's code):
    from api.query_api import get_pending_defects
    records = get_pending_defects()
    for r in records:
        # r["record_id"], r["corridor_id"], etc. match CONTRACTS.md
        # Interface 1 field names exactly — feed straight into
        # Person 1's score_record().
        ...
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "db", "railway.db")


def _row_to_dict(row, columns):
    d = dict(zip(columns, row))
    # requires_traffic_or_power_block is stored as 0/1 in SQLite;
    # CONTRACTS.md examples use JSON true/false, so convert on the way out.
    d["requires_traffic_or_power_block"] = bool(d["requires_traffic_or_power_block"])
    return d


def get_pending_defects(department=None, corridor_id=None, db_path=DB_PATH):
    """
    Returns pending defect records as a list of dicts, field names
    matching CONTRACTS.md Interface 1 exactly (status is dropped from
    the output since it isn't part of that contract — it's purely
    our internal bookkeeping field).

    Optional filters:
        department:  e.g. "Engineering" — only that department's defects
        corridor_id: e.g. "COR1001" — only that corridor's defects
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    query = """
        SELECT record_id, department, corridor_id, zone, defect_type, severity_class,
               severity_score, days_overdue, corridor_traffic_density,
               estimated_repair_duration_hrs, requires_traffic_or_power_block
        FROM defect_records
        WHERE status = 'pending'
    """
    params = []
    if department:
        query += " AND department = ?"
        params.append(department)
    if corridor_id:
        query += " AND corridor_id = ?"
        params.append(corridor_id)

    cur.execute(query, params)
    columns = [desc[0] for desc in cur.description]
    results = [_row_to_dict(row, columns) for row in cur.fetchall()]
    conn.close()
    return results


def mark_scheduled(record_id, db_path=DB_PATH):
    """
    Call this once the optimizer has placed a defect record into a
    draft schedule, so it stops showing up in get_pending_defects().
    Not part of CONTRACTS.md — an operational convenience so the
    'pending' concept actually means something over time.
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("UPDATE defect_records SET status = 'scheduled' WHERE record_id = ?", (record_id,))
    conn.commit()
    updated = cur.rowcount
    conn.close()
    return updated > 0


if __name__ == "__main__":
    # Quick manual check when run directly
    records = get_pending_defects()
    print(f"{len(records)} pending defect records.")
    for r in records[:3]:
        print(r)
