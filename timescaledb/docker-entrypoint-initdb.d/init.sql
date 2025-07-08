-- Connect to existing database
\c fitbit_data

-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS raw_data (
    timestamp TIMESTAMPTZ NOT NULL,
    metric_type TEXT NOT NULL,
    value DOUBLE PRECISION
);

-- Convert to hypertable if not exists
SELECT create_hypertable('raw_data', 'timestamp', if_not_exists => TRUE);

-- Add unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS raw_data_unique_idx 
ON raw_data (timestamp, metric_type);