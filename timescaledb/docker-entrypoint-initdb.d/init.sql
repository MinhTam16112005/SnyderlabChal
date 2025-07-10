-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS raw_data (
    timestamp TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    value DOUBLE PRECISION,
    PRIMARY KEY (timestamp, user_id, metric_type)
);

-- Convert to hypertable if not exists
SELECT create_hypertable('raw_data', 'timestamp', if_not_exists => TRUE);

-- DROP the bad index (if it already exists)
DROP INDEX IF EXISTS raw_data_unique_idx;

-- If you really want a secondary unique index, include user_id:
CREATE UNIQUE INDEX IF NOT EXISTS raw_data_unique_idx
  ON raw_data (timestamp, user_id, metric_type);

-- Add daily aggregate table
CREATE TABLE IF NOT EXISTS data_1d (
    date_day DATE NOT NULL,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    avg_value DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    count_points INTEGER,
    PRIMARY KEY (date_day, user_id, metric_type)
);

-- Convert aggregate table to hypertable
SELECT create_hypertable('data_1d', 'date_day', if_not_exists => TRUE);