# Snyderlab Challenge

## Updates

- **Update 1 (July 6)**  
  Completed task 0.a: Data volume estimation.  
  Please see the detailed answer in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 0.a)

- **Update 2 (July 8)**  
  Completed task 1: Ingestion / Write Flow
  In this first tasks, I've built a daily, delta-load data pipeline that pulls intraday Fitbit (synthetic or real) data into a local TimescaleDB time-series database using Docker Compose and a cron-scheduled Python ingester.  
  Also, I have examine Timescaledb along with InfluxDB and Prometheus throughout the whole challenge to see what fit the best for the challenge scope.  
  Please see the detailed answer for **task 1 part ii** part in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 1)

- **Update 3 (July 9)**  
  Completed task 2: Access / Read Flow
  Built a comprehensive FastAPI backend with React frontend for health data visualization. Features include random synthetic data generation, data retrieval with pagination, real-time visualization, and clean architecture following best practices.

# Task 1: Ingesiton / Write Flow (Fitbit Ingestion pipeline)

## Getting started

1. **Clone and configure env**  
```
git clone https://github.com/MinhTam16112005/SnyderlabChal.git  
cd <repo-dir>  
```

**Note:Edit .env as needed (Check .env.example for .env variable needed for configuration)**

2) **Launch the stack (builds & starts all services)**
```
docker-compose up -d
```
3) **Verify the DB is up and your hypertable exists(make sure .env exist before run)**
```
docker-compose ps
docker-compose exec timescaledb \
  psql -U fitbit_user -d fitbit_data -c "\dt raw_data"
```

this should output
```
            List of relations
 Schema |   Name   | Type  |    Owner    
--------+----------+-------+-------------
 public | raw_data | table | fitbit_user
(1 row)
```

4) **To activate the front end**
You need to set this in .env of frontend folder first
```
VITE_API_URL=http://localhost:5001
```

after install neccesary files and run it
```
npm install 
npm run dev
```
5) **Clean up command**
```
docker-compose down -v
```
## File Structure
```
SnyderlabChal/
├── backend/                        # FastAPI backend service
│   ├── app.py                      # Main FastAPI application with API endpoints
│   ├── Dockerfile                  # Container configuration for backend service
│   ├── requirements.txt                                 
│   └── .env
│
├── frontend/                       # React frontend application
│   ├── src/
│   │   ├── components/             # React UI components
│   │   │   ├── Header.jsx          # App header with title and subtitle
│   │   │   ├── DataGenerationForm.jsx  # Form for generating synthetic test data
│   │   │   ├── DataFetchForm.jsx   # Form for retrieving stored data
│   │   │   ├── DataVisualization.jsx   # Chart.js line chart component
│   │   │   ├── StatsGrid.jsx       # Statistics cards (min, max, avg, total)
│   │   │   ├── Alert.jsx           # Reusable alert component for errors/success
│   │   │   └── LogsDisplay.jsx     # Backend log output display component
│   │   │
│   │   ├── hooks/                  # Custom React hooks for business logic
│   │   │   ├── useMetrics.js       # Hook for fetching available metrics from API
│   │   │   ├── useHealthData.js    # Hook for data fetching and state management
│   │   │   └── useDataGeneration.js # Hook for synthetic data generation
│   │   │
│   │   ├── utils/                  # Utility functions and configurations
│   │   │   ├── constants.js        # Application constants (API URLs, colors, limits)
│   │   │   ├── dateValidation.js   # Date range validation and helper functions
│   │   │   └── chartConfig.js      # Chart.js configuration and styling
│   │   │
│   │   │
│   │   ├── App.css                 # Component-specific styles with clean architecture
│   │   ├── App.jsx                 # Main React component orchestrating the dashboard
│   │   ├── main.jsx                # React application entry point
│   │   └── index.css# Global CSS styles
│   │
│   ├── package.json                # Node.js dependencies and scripts
│   ├── vite.config.js              # Vite build configuration
│   ├── index.html                  # HTML template
│   └── .env                        # Frontend environment variables
│
├── ingestion/                      # Original ingestion service (unchanged)
│   ├── cron_jobs                   # Cron schedule configuration
│   ├── Dockerfile                  # Python+cron container
│   ├── ingest.py                   # Delta-load ingestion script
│   ├── last_run.txt                # Timestamp tracking for incremental loads
│   └── requirements.txt            # Python dependencies
│
├── timescaledb/                    # Database service (unchanged)
│   ├── data/                       # PostgreSQL data persistence
│   └── docker-entrypoint-initdb.d/
│       └── init.sql                # Database and table initialization
│
├── docker-compose.yml              # Multi-service orchestration
├── .env.example                    # Environment variables template
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT license
└── README.md                       # Project documentation
```

## Detail Explaination
**`ingestion/`**  
- **`Dockerfile`**: Installs Python 3.11, cron, and tzdata; copies application files and cron definition; runs `cron -f` in the foreground.

- **`cron_jobs`** : Defines the cron schedule (`0 1 * * *`) for `/etc/cron.d/fitbit-cron`, triggering daily ingestion at 1 AM PDT.

- **`ingest.py`**  Implements the delta-load logic:
1. Reads `last_run.txt` (ISO8601 with offset)  
2. Captures current time in local timezone  
3. Fetches synthetic or real Fitbit data  
4. Bulk-inserts into `raw_data` (with `ON CONFLICT` deduplication)  
5. Updates `last_run.txt` to the new timestamp

  - **`last_run.txt`**  Stores the timestamp of the last successful run, enabling true incremental (delta) ingestion.

**`timescaledb/`**  
- **`data/`**: Host-mounted directory for PostgreSQL’s data files, ensuring durability across container restarts.

- **`docker-entrypoint-initdb.d/init.sql`**  SQL script executed on the first startup of the TimescaleDB container to:  
1. Create the `fitbit_data` database  
2. Enable the TimescaleDB extension  
3. Define the `raw_data` table and convert it into a hypertable with a composite primary key for idempotency

**`backend/`**

- **`app.py`**
  - **API Endpoints**  
    - `GET /healthz`  
      Performs a system health check, including database connectivity.  
    - `GET /metrics`  
      Lists all available health metrics stored in the database.  
    - `GET /data`  
      Retrieves paginated metric data with filter options (date range, metric type).  
    - `POST /generate-data`  
      Generates synthetic test data for a given date range as a fallback when the Fitbit API is unavailable.
  - **Date Validation**  
    Enforces business rules:  
    - Maximum 60-day look-back per request  
    - All dates interpreted in America/Los_Angeles timezone
  - **Synthetic Data Generation**  
    Creates random metric records to support development and testing when live data is not accessible.

**`frontend/`**
- **`components/`**
  - **Purpose**: UI building block. They are reusable React components that render the user interface
    - `Header.jsx`: App title and branding
    - `DataGenerationForm.jsx`: Form to create synthetic data
    - `DataFetchForm.jsx`: Form to retrieve stored data
    - `DataVisualization.jsx`: Chart display
    - `StatsGrid.jsx`: Statistical summary cards
    - `Alert.jsx`: Success/error messages
    - `LogsDisplay.jsx`: Backend debug logs

- **`hooks/`**
  - **Purpose**: Custom React hooks that manage state and API interactions
    - `useMetrics.js`: Fetches available health metrics from backend
    - `useHealthData.js`: Handles data retrieval and caching
    - `useDataGeneration.js`:   Manages synthetic data creation process

- **`utils/`**
  - **Purpose**: Pure utility functions and configuration constants
    - `constants.js`: App-wide constants (API URLs, limits, colors)
    - `dateValidation.js`: Date range validation and timezone handling
    - `chartConfig.js`: Chart.js styling and configuration
  
- **`App.jsx`**
  - **Purpose**: Root component that coordinates the entire application
    - Registers Chart.js components globally
    - Manages top-level state (dataPoints, currentMetric)
    - Orchestrates data flow between child components
    - Provides the main dashboard layout structure

  **Data flow**: Components -> Hooks -> Utils -> App.jsx

**Root files**  
- `.env.example`  
  ```dotenv
  DB_HOST=timescaledb
  DB_PORT=5432
  DB_NAME=fitbit_data
  DB_USER=fitbit_user
  DB_PASSWORD=fitbit_password
  SEED=100

- `docker-compose.yml`

  Defines two services:

1. **`timescaledb`**  
  - Uses the official TimescaleDB image  
  - Mounts host volumes for data persistence and for `docker-entrypoint-initdb.d` init scripts  
  - Exposes port **5433**  

2. **`ingester`**  
  - Built from the `ingestion/` folder  
  - Loads environment variables from your `.env` file  
  - Mounts `last_run.txt` for delta‐load tracking  
  - Depends on the `timescaledb` service  

3. **`backend`**  
  - Built from the `backend/` folder containing FastAPI application
  - Exposes port **5001** for API endpoints
  - Provides REST API for data retrieval, synthetic data generation, and health monitoring
  - Connects to TimescaleDB for database operations
  - Supports both real ingestion module and synthetic data fallback
  - Depends on the `timescaledb` service


## Database Schema
- `raw_data` table:
  - Columns: `timestamp TIMESTAMPTZ`, `metric_type TEXT`, `value DOUBLE PRECISION`
  - Primary Key: `(timestamp, metric_type)`
- Converted to a hypertable on `timestamp`
- Unique index on `(timestamp, metric_type)` for idempotency
