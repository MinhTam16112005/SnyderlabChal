import os
import sys
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
import pytz
import statistics

# Load environment variables
load_dotenv()

# Core Fitbit intraday data types we collect
METRICS = [
    "intraday_heart_rate",
    "intraday_breath_rate", 
    "intraday_active_zone_minutes",
    "intraday_activity",
    "intraday_hrv",
    "intraday_spo2",
]

# Application settings
DEFAULT_USER_ID = "user_1"
MAX_DATE_RANGE_DAYS = 60
DEFAULT_PAGE_SIZE = 1000
SYNTHETIC_DATA_SEED = 42

# Add ingestion module to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

class UserEnrollment(BaseModel):
    user_id: str
    enrollment_date: datetime

class UserEnrollmentResponse(BaseModel):
    user_id: str
    enrollment_date: datetime
    total_records: int = 0
    metrics_count: int = 0
    days_with_data: int = 0

# Database configuration and connection management
class DatabaseConfig:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.port = int(os.getenv("DB_PORT", "5432"))
        self.name = os.getenv("DB_NAME")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
    
    def get_connection(self):
        return psycopg2.connect(
            host=self.host,
            port=self.port,
            user=self.user,
            password=self.password,
            dbname=self.name
        )

# Capture print statements for API clients
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

# Gap Detection Service - Identifies missing data periods
class GapDetectionService:
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
        self.expected_interval_hours = 1
    
    def detect_gaps(self, data_points: List[Dict], user_id: str, metric: str) -> List[Dict]:
        # Detect gaps in time series data and categorize them
        try:
            if len(data_points) < 2:
                return []
            
            gaps = []
            
            for i in range(len(data_points) - 1):
                try:
                    current_time = datetime.fromisoformat(data_points[i]['timestamp'].replace('Z', '+00:00'))
                    next_time = datetime.fromisoformat(data_points[i + 1]['timestamp'].replace('Z', '+00:00'))
                    
                    time_diff = next_time - current_time
                    expected_diff = timedelta(hours=self.expected_interval_hours)
                    
                    # If gap is larger than expected interval, record it
                    if time_diff > expected_diff * 1.5:  # Allow 50% tolerance
                        gap_hours = time_diff.total_seconds() / 3600
                        gap_type = self._categorize_gap(gap_hours)
                        
                        gap = {
                            'gap_start': current_time,
                            'gap_end': next_time,
                            'gap_duration_hours': int(gap_hours),
                            'gap_type': gap_type,
                            'before_point': data_points[i],
                            'after_point': data_points[i + 1]
                        }
                        gaps.append(gap)
                except Exception as e:
                    continue
            
            return gaps
            
        except Exception as e:
            return []
    
    def _categorize_gap(self, hours: float) -> str:
        # Categorize gaps into tiers based on duration
        if hours <= 2:
            return 'short'
        elif hours <= 10:
            return 'medium'
        else:
            return 'long'

# Imputation Service - Fills gaps and saves to database
class ImputationService:
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
    
    def apply_imputation(self, data_points: List[Dict], gaps: List[Dict], user_id: str, metric: str) -> List[Dict]:
        # Apply tiered imputation strategy with pattern-based enhancement
        try:
            if not gaps:
                return data_points
            
            all_points = data_points.copy()
            all_imputed_points = []
            
            for gap in gaps:
                try:
                    if gap['gap_type'] == 'short':
                        imputed_points = self._impute_tier1_linear(gap)
                    elif gap['gap_type'] == 'medium':
                        imputed_points = self._impute_tier2_pattern_based(gap)
                    else:  # long gaps
                        imputed_points = []
                    
                    all_points.extend(imputed_points)
                    all_imputed_points.extend(imputed_points)
                    
                except Exception as e:
                    continue
            
            # Save imputed points to database
            if all_imputed_points:
                self._save_imputed_points_to_database(all_imputed_points)
            
            # Sort by timestamp
            all_points.sort(key=lambda x: x['timestamp'])
            return all_points
            
        except Exception as e:
            return data_points
    
    def _impute_tier1_linear(self, gap: Dict) -> List[Dict]:
        # Linear interpolation for gaps
        try:
            before_point = gap['before_point']
            after_point = gap['after_point']
            
            before_time = datetime.fromisoformat(before_point['timestamp'].replace('Z', '+00:00'))
            after_time = datetime.fromisoformat(after_point['timestamp'].replace('Z', '+00:00'))
            before_value = before_point['value']
            after_value = after_point['value']
            
            imputed_points = []
            current_time = before_time + timedelta(hours=1)
            
            while current_time < after_time:
                # Linear interpolation
                time_ratio = (current_time - before_time).total_seconds() / (after_time - before_time).total_seconds()
                interpolated_value = before_value + (after_value - before_value) * time_ratio
                
                imputed_point = {
                    'timestamp': current_time.isoformat(),
                    'user_id': before_point['user_id'],
                    'metric_type': before_point['metric_type'],
                    'value': round(interpolated_value, 2),
                    'is_imputed': True,
                    'imputation_method': 'linear',
                    'gap_duration_hours': gap['gap_duration_hours']
                }
                
                imputed_points.append(imputed_point)
                current_time += timedelta(hours=1)
            
            return imputed_points
            
        except Exception as e:
            return []
    
    def _impute_tier2_pattern_based(self, gap: Dict) -> List[Dict]:
        # Pattern-based imputation using historical data from same times
        try:
            before_point = gap['before_point']
            after_point = gap['after_point']
            
            before_time = datetime.fromisoformat(before_point['timestamp'].replace('Z', '+00:00'))
            after_time = datetime.fromisoformat(after_point['timestamp'].replace('Z', '+00:00'))
            
            # Get historical data from same times
            historical_patterns = self._get_historical_patterns(
                before_point['user_id'], 
                before_point['metric_type'], 
                before_time, 
                after_time
            )
            
            imputed_points = []
            current_time = before_time + timedelta(hours=1)
            
            while current_time < after_time:
                # Try pattern-based prediction first
                predicted_value = self._predict_from_patterns(current_time, historical_patterns)
                
                if predicted_value is not None:
                    imputation_method = 'pattern_based'
                else:
                    # Fallback to linear interpolation
                    time_ratio = (current_time - before_time).total_seconds() / (after_time - before_time).total_seconds()
                    predicted_value = before_point['value'] + (after_point['value'] - before_point['value']) * time_ratio
                    imputation_method = 'linear_fallback'
                
                imputed_point = {
                    'timestamp': current_time.isoformat(),
                    'user_id': before_point['user_id'],
                    'metric_type': before_point['metric_type'],
                    'value': round(predicted_value, 2),
                    'is_imputed': True,
                    'imputation_method': imputation_method,
                    'gap_duration_hours': gap['gap_duration_hours']
                }
                
                imputed_points.append(imputed_point)
                current_time += timedelta(hours=1)
            
            return imputed_points
            
        except Exception as e:
            # Fallback to linear interpolation
            return self._impute_tier1_linear(gap)

    def _get_historical_patterns(self, user_id: str, metric_type: str, start_time: datetime, end_time: datetime) -> Dict:
        # Get historical data from same time periods
        try:
            conn = self.db_config.get_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            patterns = {}
            lookback_days = [1, 2, 7, 14]
            
            for days_back in lookback_days:
                historical_start = start_time - timedelta(days=days_back)
                historical_end = end_time - timedelta(days=days_back)
                
                cur.execute("""
                    SELECT timestamp, value 
                    FROM raw_data 
                    WHERE user_id = %s AND metric_type = %s 
                    AND timestamp BETWEEN %s AND %s
                    AND COALESCE(is_imputed, FALSE) = FALSE
                    ORDER BY timestamp
                """, (user_id, metric_type, historical_start, historical_end))
                
                historical_data = cur.fetchall()
                
                if historical_data:
                    patterns[f'{days_back}d_ago'] = [
                        {
                            'timestamp': row['timestamp'],
                            'value': float(row['value']),
                            'hour': row['timestamp'].hour
                        } for row in historical_data
                    ]
            
            cur.close()
            conn.close()
            
            return patterns
            
        except Exception as e:
            return {}

    def _predict_from_patterns(self, target_time: datetime, patterns: Dict) -> Optional[float]:
        # Predict value based on historical patterns
        try:
            target_hour = target_time.hour
            predictions = []
            weights = []
            
            # Weight different historical periods
            pattern_weights = {
                '1d_ago': 0.4,    # Yesterday gets highest weight
                '2d_ago': 0.25,   # Day before yesterday
                '7d_ago': 0.25,   # Same day last week
                '14d_ago': 0.1    # Same day 2 weeks ago
            }
            
            for pattern_key, pattern_data in patterns.items():
                if pattern_key not in pattern_weights:
                    continue
                    
                # Find data points close to target hour
                hour_matches = [
                    point for point in pattern_data 
                    if abs(point['hour'] - target_hour) <= 1
                ]
                
                if hour_matches:
                    # Use average of close matches
                    avg_value = sum(point['value'] for point in hour_matches) / len(hour_matches)
                    predictions.append(avg_value)
                    weights.append(pattern_weights[pattern_key])
            
            if predictions:
                # Weighted average of predictions
                weighted_prediction = sum(p * w for p, w in zip(predictions, weights)) / sum(weights)
                return weighted_prediction
            
            return None
            
        except Exception as e:
            return None
    
    def _save_imputed_points_to_database(self, imputed_points: List[Dict]):
        # Save imputed points to database
        try:
            conn = self.db_config.get_connection()
            cur = conn.cursor()
            
            records = []
            for point in imputed_points:
                records.append((
                    point['timestamp'],
                    point['user_id'], 
                    point['metric_type'],
                    point['value'],
                    point['is_imputed'],
                    point['imputation_method'],
                    point['gap_duration_hours']
                ))
            
            sql = """
                INSERT INTO raw_data (timestamp, user_id, metric_type, value, is_imputed, imputation_method, gap_duration_hours) 
                VALUES %s 
                ON CONFLICT (timestamp, user_id, metric_type) DO UPDATE SET
                    is_imputed = EXCLUDED.is_imputed,
                    imputation_method = EXCLUDED.imputation_method,
                    gap_duration_hours = EXCLUDED.gap_duration_hours;
            """
            
            execute_values(cur, sql, records, template=None, page_size=1000)
            conn.commit()
            
            cur.close()
            conn.close()
            
        except Exception as e:
            if 'conn' in locals():
                conn.rollback()

# Date validation according to business rules
class DateValidator:
    @staticmethod
    def validate_date_constraints(start_dt: datetime, end_dt: datetime) -> Optional[str]:
        la_timezone = pytz.timezone('America/Los_Angeles')
        
        if start_dt.tzinfo != la_timezone:
            start_dt = start_dt.astimezone(la_timezone)
        if end_dt.tzinfo != la_timezone:
            end_dt = end_dt.astimezone(la_timezone)
        
        current_la = datetime.now(la_timezone)
        
        if end_dt > current_la:
            return f"End date cannot be later than {current_la.strftime('%Y-%m-%d %H:%M:%S %Z')}"
        
        if start_dt >= end_dt:
            return "Start date must be before end date"
        
        max_range = timedelta(days=MAX_DATE_RANGE_DAYS)
        if end_dt - start_dt > max_range:
            return f"Date range cannot exceed {MAX_DATE_RANGE_DAYS} days"
        
        return None

# Synthetic data generation with intentional gaps for testing
class SyntheticDataGenerator:
    def __init__(self, db_config: DatabaseConfig):
        self.db_config = db_config
    
    def generate_for_range(self, start_dt: datetime, end_dt: datetime, user_id: str = DEFAULT_USER_ID) -> Dict[str, Any]:
        import random
        
        records = []
        
        for i, metric in enumerate(METRICS):
            random.seed(SYNTHETIC_DATA_SEED + i)
            current = start_dt.replace(minute=0, second=0, microsecond=0)
            
            while current <= end_dt:
                # Create intentional gaps for testing imputation
                if random.random() < 0.2:  # 20% chance to create a gap
                    gap_type_roll = random.random()
                    if gap_type_roll < 0.6:  # 60% short gaps (2-3 hours)
                        gap_hours = random.randint(2, 3)
                    elif gap_type_roll < 0.9:  # 30% medium gaps (4-8 hours)  
                        gap_hours = random.randint(4, 8)
                    else:  # 10% long gaps (12-24 hours)
                        gap_hours = random.randint(12, 24)
                    
                    current += timedelta(hours=gap_hours)
                    continue
                
                # Generate normal data point
                ts = current.isoformat()
                val = random.uniform(0, 100)
                records.append((ts, user_id, metric, val))
                current += timedelta(hours=1)
        
        # Save to database
        saved_count = self._save_to_database(records)
        
        return {
            "total_points": len(records),
            "saved_points": saved_count,
            "start_time": start_dt.isoformat(),
            "end_time": end_dt.isoformat()
        }
    
    def _save_to_database(self, records: List[tuple]) -> int:
        try:
            conn = self.db_config.get_connection()
            cur = conn.cursor()
            
            # Check if imputation columns exist
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'raw_data' AND column_name = 'is_imputed'
            """)
            has_imputation_columns = cur.fetchone() is not None
            
            if has_imputation_columns:
                sql = """
                    INSERT INTO raw_data (timestamp, user_id, metric_type, value, is_imputed, imputation_method, gap_duration_hours) 
                    VALUES %s 
                    ON CONFLICT (timestamp, user_id, metric_type) DO NOTHING;
                """
                
                # Convert tuples to include imputation defaults
                enhanced_records = []
                for record in records:
                    enhanced_records.append(record + (False, None, None))
                
                execute_values(cur, sql, enhanced_records, template=None, page_size=1000)
            else:
                sql = """
                    INSERT INTO raw_data (timestamp, user_id, metric_type, value) 
                    VALUES %s 
                    ON CONFLICT (timestamp, user_id, metric_type) DO NOTHING;
                """
                
                execute_values(cur, sql, records, template=None, page_size=1000)
            
            conn.commit()
            saved_count = cur.rowcount
            
            cur.close()
            conn.close()
            
            return saved_count
            
        except Exception as e:
            raise

# Initialize core application components
db_config = DatabaseConfig()
data_generator = SyntheticDataGenerator(db_config)
gap_detector = GapDetectionService(db_config)
imputation_service = ImputationService(db_config)

# Import ingestion module if available
try:
    from ingestion.ingest import ingest_for_range, validate_date_constraints, LA_TIMEZONE
    IMPORT_SUCCESS = True
except ImportError as e:
    LA_TIMEZONE = pytz.timezone('America/Los_Angeles')
    IMPORT_SUCCESS = False
    
    # Use fallback implementations
    validate_date_constraints = DateValidator.validate_date_constraints
    ingest_for_range = data_generator.generate_for_range

# FastAPI app setup
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class GenerateDataRequest(BaseModel):
    start_date: str
    end_date: str
    user_id: str = DEFAULT_USER_ID

# Health check endpoint
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
            "current_time": datetime.now(LA_TIMEZONE).isoformat()
        }
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})

# Get available metrics
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
        return METRICS

@app.get("/users")
def get_users():
    # Get all users who have data in the system with statistics
    try:
        conn = db_config.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
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
        return {"users": [{"user_id": DEFAULT_USER_ID, "total_records": 0}]}

# Main data endpoint with gap detection and imputation
@app.get("/data")
def get_data(
    start_date: str = None,
    end_date: str = None,
    user_id: str = None,
    metric: str = None,
    page: int = 1,
    per_page: int = DEFAULT_PAGE_SIZE,
    # NOTE: Parameter names are historical - actual behavior documented below
    include_imputed: bool = True,    # BEHAVIOR: When True, includes existing imputed data points in results
    apply_imputation: bool = False   # BEHAVIOR: When True, detects gaps and generates new imputed points
):
    # Get health data with optional gap detection and imputation.
    # 
    # BEHAVIOR EXPLANATION:
    # - include_imputed=True: Show existing imputed data points (fills gaps with stored estimates)
    # - include_imputed=False: Show only real measurements (creates visual gaps in chart)
    # - apply_imputation=True: Generate new imputed points for detected gaps (active imputation)
    # - apply_imputation=False: No new imputation (passive display)
    try:
        # Validate required parameters
        if not all([start_date, end_date, user_id, metric]):
            raise HTTPException(status_code=400, detail="start_date, end_date, user_id, and metric are required")

        if metric not in METRICS:
            raise HTTPException(status_code=400, detail=f"Unknown metric '{metric}'")

        # Parse and validate dates
        try:
            start_ts = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_ts = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="start_date and end_date must be ISO 8601 format")
        
        if end_ts <= start_ts:
            raise HTTPException(status_code=400, detail="end_date must be after start_date")

        # Query database
        offset = (page - 1) * per_page
        date_range_days = (end_ts - start_ts).days

        conn = db_config.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if imputation columns exist
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'raw_data' AND column_name = 'is_imputed'
        """)
        has_imputation_columns = cur.fetchone() is not None
        
        if has_imputation_columns:
            # Full query with imputation columns
            query = """
                SELECT timestamp, user_id, metric_type, value,
                       COALESCE(is_imputed, FALSE) as is_imputed,
                       imputation_method, gap_duration_hours
                FROM raw_data 
                WHERE user_id = %s AND metric_type = %s 
                AND timestamp BETWEEN %s AND %s
            """
            count_query = """
                SELECT COUNT(*) as count FROM raw_data 
                WHERE user_id = %s AND metric_type = %s 
                AND timestamp BETWEEN %s AND %s
            """
            
            # BEHAVIOR: Exclude imputed points to show only real measurements (creates visual gaps)
            if not include_imputed:
                query += " AND COALESCE(is_imputed, FALSE) = FALSE"
                count_query += " AND COALESCE(is_imputed, FALSE) = FALSE"
        else:
            # Fallback query without imputation columns
            query = """
                SELECT timestamp, user_id, metric_type, value,
                       FALSE as is_imputed,
                       NULL as imputation_method, 
                       NULL as gap_duration_hours
                FROM raw_data 
                WHERE user_id = %s AND metric_type = %s 
                AND timestamp BETWEEN %s AND %s
            """
            count_query = """
                SELECT COUNT(*) as count FROM raw_data 
                WHERE user_id = %s AND metric_type = %s 
                AND timestamp BETWEEN %s AND %s
            """
        
        query += " ORDER BY timestamp LIMIT %s OFFSET %s"
        
        # Execute main query
        cur.execute(query, (user_id, metric, start_ts, end_ts, per_page, offset))
        rows = cur.fetchall()
        
        # Get total count
        cur.execute(count_query, (user_id, metric, start_ts, end_ts))
        total_count = cur.fetchone()['count']
        
        cur.close()
        conn.close()

        # Format results
        data = []
        for row in rows:
            data_point = {
                "timestamp": row["timestamp"].isoformat() if hasattr(row["timestamp"], 'isoformat') else str(row["timestamp"]),
                "user_id": row["user_id"],
                "metric_type": row["metric_type"],
                "value": float(row["value"]),
                "is_imputed": bool(row.get("is_imputed", False)),
                "imputation_method": row.get("imputation_method"),
                "gap_duration_hours": row.get("gap_duration_hours")
            }
            data.append(data_point)
        
        # Initialize summary
        gaps_detected = []
        data_summary = {
            "total_points": len(data),
            "real_points": len([d for d in data if not d.get("is_imputed", False)]),
            "imputed_points": len([d for d in data if d.get("is_imputed", False)]),
            "imputation_percentage": 0
        }
        
        # BEHAVIOR: Apply gap detection and generate new imputed points
        if apply_imputation and len(data) > 1 and has_imputation_columns:
            try:
                # Only consider real data points for gap detection
                real_data_points = [d for d in data if not d.get("is_imputed", False)]
                gaps_detected = gap_detector.detect_gaps(real_data_points, user_id, metric)
                
                if gaps_detected:
                    # Apply imputation to real data points only
                    imputed_data = imputation_service.apply_imputation(real_data_points, gaps_detected, user_id, metric)
                    
                    # Use the imputed data (includes both real and newly created imputed points)
                    data = imputed_data
                    
                    # Update summary
                    data_summary["total_points"] = len(data)
                    data_summary["imputed_points"] = len([d for d in data if d.get("is_imputed", False)])
                    data_summary["real_points"] = data_summary["total_points"] - data_summary["imputed_points"]
            except Exception as e:
                # Continue without imputation
                pass
        
        if data_summary["total_points"] > 0:
            data_summary["imputation_percentage"] = round(
                (data_summary["imputed_points"] / data_summary["total_points"]) * 100, 1
            )
        
        return {
            "data": data,
            "page": page,
            "per_page": per_page,
            "total": total_count,
            "returned": len(data),
            "data_source": "raw_hourly",
            "date_range_days": date_range_days,
            "has_imputation_support": has_imputation_columns,
            "gaps_detected": [
                {
                    "gap_start": gap["gap_start"].isoformat(),
                    "gap_end": gap["gap_end"].isoformat(), 
                    "gap_duration_hours": gap["gap_duration_hours"],
                    "gap_type": gap["gap_type"]
                } for gap in gaps_detected
            ],
            "data_summary": data_summary,
            "imputation_applied": apply_imputation and has_imputation_columns and len(gaps_detected) > 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Generate synthetic test data
@app.post("/generate-data")
async def generate_data(request: GenerateDataRequest):
    log_capture = LogCapture()
    
    try:
        log_capture.write(f"Received request for user {request.user_id}")
        log_capture.write(f"Import success: {IMPORT_SUCCESS}")
        
        # Parse dates
        start_dt = datetime.fromisoformat(request.start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(request.end_date.replace('Z', '+00:00'))
        
        # Convert to timezone-aware if needed
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
        
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

# Enroll user endpoint
@app.post("/enroll-user")
async def enroll_user(enrollment: UserEnrollment):
    # Enroll a new user with their enrollment date
    try:
        conn = db_config.get_connection()
        cur = conn.cursor()
        
        # Check if user already exists
        cur.execute("SELECT user_id FROM users WHERE user_id = %s", (enrollment.user_id,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"User {enrollment.user_id} is already enrolled")
        
        # Handle datetime properly - store as UTC in database
        enrollment_dt = enrollment.enrollment_date
        
        # If timezone-naive, treat as UTC
        if enrollment_dt.tzinfo is None:
            enrollment_dt = enrollment_dt.replace(tzinfo=timezone.utc)
        
        # Convert to UTC for storage
        enrollment_dt_utc = enrollment_dt.astimezone(timezone.utc)
        
        # Insert new user with UTC timestamp
        cur.execute(
            "INSERT INTO users (user_id, enrollment_date, created_at) VALUES (%s, %s, %s)",
            (enrollment.user_id, enrollment_dt_utc, datetime.now(timezone.utc))
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": f"User {enrollment.user_id} enrolled successfully",
            "user_id": enrollment.user_id,
            "enrollment_date": enrollment_dt_utc.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Get enrolled users
@app.get("/enrolled-users")
async def get_enrolled_users():
    # Get list of all enrolled users with their stats
    try:
        conn = db_config.get_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
        SELECT 
            u.user_id,
            u.enrollment_date,
            COALESCE(COUNT(r.timestamp), 0) as total_records,
            COALESCE(COUNT(DISTINCT r.metric_type), 0) as metrics_count,
            COALESCE(COUNT(DISTINCT DATE(r.timestamp)), 0) as days_with_data
        FROM users u
        LEFT JOIN raw_data r ON u.user_id = r.user_id
        GROUP BY u.user_id, u.enrollment_date
        ORDER BY u.enrollment_date DESC
        """)
        
        enrolled_users = []
        for row in cur.fetchall():
            # Ensure enrollment_date is timezone-aware and return as ISO string
            enrollment_date = row["enrollment_date"]
            if enrollment_date.tzinfo is None:
                enrollment_date = enrollment_date.replace(tzinfo=timezone.utc)
            
            enrolled_users.append({
                "user_id": row["user_id"],
                "enrollment_date": enrollment_date.isoformat(),
                "total_records": row["total_records"],
                "metrics_count": row["metrics_count"],
                "days_with_data": row["days_with_data"]
            })
        
        cur.close()
        conn.close()
        
        return {"users": enrolled_users}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
async def delete_user(user_id: str):
    # Delete a user and all their data
    try:
        conn = db_config.get_connection()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        # Delete user's data first
        cur.execute("DELETE FROM raw_data WHERE user_id = %s", (user_id,))
        deleted_records = cur.rowcount
        
        # Delete user
        cur.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "message": f"User {user_id} deleted successfully",
            "deleted_records": deleted_records
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run development server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)