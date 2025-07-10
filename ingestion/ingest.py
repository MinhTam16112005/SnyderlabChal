#!/usr/bin/env python3
import os
import datetime
import random
from datetime import timedelta, timezone
import psycopg2
from psycopg2.extras import execute_values
import wearipedia
from dotenv import load_dotenv
import pytz
import traceback

# Load environment variables from .env
load_dotenv()
print("[INIT] Loading environment variables...")

try:
    SEED = int(os.getenv("SEED", "42"))
    print(f"[INIT] SEED: {SEED}")
except Exception as e:
    print(f"[INIT] ERROR loading SEED: {e}")
    SEED = 42

try:
    USER_ID = os.getenv("FITBIT_USER_ID", "user_1")
    print(f"[INIT] USER_ID: {USER_ID}")
except Exception as e:
    print(f"[INIT] ERROR loading USER_ID: {e}")
    USER_ID = "user_1"

# Lock timezone to Los Angeles
try:
    LA_TIMEZONE = pytz.timezone('America/Los_Angeles')
    print(f"[INIT] LA_TIMEZONE: {LA_TIMEZONE}")
except Exception as e:
    print(f"[INIT] ERROR setting LA_TIMEZONE: {e}")
    raise

# Database connection parameters
try:
    DB_PARAMS = {
        "dbname":   os.getenv("DB_NAME"),
        "user":     os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "host":     os.getenv("DB_HOST"),
        "port":     os.getenv("DB_PORT", 5432),
    }
    # Print parameters (hiding password) for debugging
    print(f"[INIT] DB_PARAMS: {dict((k, v if k != 'password' else '***') for k, v in DB_PARAMS.items())}")
except Exception as e:
    print(f"[INIT] ERROR loading DB_PARAMS: {e}")
    raise

# Determine synthetic vs. real mode based on presence of a Fitbit token.
# Note: real Fitbit API path untested without valid token
try:
    FITBIT_TOKEN = os.getenv("FITBIT_ACCESS_TOKEN", "")
    SYNTHETIC = FITBIT_TOKEN == ""  # no token → synthetic
    print(f"[INIT] FITBIT_TOKEN present: {bool(FITBIT_TOKEN)}")
    print(f"[INIT] SYNTHETIC mode: {SYNTHETIC}")
except Exception as e:
    print(f"[INIT] ERROR setting FITBIT_TOKEN/SYNTHETIC: {e}")
    SYNTHETIC = True

try:
    LAST_RUN_FILE = "/app/last_run.txt"
    print(f"[INIT] LAST_RUN_FILE: {LAST_RUN_FILE}")
except Exception as e:
    print(f"[INIT] ERROR setting LAST_RUN_FILE: {e}")
    LAST_RUN_FILE = "/tmp/last_run.txt"

# These are the Fitbit intraday metrics we ingest
try:
    METRICS = [
        "intraday_heart_rate",
        "intraday_breath_rate",
        "intraday_active_zone_minute",
        "intraday_activity",
        "intraday_hrv",
        "intraday_spo2",
    ]
    print(f"[INIT] METRICS: {METRICS}")
except Exception as e:
    print(f"[INIT] ERROR setting METRICS: {e}")
    raise

def log(msg: str):
    try:
        print(f"[LOG] {msg}")
    except Exception as e:
        print(f"[LOG ERROR] {e}")

#Get current time in Los Angeles timezone.
def get_current_la_time() -> datetime.datetime:
    try:
        result = datetime.datetime.now(LA_TIMEZONE)
        log(f"get_current_la_time() -> {result}")
        return result
    except Exception as e:
        log(f"ERROR in get_current_la_time(): {e}")
        traceback.print_exc()
        raise
# This function limit that we can only take data until the current time
def get_max_end_time() -> datetime.datetime:
    """Get maximum allowed end time (current LA time)."""
    try:
        current_la = get_current_la_time()
        result = current_la  
        log(f"get_max_end_time() -> {result}")
        return result
    except Exception as e:
        log(f"ERROR in get_max_end_time(): {e}")
        traceback.print_exc()
        raise
# Validate date constraints: 1, end must not be after max_end 2, start must be before end 3, range must not exceed 60 days
# Returns an error message or None if valid.
def validate_date_constraints(start_dt: datetime.datetime, end_dt: datetime.datetime) -> str:
    try:
        log(f"validate_date_constraints() called with start={start_dt}, end={end_dt}")
        if start_dt.tzinfo != LA_TIMEZONE:
            start_dt = start_dt.astimezone(LA_TIMEZONE)
            log(f"Converted start_dt to LA timezone: {start_dt}")
        if end_dt.tzinfo != LA_TIMEZONE:
            end_dt = end_dt.astimezone(LA_TIMEZONE)
            log(f"Converted end_dt to LA timezone: {end_dt}")
        max_end = get_max_end_time()
        log(f"Max allowed end time: {max_end}")
        if end_dt > max_end:
            error_msg = f"End date cannot be later than {max_end.strftime('%Y-%m-%d %H:%M:%S %Z')}"
            log(f"VALIDATION ERROR: {error_msg}")
            return error_msg
        if start_dt >= end_dt:
            error_msg = "Start date must be before end date"
            log(f"VALIDATION ERROR: {error_msg}")
            return error_msg
        max_range = timedelta(days=60)
        date_diff = end_dt - start_dt
        log(f"Date range: {date_diff}, max allowed: {max_range}")
        if date_diff > max_range:
            error_msg = "Date range cannot exceed 2 months (60 days)"
            log(f"VALIDATION ERROR: {error_msg}")
            return error_msg
        log("Date validation passed")
        return None
    except Exception as e:
        log(f"ERROR in validate_date_constraints(): {e}")
        traceback.print_exc()
        return f"Validation error: {str(e)}"
# Read and parse the last ingestion timestamp, falling back to 24h ago if file missing.
def get_last_timestamp() -> datetime.datetime:
    try:
        log(f"get_last_timestamp() reading from {LAST_RUN_FILE}")
        try:
            raw = open(LAST_RUN_FILE, 'r').read().strip()
            log(f"Read raw timestamp: {raw}")
            ts_str = raw.split('#', 1)[0].strip()
            log(f"Parsed timestamp string: {ts_str}")
            if ts_str.endswith('Z'):
                ts_str = ts_str[:-1] + '+00:00'
                log(f"Converted Z to +00:00: {ts_str}")
            dt = datetime.datetime.fromisoformat(ts_str)
            log(f"Parsed datetime: {dt}")
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
                log(f"Added UTC timezone: {dt}")
            result = dt.astimezone(LA_TIMEZONE)
            log(f"Converted to LA timezone: {result}")
            return result
        except FileNotFoundError:
            log(f"File {LAST_RUN_FILE} not found, returning 24 hours ago")
            result = get_current_la_time() - datetime.timedelta(hours=24)  # ✅ Changed from hours=2 to hours=24
            log(f"Fallback timestamp: {result}")
            return result
    except Exception as e:
        log(f"ERROR in get_last_timestamp(): {e}")
        traceback.print_exc()
        raise

# Write the provided timestamp back to last_run file.
def update_last_run(ts: datetime.datetime):
    try:
        log(f"update_last_run() called with {ts}")
        if ts.tzinfo != LA_TIMEZONE:
            ts = ts.astimezone(LA_TIMEZONE)
            log(f"Converted to LA timezone: {ts}")
        with open(LAST_RUN_FILE, "w") as f:
            f.write(ts.isoformat())
            log(f"Wrote timestamp to {LAST_RUN_FILE}: {ts.isoformat()}")
    except Exception as e:
        log(f"ERROR in update_last_run(): {e}")
        traceback.print_exc()
        raise

# Generate synthetic hourly data for a metric between start and end.
def synthetic_data(start: datetime.datetime, end: datetime.datetime, metric: str, seed: int = None, user_id: str = None):
    try:
        log(f"synthetic_data() called with start={start}, end={end}, metric={metric}, seed={seed}, user_id={user_id}")
        if seed is None:
            seed = SEED
            log(f"Using default seed: {seed}")
        if user_id is None:
            user_id = USER_ID
            log(f"Using default user_id: {user_id}")
        if start.tzinfo != LA_TIMEZONE:
            start = start.astimezone(LA_TIMEZONE)
            log(f"Converted start to LA timezone: {start}")
        if end.tzinfo != LA_TIMEZONE:
            end = end.astimezone(LA_TIMEZONE)
            log(f"Converted end to LA timezone: {end}")
        rows = []
        current = start.replace(minute=0, second=0, microsecond=0)
        log(f"Starting generation from: {current}")
        count = 0
        while current <= end:
            ts = current.isoformat()
            val = random.uniform(0, 100)
            rows.append((ts, user_id, metric, val))
            current += timedelta(hours=1)
            count += 1
            if count % 24 == 0:
                log(f"Generated {count} points for {metric}, current time: {current}")
        log(f"Generated {len(rows)} synthetic data points for {metric}")
        return rows
    except Exception as e:
        log(f"ERROR in synthetic_data(): {e}")
        traceback.print_exc()
        raise

# Fetch data: synthetic or real Fitbit API.
def fetch_fitbit_data(start_time: datetime.datetime, end_time: datetime.datetime):
    try:
        log(f"fetch_fitbit_data() called with start={start_time}, end={end_time}")
        log(f"SYNTHETIC mode: {SYNTHETIC}")
        rows = []
        if SYNTHETIC:
            log(f"[DRYRUN] Generating synthetic data for {len(METRICS)} metrics")
            log(f"[DRYRUN] Time range: {start_time.isoformat()} → {end_time.isoformat()}")
            for i, metric in enumerate(METRICS):
                try:
                    log(f"[DRYRUN] Processing metric {i+1}/{len(METRICS)}: {metric}")
                    random.seed(SEED + i)
                    part = synthetic_data(start_time, end_time, metric, SEED + i)
                    log(f"[DRYRUN] Generated {len(part)} points for {metric}")
                    rows.extend(part)
                    log(f"[DRYRUN] Total rows so far: {len(rows)}")
                except Exception as e:
                    log(f"[DRYRUN] ERROR generating data for {metric}: {e}")
                    traceback.print_exc()
            log(f"[DRYRUN] Total synthetic data generated: {len(rows)} rows")
            return rows
        else:
            log("[REAL] Using real Fitbit API")
            try:
                device = wearipedia.get_device("fitbit/fitbit_charge_6")
                device.authenticate(FITBIT_TOKEN)
                log("[REAL] Authenticated with Fitbit")
                date_params = {"seed": SEED, "start_date": start_time.date().isoformat(), "end_date": end_time.date().isoformat()}
                log(f"[REAL] Date params: {date_params}")
                for metric in METRICS:
                    try:
                        log(f"[FETCH] {metric}: {date_params['start_date']} → {date_params['end_date']}")
                        raw = device.get_data(metric, date_params)
                        log(f"[FETCH] Got {len(raw)} day-entries for {metric}")
                        for entry in raw:
                            day_meta = entry.get("heart_rate_day", [{}])[0]
                            ah = day_meta.get("activities-heart", [])
                            if ah and "dateTime" in ah[0]: day_str = ah[0]["dateTime"]
                            else: day_str = day_meta.get("dateTime")
                            intraday = entry.get("activities-heart-intraday", {}).get("dataset", [])
                            for pt in intraday:
                                ts = f"{day_str}T{pt['time']}"
                                rows.append((ts, USER_ID, metric, pt['value']))
                        log(f"[FETCH] Processed {metric}, total rows: {len(rows)}")
                    except Exception as e:
                        log(f"[FETCH] ERROR processing {metric}: {e}")
                        traceback.print_exc()
            except Exception as e:
                log(f"[REAL] ERROR with Fitbit API: {e}")
                traceback.print_exc()
                raise
        log(f"fetch_fitbit_data() returning {len(rows)} rows")
        return rows
    except Exception as e:
        log(f"ERROR in fetch_fitbit_data(): {e}")
        traceback.print_exc()
        raise

# Save records to database with deduplication.
def save_data(records):
    try:
        log(f"save_data() called with {len(records) if records else 0} records")
        if not records:
            log("[save_data] No records to save")
            return 0
        log("[save_data] Connecting to database...")
        log(f"[save_data] DB params: {dict((k, v if k != 'password' else '***') for k, v in DB_PARAMS.items())}")
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        sql = (
            "INSERT INTO raw_data (timestamp, user_id, metric_type, value) "
            "VALUES %s "
            "ON CONFLICT (timestamp, user_id, metric_type) DO NOTHING;"
        )
        execute_values(cur, sql, records, page_size=1000)
        conn.commit()
        inserted_count = cur.rowcount
        cur.close(); conn.close()
        log(f"[save_data] Inserted {inserted_count} rows")
        return inserted_count
    except Exception as e:
        log(f"ERROR in save_data(): {e}")
        traceback.print_exc()
        raise

def create_daily_aggregates():
    """Create daily aggregates from raw hourly data"""
    try:
        log("create_daily_aggregates() called")
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        # Create daily aggregates from all raw data
        sql = """
        INSERT INTO data_1d (date_day, user_id, metric_type, avg_value, min_value, max_value, count_points)
        SELECT 
            DATE(timestamp) as date_day,
            user_id,
            metric_type,
            AVG(value) as avg_value,
            MIN(value) as min_value,
            MAX(value) as max_value,
            COUNT(*) as count_points
        FROM raw_data 
        GROUP BY DATE(timestamp), user_id, metric_type
        ON CONFLICT (date_day, user_id, metric_type) DO UPDATE SET
            avg_value = EXCLUDED.avg_value,
            min_value = EXCLUDED.min_value,
            max_value = EXCLUDED.max_value,
            count_points = EXCLUDED.count_points
        """
        
        cur.execute(sql)
        conn.commit()
        affected = cur.rowcount
        
        cur.close()
        conn.close()
        
        log(f"Created/updated {affected} daily aggregate records")
        return affected
        
    except Exception as e:
        log(f"ERROR in create_daily_aggregates(): {e}")
        traceback.print_exc()
        raise

# Generate synthetic data for API use.
def generate_synthetic_data_for_api(start_time: datetime.datetime, end_time: datetime.datetime, user_id: str = None):
    try:
        log(f"generate_synthetic_data_for_api() called with start={start_time}, end={end_time}, user_id={user_id}")
        if user_id is None: user_id = USER_ID
        error_msg = validate_date_constraints(start_time, end_time)
        if error_msg: raise ValueError(error_msg)
        rows = []
        for i, metric in enumerate(METRICS):
            random.seed(SEED + i)
            rows.extend(synthetic_data(start_time, end_time, metric, SEED + i, user_id))
        log(f"[API] Generated {len(rows)} total records")
        return rows
    except Exception as e:
        log(f"ERROR in generate_synthetic_data_for_api(): {e}")
        traceback.print_exc()
        raise

# Ingest data for a specific time range (used by API).
def ingest_for_range(start_dt: datetime.datetime, end_dt: datetime.datetime, user_id: str = None):
    """Ingest data for a specific time range (used by API)."""
    if user_id is None: user_id = USER_ID
    error_msg = validate_date_constraints(start_dt, end_dt)
    if error_msg: raise ValueError(error_msg)
    log(f"[RANGE_INGEST] Starting ingestion for range: {start_dt.isoformat()} → {end_dt.isoformat()}")
    data = fetch_fitbit_data(start_dt, end_dt)
    log(f"[RANGE_INGEST] Fetched {len(data)} data points")
    saved_count = save_data(data)
    log(f"[RANGE_INGEST] Saved {saved_count} new records")
    
    # Add auto-aggregation
    if saved_count > 0:
        log("[RANGE_INGEST] Generating daily aggregates")
        agg_count = create_daily_aggregates()
        log(f"[RANGE_INGEST] Updated {agg_count} daily aggregates")
    
    update_last_run(end_dt)
    log(f"[RANGE_INGEST] Updated last_run to {end_dt.isoformat()}")
    return {"total_points": len(data), "saved_points": saved_count, "start_time": start_dt.isoformat(), "end_time": end_dt.isoformat()}

#Main ingestion process - runs from last_run to now.
def main():
    try:
        log("main() called")
        now = get_current_la_time()
        last_run = get_last_timestamp()
        log(f"[MAIN_INGEST] Running automatic ingestion: {last_run.isoformat()} → {now.isoformat()}")
        data = fetch_fitbit_data(last_run, now)
        log(f"[MAIN_INGEST] Fetched {len(data)} data points")
        saved_count = save_data(data)
        log(f"[MAIN_INGEST] Saved {saved_count} new records")
        
        # Add auto-aggregation here
        if saved_count > 0:
            log("[MAIN_INGEST] Generating daily aggregates")
            agg_count = create_daily_aggregates()
            log(f"[MAIN_INGEST] Updated {agg_count} daily aggregates")
            
        update_last_run(now)
        log(f"[MAIN_INGEST] Updated last_run to {now.isoformat()}")
    except Exception as e:
        log(f"ERROR in main(): {e}")
        traceback.print_exc()
        raise

if __name__ == "__main__":
    import sys
    try:
        log("Script started")
        if len(sys.argv) > 1 and sys.argv[1] == "--range":
            log("Range mode selected")
            if len(sys.argv) != 4:
                print("Usage: python ingest.py --range START_ISO END_ISO")
                sys.exit(1)
            start_str, end_str = sys.argv[2], sys.argv[3]
            start_dt = datetime.datetime.fromisoformat(start_str)
            end_dt = datetime.datetime.fromisoformat(end_str)
            if start_dt.tzinfo is None: start_dt = start_dt.replace(tzinfo=LA_TIMEZONE)
            if end_dt.tzinfo is None: end_dt = end_dt.replace(tzinfo=LA_TIMEZONE)
            result = ingest_for_range(start_dt, end_dt)
            print(f"Range ingestion complete: {result}")
        else:
            log("Normal mode selected")
            main()
    except Exception as e:
        log(f"ERROR in __main__: {e}")
        traceback.print_exc()
        sys.exit(1)
