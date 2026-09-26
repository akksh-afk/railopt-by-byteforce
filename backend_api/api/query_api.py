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
    from predict_priority import score_all_pending_tasks
    # field names match CONTRACTS.md Interface 1 exactly, so the list goes
    # straight into Person 1's scorer (it takes the whole list, not one record)
    ranked = score_all_pending_tasks(get_pending_defects())

Also home to the notification functions (CONTRACTS.md Interface 7):
notify(), get_notifications(), mark_read(), notify_scored(),
on_schedule_approved() and export_notifications().
"""

import json
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
    Marks a defect record scheduled, so it stops showing up in
    get_pending_defects(). Only do this once Layer 7 has PASSED the
    schedule -- on_schedule_approved() does it for you. Marking a record
    when it goes into a *draft* loses it if the draft is then rejected.
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("UPDATE defect_records SET status = 'scheduled' WHERE record_id = ?", (record_id,))
    conn.commit()
    updated = cur.rowcount
    conn.close()
    return updated > 0


# ---------------------------------------------------------------------------
# Notifications (CONTRACTS.md Interface 7)
# ---------------------------------------------------------------------------

# What happens next for each event; shown in the dashboard's alert detail.
ACTION_TAKEN = {
    "HIGH_PRIORITY_DEFECT": "Waiting for a slot in the next block plan.",
    "NEEDS_REVIEW": "Scored with a fallback category. Check the record by hand before trusting its score.",
    "RECORD_SKIPPED": "Left out of planning until its corridor or severity is corrected.",
    "VALIDATION_FAIL": "Schedule sent back to the optimizer. No defect was marked scheduled.",
    "BLOCK_ASSIGNED": "Block approved. Its defects are marked scheduled.",
}


def notify(notifications, db_path=DB_PATH):
    """
    Records notifications. Each item is a dict with event_type, severity,
    recipient, ref_id, title, message and (optionally) corridor_id.
    Sending the same event_type + ref_id + recipient again is ignored, so
    pipeline re-runs don't duplicate alerts. Returns how many were new.
    """
    conn = sqlite3.connect(db_path)
    before = conn.total_changes
    conn.executemany(
        """
        INSERT OR IGNORE INTO notifications
            (event_type, severity, recipient, ref_id, corridor_id, title, message)
        VALUES (:event_type, :severity, :recipient, :ref_id, :corridor_id, :title, :message)
        """,
        [{"corridor_id": None, **n} for n in notifications],
    )
    conn.commit()
    added = conn.total_changes - before
    conn.close()
    return added


def get_notifications(recipient=None, unread_only=False, db_path=DB_PATH):
    """
    Newest batch first. recipient: 'Controller' or a department name
    (None = everyone's). Rows are the notifications table's columns.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    query = "SELECT * FROM notifications WHERE 1 = 1"
    params = []
    if recipient:
        query += " AND recipient = ?"
        params.append(recipient)
    if unread_only:
        query += " AND read_at IS NULL"
    rows = [dict(r) for r in conn.execute(query + " ORDER BY created_at DESC, id", params)]
    conn.close()
    return rows


def mark_read(notification_id, db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    cur = conn.execute(
        "UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND read_at IS NULL",
        (notification_id,),
    )
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def notify_scored(ranked, min_probability, db_path=DB_PATH):
    """
    Raises alerts from Person 1's score_all_pending_tasks() output:
      HIGH_PRIORITY_DEFECT -> Controller + the defect's department, for
                              ml_failure_probability >= min_probability
      NEEDS_REVIEW         -> Controller, for records scored with a fallback category
    Returns how many notifications were new.
    """
    rows = []
    for r in ranked:
        if r["ml_failure_probability"] >= min_probability:
            for recipient in ("Controller", r["department"]):
                rows.append({
                    "event_type": "HIGH_PRIORITY_DEFECT", "severity": "CRITICAL",
                    "recipient": recipient, "ref_id": r["record_id"], "corridor_id": r["corridor_id"],
                    "title": f"Class {r['severity_class']} {r['defect_type']} scored {r['final_priority_score']}",
                    "message": f"{r['record_id']} ({r['department']}), {r['days_overdue']} days overdue. "
                               f"{r['explanation']}",
                })
        if r.get("needs_review"):
            rows.append({
                "event_type": "NEEDS_REVIEW", "severity": "HIGH",
                "recipient": "Controller", "ref_id": r["record_id"], "corridor_id": r["corridor_id"],
                "title": f"{r['record_id']} needs manual review",
                "message": r["explanation"],
            })
    return notify(rows, db_path=db_path)


def on_schedule_approved(report, schedule, db_path=DB_PATH):
    """
    Call with Layer 7's validation report and the schedule it checked.

      PASS: marks every task in every block scheduled, and tells each
            department in a block it has been assigned (BLOCK_ASSIGNED).
      FAIL: one VALIDATION_FAIL per violation to the Controller, and nothing
            is marked scheduled -- so a rejected draft never makes defects
            drop out of get_pending_defects().

    Takes both block shapes in use today: Interface 4 blocks (block_id,
    tasks, departments) and the validator's per-task rows (task_id).
    Returns how many defect records were marked scheduled.
    """
    if report["status"] != "PASS":
        rows = []
        for v in report["violations"]:
            code = v.get("rule_code") or v.get("code")
            ref = v.get("block_id") or ",".join(v.get("task_ids", []))
            rows.append({
                "event_type": "VALIDATION_FAIL",
                "severity": "CRITICAL" if code.startswith("ERR_") else "MODERATE",
                "recipient": "Controller", "ref_id": f"{ref}:{code}", "corridor_id": v.get("corridor_id"),
                "title": f"Safety check failed: {code}",
                "message": v.get("detail", ""),
            })
        notify(rows, db_path=db_path)
        return 0

    marked = 0
    rows = []
    for block in schedule:
        block_id = block.get("block_id") or block["task_id"]
        tasks = block.get("tasks") or [block["task_id"]]
        departments = block.get("departments") or [block.get("department", "Controller")]
        marked += sum(mark_scheduled(t, db_path=db_path) for t in tasks)
        for dept in departments:
            others = [d for d in departments if d != dept]
            rows.append({
                "event_type": "BLOCK_ASSIGNED", "severity": "MODERATE",
                "recipient": dept, "ref_id": block_id, "corridor_id": block.get("corridor_id"),
                "title": f"Joint block with {', '.join(others)}" if others else "Block assigned",
                "message": f"{block_id} on {block.get('corridor_id')}, "
                           f"{block.get('start_time')} to {block.get('end_time')}: {len(tasks)} task(s).",
            })
    notify(rows, db_path=db_path)
    return marked


def export_notifications(path, db_path=DB_PATH):
    """
    Writes every notification as the JSON list the dashboard's Alerts feed
    reads (same keys as its mockAlerts, plus recipient and read). Newest
    batch first. Returns how many were written.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT n.*, c.zone, c.from_name, c.to_name
        FROM notifications n
        LEFT JOIN corridor_master c ON c.corridor_id = n.corridor_id
        ORDER BY n.created_at DESC, n.id
        """
    ).fetchall()
    conn.close()
    alerts = [{
        "id": f"ALT-{r['id']}",
        "severity": r["severity"],
        "rule_code": r["event_type"],
        "title": r["title"],
        "message": r["message"],
        "corridor_id": r["corridor_id"] or "",
        "zone": r["zone"] or "",
        "section": f"{r['from_name']} - {r['to_name']}" if r["from_name"] else "",
        "recipient": r["recipient"],
        "time": f"{r['created_at']} UTC",
        "read": r["read_at"] is not None,
        "action_taken": ACTION_TAKEN.get(r["event_type"], ""),
    } for r in rows]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=1)
    return len(alerts)


if __name__ == "__main__":
    # Quick manual check when run directly
    records = get_pending_defects()
    print(f"{len(records)} pending defect records.")
    for r in records[:3]:
        print(r)
