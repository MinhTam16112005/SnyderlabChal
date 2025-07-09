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

-- Add unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS raw_data_unique_idx 
ON raw_data (timestamp, metric_type);