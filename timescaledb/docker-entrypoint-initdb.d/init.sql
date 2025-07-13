-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS raw_data (
    timestamp TIMESTAMPTZ NOT NULL,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    value DOUBLE PRECISION,
    is_imputed BOOLEAN DEFAULT FALSE,
    imputation_method VARCHAR(50),
    gap_duration_hours INTEGER,
    PRIMARY KEY (timestamp, user_id, metric_type)
);

-- Convert to hypertable if not exists
SELECT create_hypertable('raw_data', 'timestamp', if_not_exists => TRUE);

-- DROP the bad index (if it already exists)
DROP INDEX IF EXISTS raw_data_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS raw_data_unique_idx
  ON raw_data (timestamp, user_id, metric_type);

-- Add index for imputation queries
CREATE INDEX IF NOT EXISTS raw_data_imputed_idx ON raw_data (user_id, metric_type, is_imputed, timestamp);

-- Add daily aggregate table
CREATE TABLE IF NOT EXISTS data_1d (
    date_day DATE NOT NULL,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    avg_value DOUBLE PRECISION,
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    count_points INTEGER,
    real_points INTEGER DEFAULT 0,
    imputed_points INTEGER DEFAULT 0,
    PRIMARY KEY (date_day, user_id, metric_type)
);

-- Convert aggregate table to hypertable
SELECT create_hypertable('data_1d', 'date_day', if_not_exists => TRUE);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    enrollment_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gaps metadata table for tracking detected gaps
CREATE TABLE IF NOT EXISTS data_gaps (
    gap_id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    gap_start TIMESTAMPTZ NOT NULL,
    gap_end TIMESTAMPTZ NOT NULL,
    gap_duration_hours INTEGER NOT NULL,
    gap_type VARCHAR(20) NOT NULL CHECK (gap_type IN ('short', 'medium', 'long')),
    imputation_applied BOOLEAN DEFAULT FALSE,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, metric_type, gap_start, gap_end)
);

-- Add index for gap queries
CREATE INDEX IF NOT EXISTS data_gaps_user_metric_idx ON data_gaps (user_id, metric_type, gap_start);