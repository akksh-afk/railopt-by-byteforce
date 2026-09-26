-- =========================================================
-- RailOpt — backend_api (Person 2: Backend/database + data connectors)
-- Built against the ACTUAL data files in data/synthetic/ and
-- data/derived/ (synthetic_TMS_engineering_defects.csv,
-- synthetic_SMMS_signal_defects.csv,
-- synthetic_TDMS_traction_defects.csv, corridor_master.csv) —
-- verified field-by-field against CONTRACTS.md Interface 1.
-- =========================================================

-- ---------------------------------------------------------
-- CORRIDOR REFERENCE
-- Loaded once from data/derived/corridor_master.csv (8,622 real
-- corridors derived from data.gov.in). corridor_id here is
-- authoritative — raw defect files already use it directly, no
-- alias/reconciliation step needed.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS corridor_master (
    corridor_id                  TEXT PRIMARY KEY,
    from_station                 TEXT,
    to_station                   TEXT,
    from_name                    TEXT,
    to_name                      TEXT,
    zone                         TEXT,
    approx_distance_km           REAL,
    num_trains_using             INTEGER,   -- source for corridor_traffic_density
    num_daily_occupancy_events   INTEGER
);

-- ---------------------------------------------------------
-- RAW INGEST
-- One row per source record, kept close to each department's
-- own file shape. source_record_id is that department's own ID
-- column name (tms_record_id / smms_record_id / tdms_record_id)
-- before being renamed to record_id downstream.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_defect_ingest (
    raw_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    department                TEXT NOT NULL,   -- 'Engineering' | 'Signal & Telecommunication' | 'Traction Distribution'
    source_record_id          TEXT NOT NULL,   -- e.g. 'TMS000001', 'SMMS000001', 'TDMS000001'
    corridor_id               TEXT NOT NULL,   -- already canonical, matches corridor_master
    zone                      TEXT,
    defect_type               TEXT,
    severity_class            TEXT,            -- 'A' | 'B' | 'C'
    days_overdue              INTEGER,
    estimated_repair_duration_hrs  REAL,
    requires_block            INTEGER,         -- 0/1 — from requires_traffic_block OR requires_power_block, whichever the department uses
    raw_payload               TEXT,            -- full original row as JSON, nothing lost
    ingested_at               TEXT DEFAULT (datetime('now'))
);

-- A department's record is ingested once. Connectors use INSERT OR IGNORE
-- against this, so re-running run_pipeline.py doesn't duplicate raw rows.
-- (An index rather than a table constraint so it also applies to an
-- existing railway.db.)
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_source
    ON raw_defect_ingest(department, source_record_id);

-- ---------------------------------------------------------
-- DEFECT RECORDS (normalized)
-- Field names are EXACT match to CONTRACTS.md Interface 1.
-- corridor_traffic_density is joined from corridor_master at
-- normalization time (verified: always equals num_trains_using).
--
-- ADDITION beyond the contract: `status` column, so
-- get_pending_defects() (api/query_api.py) has something to
-- filter pending vs scheduled work on. Not in CONTRACTS.md.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS defect_records (
    record_id                        TEXT PRIMARY KEY,   -- e.g. 'TMS000001'
    department                       TEXT NOT NULL,
    corridor_id                      TEXT NOT NULL,
    zone                              TEXT,
    defect_type                       TEXT,
    severity_class                    TEXT,
    severity_score                    INTEGER,            -- derived: A=3, B=2, C=1 (verified against ml_training_dataset.csv)
    days_overdue                      INTEGER,
    corridor_traffic_density          INTEGER,            -- joined from corridor_master.num_trains_using
    estimated_repair_duration_hrs     REAL,
    requires_traffic_or_power_block   INTEGER,            -- 0/1
    status                            TEXT DEFAULT 'pending',  -- 'pending' | 'scheduled' (our addition, not in contract)
    raw_id                            INTEGER,
    normalized_at                     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (raw_id) REFERENCES raw_defect_ingest(raw_id)
);

CREATE INDEX IF NOT EXISTS idx_defect_status ON defect_records(status);
CREATE INDEX IF NOT EXISTS idx_defect_corridor ON defect_records(corridor_id);
CREATE INDEX IF NOT EXISTS idx_defect_department ON defect_records(department);

-- ---------------------------------------------------------
-- NOTIFICATIONS (CONTRACTS.md Interface 7)
-- One row per alert per recipient. The UNIQUE key makes sending
-- the same event twice a no-op, so pipeline re-runs don't spam.
-- ref_id is NOT NULL on purpose: SQLite treats NULLs as distinct
-- inside UNIQUE, so a nullable ref_id would let duplicates in.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type    TEXT NOT NULL,   -- HIGH_PRIORITY_DEFECT | NEEDS_REVIEW | RECORD_SKIPPED | VALIDATION_FAIL | BLOCK_ASSIGNED
    severity      TEXT NOT NULL,   -- CRITICAL | HIGH | MODERATE (what the dashboard filters on)
    recipient     TEXT NOT NULL,   -- 'Controller' or a department name
    ref_id        TEXT NOT NULL,   -- record_id, block_id, or '<task ids>:<rule_code>'
    corridor_id   TEXT,
    title         TEXT NOT NULL,
    message       TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now')),
    read_at       TEXT,
    UNIQUE (event_type, ref_id, recipient)
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient, read_at);
