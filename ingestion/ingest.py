#!/usr/bin/env python3
import os
import datetime
import random
from datetime import timedelta, timezone
import psycopg2
from psycopg2.extras import execute_values
import wearipedia
from dotenv import load_dotenv
# Load environment variables from .env
load_dotenv()
SEED = int(os.getenv("SEED", "42"))
# Database connection parameters
DB_PARAMS = {
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "host":     os.getenv("DB_HOST"),
    "port":     os.getenv("DB_PORT", 5432),
}
# Determine synthetic vs. real mode based on presence of a Fitbit token. Note that this feature haven't been tested because I don't have a fitbit or apple watch
FITBIT_TOKEN = os.getenv("FITBIT_ACCESS_TOKEN", "")
SYNTHETIC    = FITBIT_TOKEN == ""  # no token → synthetic
LAST_RUN_FILE = "/app/last_run.txt"
# These are the Fitbit intraday metrics we ingest
METRICS = [
    "intraday_heart_rate",
    "intraday_breath_rate",
    "intraday_active_zone_minute",
    "intraday_activity",
    "intraday_hrv",
    "intraday_spo2",
]


def log(msg: str):
    print(msg)

# Read and parse the last ingestion timestamp from file, ensure it is timezone-aware, and convert to the container's local timezone.
def get_last_timestamp() -> datetime.datetime:
    raw = open(LAST_RUN_FILE, 'r').read().strip()
    ts_str = raw.split('#', 1)[0].strip()
    if ts_str.endswith('Z'):
        ts_str = ts_str[:-1] + '+00:00'
    dt = datetime.datetime.fromisoformat(ts_str)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone()

# Write the provided timestamp back to the last_run file in ISO format.
def update_last_run(ts: datetime.datetime):
    with open(LAST_RUN_FILE, "w") as f:
        f.write(ts.isoformat())

# Generate synthetic hourly data points between start and end timestamps. Each point has a random value for the given metric.
def synthetic_data(start: datetime.datetime, end: datetime.datetime, metric: str):

    # Normalize end to start's timezone if needed
    if end.tzinfo != start.tzinfo:
        end = end.astimezone(start.tzinfo)

    rows = []
    current = start.replace(minute=0, second=0, microsecond=0)
    while current <= end:
        ts = current.isoformat()
        val = random.uniform(0, 100)
        rows.append((ts, metric, val))
        current += timedelta(hours=1)
    return rows

# Fetches data from Fitbit or generates synthetic rows for all metrics between the provided start_time and end_time.
def fetch_fitbit_data(start_time: datetime.datetime, end_time: datetime.datetime):
    rows = []

    if SYNTHETIC:
        log(f"[DRYRUN] Generating synthetic data for {len(METRICS)} metrics")
        for metric in METRICS:
            part = synthetic_data(start_time, end_time, metric)
            log(f"[DRYRUN]   {len(part)} points for {metric}")
            rows.extend(part)
        return rows
    # Real Fitbit API path
    device = wearipedia.get_device("fitbit/fitbit_charge_6")
    device.authenticate(FITBIT_TOKEN)

    date_params = {
        "seed": SEED,
        "start_date": start_time.date().isoformat(),
        "end_date":   end_time.date().isoformat(),
    }

    for metric in METRICS:
        log(f"[FETCH] {metric}: {date_params['start_date']} → {date_params['end_date']}")
        raw = device.get_data(metric, date_params)
        log(f"[FETCH]   day-entries: {len(raw)}")

        for entry in raw:
            day_meta = entry.get("heart_rate_day", [{}])[0]
            ah = day_meta.get("activities-heart", [])
            if ah and "dateTime" in ah[0]:
                day_str = ah[0]["dateTime"]
            else:
                day_str = day_meta.get("dateTime")

            intraday = entry.get("activities-heart-intraday", {}).get("dataset", [])
            for pt in intraday:
                ts = f"{day_str}T{pt['time']}"
                rows.append((ts, metric, pt['value']))

    return rows

# Bulk-insert the list of (timestamp, metric_type, value) records into the raw_data table with ON CONFLICT deduplication.
def save_data(records):
    if not records:
        print("[save_data] no new records to save")
        return

    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    sql = (
        "INSERT INTO raw_data (timestamp, metric_type, value) "
        "VALUES %s "
        "ON CONFLICT (timestamp, metric_type) DO NOTHING;"
    )
    execute_values(cur, sql, records, template=None, page_size=1000)
    conn.commit()
    cur.close()
    conn.close()
    print(f"[save_data] inserted {len(records)} rows")

# Main entrypoint: determine the ingestion window, fetch/generate data, save to DB, and update the last-run pointer.
def main():
    now = datetime.datetime.now().astimezone()
    last_run = get_last_timestamp()
    print(f"[ingest] running: {last_run.isoformat()} → {now.isoformat()}")

    data = fetch_fitbit_data(last_run, now)
    print(f"[ingest] fetched {len(data)} points")
    save_data(data)

    update_last_run(now)
    print(f"[ingest] done, last_run updated → {now.isoformat()}")


if __name__ == "__main__":
    main()