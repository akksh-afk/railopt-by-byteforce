"""
End-to-end check for backend_api:   python test_pipeline.py
Builds a throwaway database, so db/railway.db and the dashboard's
notifications.json are never touched.
"""

import json
import os
import sqlite3
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import run_pipeline  # also puts api/ and ml_engine/ on the path
import query_api
import predict_priority

TABLES = ("raw_defect_ingest", "defect_records", "notifications")


def count(db, table, where="1 = 1"):
    conn = sqlite3.connect(db)
    n = conn.execute(f"SELECT COUNT(*) FROM {table} WHERE {where}").fetchone()[0]
    conn.close()
    return n


with tempfile.TemporaryDirectory() as tmp:
    db = os.path.join(tmp, "railway.db")
    out = os.path.join(tmp, "notifications.json")

    # Re-running changes nothing: no duplicate raw rows, records or alerts.
    run_pipeline.run(db, out)
    first = [count(db, t) for t in TABLES]
    run_pipeline.run(db, out)
    assert [count(db, t) for t in TABLES] == first, first
    assert first[:2] == [11500, 11500] and first[2] > 0, first

    # The export carries the keys the dashboard's Alerts feed reads.
    alerts = json.load(open(out, encoding="utf-8"))
    assert len(alerts) == first[2]
    assert {"id", "severity", "rule_code", "title", "message", "corridor_id", "time", "action_taken"} <= set(alerts[0])

    # A failed validation marks nothing scheduled; a passed one marks the
    # tasks and tells every department in the block.
    pending = query_api.get_pending_defects(db_path=db)
    ids = [r["record_id"] for r in pending[:2]]
    block = {"block_id": "BLK_TEST", "corridor_id": pending[0]["corridor_id"],
             "start_time": "2026-09-01 09:00", "end_time": "2026-09-01 11:00",
             "tasks": ids, "departments": ["Engineering", "Signal & Telecommunication"]}
    fail = {"status": "FAIL", "violations": [{"rule_code": "ERR_TRACK_OVERLAP", "task_ids": ids,
                                              "corridor_id": block["corridor_id"], "detail": "test"}]}
    assert query_api.on_schedule_approved(fail, [block], db_path=db) == 0
    assert count(db, "defect_records", "status = 'scheduled'") == 0
    assert count(db, "notifications", "event_type = 'VALIDATION_FAIL'") == 1
    assert query_api.on_schedule_approved({"status": "PASS", "violations": []}, [block], db_path=db) == 2
    assert count(db, "defect_records", "status = 'scheduled'") == 2
    assert count(db, "notifications", "event_type = 'BLOCK_ASSIGNED'") == 2
    assert len(query_api.get_pending_defects(db_path=db)) == 11498

# Scorer: every spelling of "needs a block" scores like True (they used to
# fall back to "False"), and an unseen category is flagged, not hidden.
FLAG = "requires_traffic_or_power_block"
sample = [dict(r, **{FLAG: v}) for r in pending[:300] for v in (True, False)]
by_flag = {(r["record_id"], r[FLAG]): r["final_priority_score"] for r in predict_priority.score_all_pending_tasks(sample)}
record = next(r for r in pending[:300] if by_flag[(r["record_id"], True)] != by_flag[(r["record_id"], False)])
for spelling in ("true", "TRUE", 1, "1", "yes"):
    assert predict_priority.score_record(dict(record, **{FLAG: spelling}))["final_priority_score"] \
        == by_flag[(record["record_id"], True)], spelling
unseen = predict_priority.score_record(dict(record, defect_type="brand_new_fault"))
assert unseen["needs_review"] and "brand_new_fault" in unseen["explanation"]
assert not predict_priority.score_record(record)["needs_review"]

print("\nOK: backend pipeline, notifications and scorer checks passed")
