import os
import sys
import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import pytz

# Load environment variables
# This must be done early before any other configuration
load_dotenv()

# These metrics represent the core Fitbit intraday data types we collect
METRICS = [
    "intraday_heart_rate",
    "intraday_breath_rate", 
    "intraday_active_zone_minute",
    "intraday_activity",
    "intraday_hrv",
    "intraday_spo2",
]

# Default application settings
DEFAULT_USER_ID = "user_1"
MAX_DATE_RANGE_DAYS = 60
DEFAULT_PAGE_SIZE = 1000
SYNTHETIC_DATA_SEED = 42

# Add ingestion module to Python path for importing
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Database configuration and connection management class
class DatabaseConfig:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.port = int(os.getenv("DB_PORT", "5432"))
        self.name = os.getenv("DB_NAME")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
    
    # Get database connection
    def get_connection(self):
        return psycopg2.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            dbname=self.name
        )

# This allows us to capture print statements from ingestion functions and return them to API clients
class LogCapture:
    def __init__(self):
        self.logs = []
    
    def write(self, msg: str):
        if msg.strip():
            self.logs.append(msg.strip())
    
    def flush(self):
        pass
    
    def get_logs(self) -> List[str]:
        return self.logs.copy()
    
    def clear(self):
        self.logs.clear()

# This provides comprehensive validation for date ranges according to business rules
class DateValidator:
    # Validate date constraints according to application business rules
    @staticmethod
    def validate_date_constraints(start_dt: datetime.datetime, end_dt: datetime.datetime) -> Optional[str]:
        la_timezone = pytz.timezone('America/Los_Angeles')
        
        if start_dt.tzinfo != la_timezone:
            start_dt = start_dt.astimezone(la_timezone)
        if end_dt.tzinfo != la_timezone:
            end_dt = end_dt.astimezone(la_timezone)
        
        current_la = datetime.datetime.now(la_timezone)
        
        if end_dt > current_la:
            return f"End date cannot be later than {current_la.strftime('%Y-%m-%d %H:%M:%S %Z')}"
        
        if start_dt >= end_dt:
            return "Start date must be before end date"
        
        max_range = datetime.timedelta(days=MAX_DATE_RANGE_DAYS)
        if end_dt - start_dt > max_range:
            return f"Date range cannot exceed {MAX_DATE_RANGE_DAYS} days"
        
        return None

# Synthetic data generation for testing and fallback scenarios
class SyntheticDataGenerator:
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
    
    # Creates consistent, seeded random data that mimics real health metrics. I used SEED +i which apply for eahc loop to ensure every metrics have different value accross all timestamps
    def generate_for_range(self, start_dt: datetime.datetime, end_dt: datetime.datetime, user_id: str = DEFAULT_USER_ID) -> Dict[str, Any]:
        import random
        
        print(f"Generating synthetic data for {start_dt} to {end_dt}")
        
        records = []
        
        for i, metric in enumerate(METRICS):
            print(f"Processing metric {i+1}/{len(METRICS)}: {metric}")
            random.seed(SYNTHETIC_DATA_SEED + i)
            current = start_dt.replace(minute=0, second=0, microsecond=0)
            
            while current <= end_dt:
                ts = current.isoformat()
                val = random.uniform(0, 100)
                records.append((ts, user_id, metric, val))
                current += datetime.timedelta(hours=1)
        
        print(f"Generated {len(records)} total records")
        
        # Save to database
        saved_count = self._save_to_database(records)
        
        return {
            "total_points": len(records),
            "saved_points": saved_count,
            "start_time": start_dt.isoformat(),
            "end_time": end_dt.isoformat()
        }
    
    # Save records to database
    def _save_to_database(self, records: List[tuple]) -> int:
        try:
            conn = self.db_config.get_connection()
            cur = conn.cursor()
            
            sql = (
                "INSERT INTO raw_data (timestamp, user_id, metric_type, value) "
                "VALUES %s "
                "ON CONFLICT (timestamp, user_id, metric_type) DO NOTHING;"
            )
            
            from psycopg2.extras import execute_values
            execute_values(cur, sql, records, template=None, page_size=1000)
            
            conn.commit()
            saved_count = cur.rowcount
            
            cur.close()
            conn.close()
            
            return saved_count
            
        except Exception as e:
            print(f"Database error: {e}")
            raise

# Initialize core application components
db_config = DatabaseConfig()
data_generator = SyntheticDataGenerator(db_config)

# This allows the app to work whether or not the ingestion module is available
try:
    from ingestion.ingest import ingest_for_range, validate_date_constraints, LA_TIMEZONE
    print("Successfully imported from ingestion module")
    IMPORT_SUCCESS = True
except ImportError as e:
    print(f"Warning: Could not import from ingestion module: {e}")
    LA_TIMEZONE = pytz.timezone('America/Los_Angeles')
    IMPORT_SUCCESS = False
    
    # Use fallback implementations
    validate_date_constraints = DateValidator.validate_date_constraints
    ingest_for_range = data_generator.generate_for_range

# FastAPI app setup
app = FastAPI()

# Configure CORS to allow frontend access from any origin
# In production, this should be restricted to specific domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class GenerateDataRequest(BaseModel):
    start_date: str
    end_date: str
    user_id: str = DEFAULT_USER_ID

# Health check endpoint for monitoring and deployment verification
# Tests both application status and database connectivity
@app.get("/healthz")
def healthz():
    try:
        conn = db_config.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        cur.fetchone()
        cur.close()
        conn.close()
        return {
            "status": "ok", 
            "db": "ok",
            "import_success": IMPORT_SUCCESS,
            "current_time": datetime.datetime.now(LA_TIMEZONE).isoformat()
        }
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})

# Get available metrics from database or return default list
@app.get("/metrics")
def get_metrics():
    try:
        conn = db_config.get_connection()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT metric_type FROM raw_data ORDER BY metric_type")
        db_metrics = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        
        return db_metrics if db_metrics else METRICS
    except Exception as e:
        print(f"Error getting metrics from DB: {e}")
        return METRICS

@app.get("/users")
def get_users():
    """Get all users who have data in the system with statistics"""
    try:
        conn = db_config.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get user statistics
        cur.execute("""
        SELECT 
            user_id,
            COUNT(*) as total_records,
            MIN(timestamp) as first_record,
            MAX(timestamp) as last_record,
            COUNT(DISTINCT metric_type) as metrics_count,
            COUNT(DISTINCT DATE(timestamp)) as days_with_data
        FROM raw_data 
        GROUP BY user_id 
        ORDER BY user_id
        """)
        
        users_data = []
        for row in cur.fetchall():
            users_data.append({
                "user_id": row["user_id"],
                "total_records": row["total_records"],
                "first_record": row["first_record"].isoformat() if row["first_record"] else None,
                "last_record": row["last_record"].isoformat() if row["last_record"] else None,
                "metrics_count": row["metrics_count"],
                "days_with_data": row["days_with_data"]
            })
        
        cur.close()
        conn.close()
        
        return {"users": users_data}
        
    except Exception as e:
        print(f"Error getting users from DB: {e}")
        return {"users": [{"user_id": DEFAULT_USER_ID, "total_records": 0}]}

# Main data access endpoint for frontend visualization and analysis
@app.get("/data")
def get_data(
    start_date: str = None,
    end_date: str = None,
    user_id: str = None,
    metric: str = None,
    page: int = 1,
    per_page: int = DEFAULT_PAGE_SIZE
):
    # Validate required parameters
    if not all([start_date, end_date, user_id, metric]):
        raise HTTPException(status_code=400, detail="start_date, end_date, user_id, and metric are required")

    if metric not in METRICS:
        raise HTTPException(status_code=400, detail=f"Unknown metric '{metric}'")

    # Parse and validate dates
    try:
        start_ts = datetime.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_ts = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="start_date and end_date must be ISO 8601 format")
    
    if end_ts <= start_ts:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")

    # Query database with smart routing
    offset = (page - 1) * per_page
    date_range_days = (end_ts - start_ts).days
    hours_difference = (end_ts - start_ts).total_seconds() / 3600

    # Enhanced routing logic with more meaningful thresholds
    if date_range_days >= 30:
        # Monthly+ view: Use daily aggregates (significant memory savings)
        query = (
            "SELECT date_day::timestamp as timestamp, user_id, metric_type, avg_value as value "
            "FROM data_1d "
            "WHERE user_id = %s AND metric_type = %s "
            "AND date_day BETWEEN %s::date AND %s::date "
            "ORDER BY date_day LIMIT %s OFFSET %s"
        )
        print(f"📅 Using daily aggregates for {date_range_days}-day range (month+ view)")
    elif date_range_days > 7:
        # Week+ view: Use daily aggregates but with more detail
        query = (
            "SELECT date_day::timestamp as timestamp, user_id, metric_type, "
            "avg_value as value, min_value, max_value "
            "FROM data_1d "
            "WHERE user_id = %s AND metric_type = %s "
            "AND date_day BETWEEN %s::date AND %s::date "
            "ORDER BY date_day LIMIT %s OFFSET %s"
        )
        print(f"🚀 Using detailed daily aggregates for {date_range_days}-day range (week+ view)")
    else:
        # Detailed view: Raw hourly data for maximum detail
        query = (
            "SELECT timestamp, user_id, metric_type, value FROM raw_data "
            "WHERE user_id = %s AND metric_type = %s "
            "AND timestamp BETWEEN %s AND %s "
            "ORDER BY timestamp LIMIT %s OFFSET %s"
        )
        print(f"📊 Using raw hourly data for {date_range_days}-day range ({hours_difference:.1f} hours)")
 
    try:
        conn = db_config.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(query, (user_id, metric, start_ts, end_ts, per_page, offset))
        rows = cur.fetchall()
        cur.close()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Format database results for API response
    data = []
    for row in rows:
        data.append({
            "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], 'isoformat') else str(row["timestamp"]),
            "user_id": row["user_id"],
            "metric_type": row["metric_type"],
            "value": float(row["value"])
        })
    
    return {
        "data": data,
        "page": page,
        "per_page": per_page,
        "total": len(data)
    }

# Generate synthetic test data for specified date range
@app.post("/generate-data")
async def generate_data(request: GenerateDataRequest):
    log_capture = LogCapture()
    
    try:
        print(f"Received generate-data request: {request}")
        log_capture.write(f"Received request for user {request.user_id}")
        log_capture.write(f"Import success: {IMPORT_SUCCESS}")
        
        # Parse dates
        start_dt = datetime.datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
        end_dt = datetime.datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
        
        # Convert to timezone-aware if needed
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=datetime.timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=datetime.timezone.utc)
        
        start_dt = start_dt.astimezone(LA_TIMEZONE)
        end_dt = end_dt.astimezone(LA_TIMEZONE)
        
        # Validate constraints
        error_msg = validate_date_constraints(start_dt, end_dt)
        if error_msg:
            raise HTTPException(status_code=400, detail=error_msg)
        
        # Generate data
        old_stdout = sys.stdout
        sys.stdout = log_capture
        
        try:
            result = ingest_for_range(start_dt, end_dt, request.user_id)
        finally:
            sys.stdout = old_stdout
        
        return {
            "message": "Data generated successfully",
            "total_points": result["total_points"],
            "saved_points": result["saved_points"],
            "start_date": result["start_time"],
            "end_date": result["end_time"],
            "import_success": IMPORT_SUCCESS,
            "logs": log_capture.get_logs()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail={"error": str(e), "logs": log_capture.get_logs()})
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "error": f"Error generating data: {e}",
            "logs": log_capture.get_logs()
        })

# Runs FastAPI development server when script is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)