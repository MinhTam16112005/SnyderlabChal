# Snyderlab Challenge
# Note: Please use google chrome for running the frontend, other browser doesnt support minute and second time option
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
  I've built a comprehensive FastAPI backend with React frontend for health data visualization. Features include random synthetic data generation, data retrieval with pagination, real-time visualization, and clean architecture following best practices.
  Please see the **demo video** (which i attached the link) in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 2 video demo dashboard)

- **Update 4 (July 10)**  
  Completed task 3 (main task): Optimizing Design for Multi-Year / Multi-User queries
  I've implemented a comprehensive database optimization strategy with automatic time-based aggregations and smart query routing. The system now creates daily summaries of raw hourly data during ingestion, and automatically selects the appropriate data source based on query timespan. This enables efficient memory usage for large queries spanning months or years of data, reducing data transfer by up to 95%.
  Please see the detailed aggregation technique explaination I applied into my program in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 3)

- **Update 5 (July 13)**
  Completed task 4: Creating a Dashboard for Analysis / Visualization
  I've split main page into 3 webpage: User Enrollment (to enroll user), Data ingestion(Ingest data from Fitbit synthetic mode), Data Analysis(Provide detail analyze chart for data/metrics).
  I tackled some requirements listed on the task description: participant have no token yet (use synthetic mode), participant has not uploaded daat in 48 hours (will explain by simulate that situation when ingest data), participant have less than 70% adherence overall (tackle that on certain degree). Note: All the detail will be included on google doc Tab: Task 4. (1)
  I included imputation method (base on how long the data is missing), the detail will be explain more on doc file. (2)
  I structure database so you can create how many user you want and ingest how many data points you want too. (4)
  Please see the detailed aggregation technique explaination I applied into my program in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 4)

- **Update 6 (July 14)**
  Completed task 5: Monitoring / Alerting 
  I've built a comprehensive enterprise-grade monitoring and alerting system using Prometheus, Grafana, and AlertManager with Docker Compose. The system provides complete observability across infrastructure, application metrics, and business logic with intelligent email alerting.

- **Final Update (July 14) 9PM**
  Completed task 6: Horizontally Scaling
  I've included all services and quantity of nodes along with their specs for final product, including data ingestion, query and dashboard, monitoring and alert, and store archive data.
  Please see the detailed aggregation technique explaination I applied into my program in the [Google Doc](https://docs.google.com/document/d/1OY2PlsC_XDZ060Dw5oSTyHAeoWPiIbVfOWu471qASZ4/edit?usp=sharing). (Tab: Task 0.a)
  Please read the "Please read" tab if you are able to, very much appreciated

Note: To simulate real case scenario for production level, I have 2 branch : main and development-branch, I always commit code on to development-branch first, then use my friend computer to test it, after that do commit to main.
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

3) **Important: Have to set .env file for root folder and backend/frontend folder**
Check the .env.example for example .env file 

4) **Verify the DB is up and your hypertable exists(make sure .env exist before run)**
```
docker-compose ps
docker-compose exec timescaledb \
  psql -U fitbit_user -d fitbit_data -c "\dt raw_data"
```

5) **To activate the front end**
Install neccesary files and run it
```
npm install 
npm run dev
```

6) **To access the monitoring stack**
Prometheus (metrics & alerts)
```
open http://localhost:9090
```

Grafana (dashboards) - admin/admin123

```
open http://localhost:3001
```

AlertManager (alert status)
```
open http://localhost:9093
```

To verify monitoring services:
```
docker-compose ps prometheus grafana alertmanager mailhog node-exporter cadvisor
```

7) **Clean up command**
```
docker-compose down -v
```

### **Troubleshooting**
Common Issues
- Services won't start
```
# Check all services status
docker-compose ps

# Check specific service logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

- Database connection issues
```
# Verify TimescaleDB is running
docker-compose exec timescaledb pg_isready -U fitbit_user

# Check database tables
docker-compose exec timescaledb psql -U fitbit_user -d fitbit_data -c "\dt"
```

Frontend not loading
```
# Ensure frontend dependencies are installed
cd frontend && npm install

# Start development server
npm run dev
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
│   │   │   ├── Alert.jsx           # Alert component for errors/success
│   │   │   ├── AnalysisPage.jsx    # Data analysis page with charts
│   │   │   ├── AnalysisPage.css    # Styles for analysis page
│   │   │   ├── DataFetchForm.jsx   # Form for retrieving/filtering stored data
│   │   │   ├── DataFetchForm.css   # Styles for data fetch form and controls
│   │   │   ├── DataGenerationForm.jsx # Form for generating synthetic test data
│   │   │   ├── DataVisualization.jsx # Chart.js line chart with gap detection
│   │   │   ├── DataVisualization.css # Styles for chart components and legends
│   │   │   ├── Enrollment.css      # Styles for enrollment page and user cards
│   │   │   ├── EnrollmentPage.jsx  # User enrollment and management interface
│   │   │   ├── Header.jsx          # App header with navigation and branding
│   │   │   ├── IngestionPage.jsx   # Data generation interface for enrolled users
│   │   │   ├── IngestionPage.css   # Styles for ingestion page and forms
│   │   │   ├── LogsDisplay.jsx     # Backend log output display component
│   │   │   ├── Navigation.jsx      # Main navigation component between pages
│   │   │   ├── Navigation.css      # Styles for navigation tabs and buttons
│   │   │   ├── StatsGrid.jsx       # Statistics cards (min, max, avg, total)
│   │   │   └── TimezoneSelector.jsx # Timezone selection dropdown component
│   │   │
│   │   ├── contexts/               # React context providers
│   │   │   └── UserContext.jsx  # Global state for user, timezone, and date management
│   │   │
│   │   ├── hooks/                  # Custom React hooks for business logic
│   │   │   ├── useDataGeneration.js # Hook for synthetic data generation
│   │   │   ├── useEnrollment.js    # Hook for user enrollment and management
│   │   │   ├── useHealthData.js    # Hook for data fetching and state management
│   │   │   ├── useMetrics.js       # Hook for fetching available metrics from API
│   │   │   ├── useUserContext.js   # Hook for accessing user context
│   │   │   └── useUsers.js         # Hook for user data and operations
│   │   │
│   │   ├── utils/                  # Utility functions and configurations
│   │   │   ├── constants.js        # Application constants (API URLs, colors, limits)
│   │   │   └── dateValidation.js   # Date  validation and timezone helper functions
│   │   │
│   │   ├── assets/                 # Static assets and media files
│   │   │   ├── logo.png           # Application logo image
│   │   │   └── react.svg          # React framework logo
│   │   │
│   │   ├── App.css                 # Global component styles and responsive design
│   │   ├── App.jsx                 # Main React component orchestrating the dashboard
│   │   ├── index.css               # Base CSS styles and theme variables
│   │   └── main.jsx                # React application entry point
│   │
│   ├── public/                     # Public static files
│   │   └── vite.svg               # Vite build tool logo
│   │
│   ├── .env.example               # Frontend environment variables template
│   ├── .gitignore                 # Git exclusion rules for frontend
│   ├── eslint.config.js           # ESLint configuration for code quality
│   ├── index.html                 # HTML template and application entry point
│   ├── package.json               # Node.js dependencies and build scripts
│   ├── README.md                  # Frontend-specific documentation
│   └── vite.config.js             # Vite build configuration and dev server
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
├── monitoring/                     # Enterprise monitoring and alerting stack
│   ├── alertmanager/              # AlertManager configuration
│   │   └── alertmanager.yml       # Email notifications and alert routing rules
│   │
│   ├── grafana/                   # Grafana dashboards and data sources
│   │   └── provisioning/          # Auto-provisioning configuration
│   │       ├── dashboards/        # Dashboard definitions
│   │       │   ├── dashboards.yml # Dashboard provider configuration
│   │       │   └── snyderlab-dashboard.json # Custom SnyderLab application dashboard
│   │       └── datasources/       # Data source definitions
│   │           └── datasources.yml # Prometheus data source configuration
│   │
│   └── prometheus/                # Prometheus metrics collection
│       ├── prometheus.yml         # Scrape targets and global configuration
│       └── rules.yml              # Alert rules for monitoring conditions
│
├── docker-compose.yml              # Multi-service orchestration
├── .env.example                    # Environment variables template
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT license
└── README.md                       # Project documentation
```

## Environment Variables Configuration

### Required Environment Variables

Create `.env` files in three locations:
1. **Root directory** (for Docker Compose)
2. **`backend/` folder** (for API service)  
3. **`frontend/` folder** (for React app)

#### Root `.env` (Database Configuration)
```dotenv
# Database Settings
DB_HOST=timescaledb
DB_PORT=5432
DB_NAME=fitbit_data
DB_USER=fitbit_user
DB_PASSWORD=fitbit_password

# Data Generation
SEED=100
```

#### Backend `.env` (Backend Configuration)
```
DB_HOST=timescaledb
DB_PORT=5432
DB_NAME=fitbit_data
DB_USER=fitbit_user
DB_PASSWORD=fitbit_password
API_PORT=5001
USER_ID=user_1
SEED=100
```

#### Frontend `.env` (Frontend Configuration)
```
VITE_API_BASE_URL=http://localhost:5001
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
5. Automatically creates daily aggregates for efficient querying
6. Updates `last_run.txt` to the new timestamp

  - **`last_run.txt`**  Stores the timestamp of the last successful run, enabling true incremental (delta) ingestion.

**`timescaledb/`**  
- **`data/`**: Host-mounted directory for PostgreSQL’s data files, ensuring durability across container restarts.

- **`docker-entrypoint-initdb.d/init.sql`**  SQL script executed on the first startup of the TimescaleDB container to:  
1. Create the `fitbit_data` database  
2. Enable the TimescaleDB extension  
3. Define the `raw_data` table and convert it into a hypertable with a composite primary key for idempotency
4. Create the `data_1d` daily aggregate table for memory-optimized queries
5. Convert the aggregate table into a hypertable for TimescaleDB optimizations

**`backend/`**
- **`app.py`**
  - **API Endpoints**  
    - `GET /healthz`  
      Performs a system health check, including database connectivity and import status.  
    - `GET /metrics`  
      Lists all available health metrics stored in the database.
    - `GET /prom-metrics`  
      Prometheus metrics endpoint exposing application metrics for monitoring stack integration.
      Provides real-time metrics including API request counters, response times, and business logic indicators.
    - `GET /users`  
      Retrieves all users with their data statistics (total records, date ranges, metrics count).
    - `GET /enrolled-users`  
      Gets list of enrolled users with enrollment dates and data summary statistics.
    - `GET /data`  
      Retrieves paginated metric data with advanced filtering options:
      - Date range and metric type filtering
      - Gap detection and imputation support
      - `include_imputed`: Controls whether to show existing imputed data points
      - `apply_imputation`: Enables real-time gap detection and imputation
      - Returns comprehensive data summary with imputation statistics
    - `POST /generate-data`  
      Generates synthetic test data with intentional gaps for testing imputation algorithms.
      Creates realistic patterns with 20% gap probability for development purposes.
    - `POST /enroll-user`  
      Enrolls new users in the system with proper timezone handling and duplicate prevention.
    - `DELETE /users/{user_id}`  
      Removes users and all associated data with cascading deletion.

  - **Prometheus Monitoring Integration**  
    **Custom Application Metrics**:
    - `api_requests_total`: Counter tracking HTTP requests by method, endpoint, and status code
    - `api_request_duration_seconds`: Histogram measuring API response times for performance monitoring
    - `data_points_processed_total`: Counter tracking total data points ingested across all users
    - `database_connections_active`: Gauge monitoring active database connection pool usage
    - `imputation_operations_total`: Counter tracking imputation operations by type (linear, pattern_based, linear_fallback)
    
    **Automatic Request Tracking**: Middleware automatically instruments all API endpoints with request counting, duration measurement, and status code tracking for comprehensive observability.
    
    **Business Logic Monitoring**: Tracks data processing rates, imputation algorithm usage, and database performance metrics for operational insights.
      
  - **Data Imputation System**  
    **Tiered Imputation Strategy**:
    - **Tier 1 (Short gaps ≤2 hours)**: Linear interpolation between adjacent points
    - **Tier 2 (Medium gaps 3-10 hours)**: Pattern-based prediction using historical data from same time periods (1, 2, 7, 14 days ago) with weighted averaging, fallback to linear interpolation
    - **Tier 3 (Long gaps 11+ hours)**: No imputation to avoid introducing significant bias
    
    **Gap Detection**: Automatically identifies missing data periods exceeding 1.5x expected interval
    
    **Pattern Matching**: Uses weighted historical analysis with configurable lookback periods and time-based pattern recognition
    
    **Database Integration**: Saves imputed points with metadata tracking (method used, gap duration, imputation timestamp) for quality assurance and audit trails.
    
  - **Advanced Gap Detection Service**
    **Automated Gap Identification**: Analyzes time series data to detect missing periods based on expected 1-hour intervals with 50% tolerance.
    
    **Gap Categorization**: Classifies gaps into three tiers:
    - Short gaps (≤2 hours): Suitable for linear interpolation
    - Medium gaps (3-10 hours): Candidates for pattern-based imputation
    - Long gaps (11+ hours): Marked for manual review, no automatic imputation
    
    **Historical Pattern Analysis**: Retrieves data from same time periods (1, 2, 7, 14 days ago) with weighted averaging for intelligent prediction.
    
  - **User Management**  
    Complete user lifecycle with enrollment tracking, data association, and secure deletion.
    Timezone-aware enrollment dates stored in UTC with proper conversion handling.
    **Enrollment Table Integration**: Maintains separate `users` table for enrollment tracking with timestamps and data association statistics.
    
  - **Database Integration**  
    Dynamic schema detection for imputation columns with graceful fallback.
    Conflict resolution using `ON CONFLICT` for data consistency.
    Support for both legacy and enhanced database schemas.
    **Connection Pool Management**: Proper database connection lifecycle with automatic cleanup and error handling.
    
  - **Date Validation**  
    Enforces business rules:  
    - Maximum 60-day look-back per request  
    - All dates interpreted in America/Los_Angeles timezone
    - Future date prevention and proper timezone conversion
    **Business Rule Validation**: Comprehensive date range validation with timezone-aware processing and constraint enforcement.
    
  - **Synthetic Data Generation**  
    Creates realistic test data with intentional gaps:
    - 60% short gaps (2-3 hours) for testing linear interpolation
    - 30% medium gaps (4-8 hours) for testing pattern-based imputation  
    - 10% long gaps (12-24 hours) for testing no-imputation scenarios
    - Deterministic random seed for reproducible test datasets
    **Configurable Gap Generation**: Programmable gap distribution for testing different imputation scenarios and algorithm validation.
    
  - **Error Handling and Logging**  
    Comprehensive exception handling with detailed error messages.
    Log capture system for debugging synthetic data generation.
    Proper HTTP status codes and structured error responses.
    **Log Capture System**: Custom logging mechanism for API clients with structured error reporting and debugging support.
    
  - **CORS and Security**  
    Cross-origin resource sharing configured for frontend integration.
    Database connection management with proper resource cleanup.
    **Middleware Architecture**: Automatic request instrumentation for monitoring with proper resource management and cleanup.

  - **Production Monitoring Features**  
    - **Health Check Integration**: Comprehensive system health validation including database connectivity, import module status, and current timestamp reporting.
    
    - **Metrics Export**: Native Prometheus metrics exposition format for seamless integration with monitoring stack.
    
    - **Performance Tracking**: Real-time monitoring of API performance, database operations, and business logic execution with alerting-ready metrics.

**`monitoring/`**
- **`alertmanager/`**
  - **Purpose**: Intelligent email alerting and notification routing system
    - `alertmanager.yml`: Email notification configuration with SMTP settings, alert routing rules, and professional email templates
      - **Global SMTP Configuration**: Uses MailHog (mailhog:1025) for development email testing with TLS disabled
      - **Alert Routing**: Groups alerts by alertname with 10-second wait times and 1-hour repeat intervals
      - **Email Templates**: Professional notification format with alert details, severity levels, and monitoring links
      - **Inhibition Rules**: Critical alerts suppress warning alerts for the same instance to reduce noise
      - **Recipients**: Configured to send alerts to admin@wearipedia.com with proper From/Reply-To headers

- **`grafana/`**
  - **Purpose**: Data visualization and dashboard management system
    - `provisioning/`: Auto-provisioning configuration for seamless deployment
      - **`dashboards/`**: Dashboard definitions and provider configuration
        - `dashboards.yml`: Dashboard provider configuration enabling auto-discovery of JSON dashboard files
        - `snyderlab-dashboard.json`: Custom SnyderLab application dashboard with 4 key panels:
          - **API Request Rate**: Real-time request rate visualization (requests/second)
          - **API Response Time**: 95th percentile response time monitoring for performance tracking
          - **Data Points Processed**: Total data ingestion counter across all users
          - **Imputation Operations by Type**: Pie chart showing distribution of imputation methods (linear, pattern_based, linear_fallback)
        - **Dashboard Features**: 1-hour time range, 30-second auto-refresh, browser timezone support
      - **`datasources/`**: Data source definitions for metrics collection
        - `datasources.yml`: Prometheus data source configuration (http://prometheus:9090) as default data source

- **`prometheus/`**
  - **Purpose**: Metrics collection and alert rule engine
    - `prometheus.yml`: Comprehensive scrape configuration and global settings
      - **Global Configuration**: 15-second scrape and evaluation intervals for real-time monitoring
      - **Scrape Targets**: 
        - `prometheus`: Self-monitoring on localhost:9090
        - `node-exporter`: Host system metrics (CPU, memory, disk, network) on node-exporter:9100
        - `cadvisor`: Container resource metrics on cadvisor:8080
        - `backend-api`: Custom application metrics via /prom-metrics endpoint on backend:5000 (30-second interval)
      - **AlertManager Integration**: Configured to send alerts to alertmanager:9093
    - `rules.yml`: Production-ready alert rules for comprehensive system monitoring
      - **Critical Alerts**:
        - `InstanceDown`: Service unavailability detection (up == 0 for >1 minute)
        - `HighAPIErrorRate`: API error spike detection (>0.1 errors/second for >2 minutes)
      - **Warning Alerts**:
        - `HighMemoryUsage`: Memory exhaustion warning (>80% usage for >2 minutes)
        - `SlowAPIResponse`: Performance degradation (95th percentile >2 seconds for >3 minutes)
        - `NoDataProcessing`: Data pipeline stall detection (no data points for >10 minutes)
        - `HighImputationRate`: Data quality issues (>10 imputation ops/second for >2 minutes)
      - **Alert Metadata**: Rich annotations with summaries, descriptions, and dynamic value templating

**Enterprise Monitoring Features**:
- **Complete Observability Stack**: Infrastructure + Application + Business Logic monitoring
- **Intelligent Alerting**: 6 production-ready alert rules with appropriate severity levels and thresholds
- **Professional Email Notifications**: Formatted alerts with monitoring links and detailed information
- **Auto-Provisioning**: Zero-configuration Grafana setup with pre-built dashboards
- **Real-Time Visualization**: Custom dashboard panels showing API performance, data processing, and system health
- **Multi-Layer Metrics Collection**: Host metrics (Node Exporter), container metrics (cAdvisor), and custom application metrics
- **Development-Ready**: MailHog integration for local email testing without external SMTP dependencies
- **Production Considerations**: Clear documentation for transitioning from MailHog to production SMTP servers
- **Alert Correlation**: Inhibition rules prevent alert fatigue by suppressing lower-priority alerts when critical issues occur
- **Scalable Architecture**: Modular design allows components to be deployed across multiple hosts by updating scrape targets


## **Mornitoring Dashboard Interpretation Guide**

### Accessing Grafana Dashboards
1. Open http://localhost:3001
2. Login: `admin` / `admin123`
3. Navigate to **SnyderLab Dashboard** (auto-loaded)

### Dashboard Panels Explained

#### **Panel 1: API Request Rate**
- **Metric**: `rate(api_requests_total[5m])`
- **Shows**: Real-time API requests per second
- **Normal Range**: 0.1-5 requests/second during testing
- **Alert Threshold**: >10 req/sec indicates unusual activity

#### **Panel 2: API Response Time (95th Percentile)**  
- **Metric**: `histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))`
- **Shows**: 95% of requests complete within this time
- **Normal Range**: 50-500ms for healthy API
- **Alert Threshold**: >2 seconds triggers SlowAPIResponse alert

#### **Panel 3: Data Points Processed**
- **Metric**: `increase(data_points_processed_total[1h])`
- **Shows**: Total data points ingested in the last hour
- **Normal Range**: 100-1000 points/hour during data generation
- **Alert Threshold**: 0 points for >10 minutes triggers NoDataProcessing alert

#### **Panel 4: Imputation Operations by Type**
- **Metrics**: `imputation_operations_total` by method
- **Shows**: Distribution of imputation algorithms used
- **Types**: 
  - `linear`: Simple interpolation (short gaps)
  - `pattern_based`: Historical pattern matching (medium gaps)  
  - `linear_fallback`: Fallback when pattern matching fails
- **Alert Threshold**: >10 ops/second indicates data quality issues

### Key Performance Indicators (KPIs)
- **Green**: All metrics within normal ranges
- **Yellow**: Warning thresholds exceeded (investigate)
- **Red**: Critical thresholds exceeded (immediate action required)

## Alert System Guide

### Alert Severity Levels

#### **🔴 Critical Alerts (Immediate Response)**
- **InstanceDown**: Service completely unavailable
  - **Action**: Check `docker-compose ps`, restart failed services
- **HighAPIErrorRate**: >0.1 server errors per second  
  - **Action**: Check backend logs: `docker-compose logs backend`

#### **🟡 Warning Alerts (Investigation Required)**
- **HighMemoryUsage**: >80% memory usage
  - **Action**: Check system resources, consider scaling
- **SlowAPIResponse**: 95th percentile >2 seconds
  - **Action**: Check database performance, query optimization
- **NoDataProcessing**: No data ingested for >10 minutes
  - **Action**: Verify data generation, check ingestion service
- **HighImputationRate**: >10 imputation operations per second
  - **Action**: Investigate data source reliability

Note: Email alert format is included in alertmanager.yml


### Alert Testing
```
# Test email delivery
curl -X POST http://localhost:5001/generate-data \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2025-01-01", "end_date": "2025-01-02", "user_id": "test"}'

# Check MailHog inbox
open http://localhost:8025

# Check Prometheus targets
curl http://localhost:9090/api/v2/targets

# Verify backend metrics endpoint
curl http://localhost:5001/prom-metrics

# Check AlertManager configuration
docker-compose logs alertmanager | grep -i error

# Check MailHog web interface
open http://localhost:8025
```
**`frontend/`**
- **`src/components/`**
  - **Purpose**: Reusable React UI components that render the user interface
    - `Alert.jsx`: Reusable alert component for displaying errors and success messages
    - `AnalysisPage.jsx`: Data analysis page with charts and metrics visualization
    - `AnalysisPage.css`: Styles for analysis page components and layout
    - `DataFetchForm.jsx`: Form for retrieving and filtering stored data with advanced options
    - `DataFetchForm.css`: Styles for data fetch form controls and dropdowns
    - `DataGenerationForm.jsx`: Form for generating synthetic test data (legacy component)
    - `DataVisualization.jsx`: Chart.js line chart with gap detection and imputation display
    - `DataVisualization.css`: Styles for chart components, legends, and interactive elements
    - `Enrollment.css`: Styles for enrollment page, user cards, and popup modals
    - `EnrollmentPage.jsx`: User enrollment and management interface with CRUD operations
    - `Header.jsx`: Application header with navigation and branding elements
    - `IngestionPage.jsx`: Data generation interface for enrolled users with date validation
    - `IngestionPage.css`: Styles for ingestion page forms and user selection components
    - `LogsDisplay.jsx`: Backend log output display component for debugging
    - `Navigation.jsx`: Main navigation component for switching between pages
    - `Navigation.css`: Styles for navigation tabs, buttons, and responsive layout
    - `StatsGrid.jsx`: Statistical summary cards displaying min, max, avg, and total values
    - `TimezoneSelector.jsx`: Advanced timezone selection dropdown with real-time display

- **`src/contexts/`**
  - **Purpose**: React context providers for global state management
    - `UserContext.jsx`: Global state for user selection, timezone management, and date utilities

- **`src/hooks/`**
  - **Purpose**: Custom React hooks that manage state and API interactions
    - `useDataGeneration.js`: Hook for synthetic data generation with comprehensive error handling
    - `useEnrollment.js`: Hook for user enrollment, deletion, and management operations
    - `useHealthData.js`: Hook for data fetching, filtering, and state management
    - `useMetrics.js`: Hook for fetching available health metrics from backend API
    - `useUserContext.js`: Hook for accessing user context with validation
    - `useUsers.js`: Hook for user data retrieval and operations

- **`src/utils/`**
  - **Purpose**: Pure utility functions and configuration constants
    - `constants.js`: Application constants (API URLs, chart colors, date limits, timezone configs)
    - `dateValidation.js`: Date range validation, timezone handling, and business rule enforcement

- **`src/assets/`**
  - **Purpose**: Static assets and media files
    - `logo.png`: Application logo image for branding
    - `react.svg`: React framework logo

- **`src/`**
  - `App.css`: Global component styles, responsive design, and theme variables
  - `App.jsx`: Main React component orchestrating the three-page application structure
  - `index.css`: Base CSS styles and global theme variables
  - `main.jsx`: React application entry point with StrictMode

- **`public/`**
  - **Purpose**: Public static files served directly
    - `vite.svg`: Vite build tool logo

- **Root Configuration Files**
  - `.env.example`: Frontend environment variables template
  - `.gitignore`: Git exclusion rules for node_modules and build artifacts
  - `eslint.config.js`: ESLint configuration for code quality and React best practices
  - `index.html`: HTML template and application entry point with Vite integration
  - `package.json`: Node.js dependencies, build scripts, and project metadata
  - `README.md`: Frontend-specific documentation and setup instructions
  - `vite.config.js`: Vite build configuration and development server settings

**Application Architecture:**
- **Three-Page Structure**: User Enrollment → Data Ingestion → Data Analysis
- **State Management**: Context API for global state, custom hooks for component-specific logic
- **Styling**: Component-specific CSS files with responsive design and consistent theming
- **Data Flow**: UserContext → Custom Hooks → Components → UI Rendering
- **Key Features**: 
  - Multi-user enrollment and management system
  - Synthetic data generation with date range validation
  - Advanced data visualization with gap detection and imputation
  - Timezone-aware date handling and real-time updates
  - Responsive design for desktop, tablet, and mobile devices


- **Data Flow Pattern**: 
UserContext → Custom Hooks → API Calls → Component State → UI Updates

**`Root files`**  
- `.env.example`  
  ```dotenv
  DB_HOST=timescaledb
  DB_PORT=5432
  DB_NAME=fitbit_data
  DB_USER=fitbit_user
  DB_PASSWORD=fitbit_password
  SEED=100

**`docker-compose.yml`**

  Defines nine services for complete enterprise-grade monitoring:

**Core Application Services:**

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
  - Includes health check endpoint for monitoring integration

**Enterprise Monitoring Stack:**

4. **`prometheus`**
  - Metrics collection and alert rule engine
  - Exposes port **9090** for web interface and API
  - Mounts `./monitoring/prometheus` for configuration files
  - 200-hour data retention with lifecycle management enabled
  - Scrapes metrics from all services every 15 seconds

5. **`grafana`**
  - Data visualization and dashboard management
  - Exposes port **3001** (avoiding frontend conflict)
  - Auto-provisioning from `./monitoring/grafana/provisioning`
  - Default credentials: admin/admin123
  - Pre-configured with Prometheus data source and custom dashboards

6. **`alertmanager`**
  - Intelligent alert routing and email notifications
  - Exposes port **9093** for web interface
  - Email notification configuration via `./monitoring/alertmanager`
  - Professional alert templates with grouping and inhibition rules

7. **`mailhog`**
  - Development SMTP server for email testing
  - Exposes port **1025** (SMTP) and **8025** (Web UI)
  - Captures all emails locally for development and testing
  - No external email dependencies required

**Infrastructure Monitoring:**

8. **`node-exporter`**
  - Host system metrics collection (CPU, memory, disk, network)
  - Exposes port **9100** for metrics endpoint
  - Mounts host filesystem for comprehensive system monitoring
  - Excludes virtual filesystems for accurate metrics

9. **`cadvisor`**
  - Container resource monitoring and Docker metrics
  - Exposes port **8080** for web interface and metrics
  - Privileged access for complete container visibility
  - Real-time container performance and resource usage tracking

**Network and Storage:**
- **`snyder-net`**: Bridge network connecting all services for internal communication
- **`prometheus-data`**: Persistent volume for Prometheus metrics storage
- **`grafana-data`**: Persistent volume for Grafana dashboards and configurations
- **`tsdb-data`**: TimescaleDB data persistence across container restarts

**Key Features:**
- **Complete Observability**: Application + Infrastructure + Container monitoring
- **Auto-Discovery**: Prometheus automatically discovers and monitors all services
- **Health Checks**: Built-in health monitoring with automatic restart policies
- **Development-Ready**: MailHog eliminates external SMTP dependencies
- **Production-Scalable**: Modular architecture supports distributed deployment
- **Data Persistence**: All critical data survives container restarts
- **Security**: Internal network isolation with controlled port exposure


## Database Schema

### Raw Data Table
- `raw_data` table (hypertable partitioned on `timestamp`):
  - **Core Columns**:
    - `timestamp TIMESTAMPTZ NOT NULL` - Time-series data timestamp
    - `user_id TEXT NOT NULL` - User identifier
    - `metric_type TEXT NOT NULL` - Health metric type (heart rate, steps, etc.)
    - `value DOUBLE PRECISION` - Metric measurement value
  - **Imputation Columns**:
    - `is_imputed BOOLEAN DEFAULT FALSE` - Marks synthetic/interpolated data points
    - `imputation_method VARCHAR(50)` - Algorithm used (linear, pattern_based, etc.)
    - `gap_duration_hours INTEGER` - Duration of the original data gap
  - **Indexes**:
    - Primary Key: `(timestamp, user_id, metric_type)`
    - Unique Index: `raw_data_unique_idx` on `(timestamp, user_id, metric_type)`
    - Imputation Index: `raw_data_imputed_idx` on `(user_id, metric_type, is_imputed, timestamp)`

### Daily Aggregation Table
- `data_1d` table (hypertable partitioned on `date_day`):
  - **Aggregation Columns**:
    - `date_day DATE NOT NULL` - Daily partition key
    - `user_id TEXT NOT NULL` - User identifier
    - `metric_type TEXT NOT NULL` - Health metric type
    - `avg_value DOUBLE PRECISION` - Daily average value
    - `min_value DOUBLE PRECISION` - Daily minimum value
    - `max_value DOUBLE PRECISION` - Daily maximum value
    - `count_points INTEGER` - Total data points for the day
  - **Data Quality Tracking**:
    - `real_points INTEGER DEFAULT 0` - Count of actual measured data points
    - `imputed_points INTEGER DEFAULT 0` - Count of imputed/synthetic data points
  - **Performance**:
    - Primary Key: `(date_day, user_id, metric_type)`
    - Automatically populated during data ingestion
    - Used for memory-efficient queries on date ranges >7 days

### User Management Table
- `users` table:
  - **Columns**:
    - `user_id VARCHAR(255) PRIMARY KEY` - Unique user identifier
    - `enrollment_date TIMESTAMP NOT NULL` - User enrollment date (timezone-aware)
    - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` - Record creation timestamp
  - **Purpose**: Tracks enrolled users and their enrollment timeline for data association

### Gap Detection Metadata Table
- `data_gaps` table:
  - **Gap Identification**:
    - `gap_id SERIAL PRIMARY KEY` - Unique gap identifier
    - `user_id TEXT NOT NULL` - Associated user
    - `metric_type TEXT NOT NULL` - Affected metric type
    - `gap_start TIMESTAMPTZ NOT NULL` - Gap beginning timestamp
    - `gap_end TIMESTAMPTZ NOT NULL` - Gap ending timestamp
    - `gap_duration_hours INTEGER NOT NULL` - Gap duration in hours
  - **Gap Classification**:
    - `gap_type VARCHAR(20) NOT NULL` - Gap category: 'short' (≤2h), 'medium' (3-10h), 'long' (11+h)
    - `imputation_applied BOOLEAN DEFAULT FALSE` - Whether gap was filled with imputed data
    - `detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` - Gap detection timestamp
  - **Constraints**:
    - Check constraint: `gap_type IN ('short', 'medium', 'long')`
    - Unique constraint: `(user_id, metric_type, gap_start, gap_end)`
    - Index: `data_gaps_user_metric_idx` on `(user_id, metric_type, gap_start)`

### Database Features

**TimescaleDB Hypertables**:
- Automatic time-based partitioning for optimal query performance
- Parallel query execution across time chunks
- Efficient compression and retention policies

**Data Integrity**:
- Composite primary keys prevent duplicate entries
- Unique indexes ensure idempotent data ingestion
- Foreign key relationships maintain referential integrity

**Imputation Tracking**:
- Complete audit trail of synthetic data points
- Method and duration tracking for quality assessment
- Separate counting of real vs. imputed data in aggregations

**Query Optimization**:
- Smart routing: raw data for ≤7 days, aggregates for longer ranges
- Specialized indexes for imputation and gap detection queries
- Memory-efficient aggregation reduces data transfer by up to 95%

**Gap Detection System**:
- Automatic identification of missing data periods
- Classification by gap duration for appropriate imputation strategy
- Metadata preservation for quality control and analysis