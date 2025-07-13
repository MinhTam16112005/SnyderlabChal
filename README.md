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
6) **Clean up command**
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
      
  - **Data Imputation System**  
    **Tiered Imputation Strategy**:
    - **Tier 1 (Short gaps ≤2 hours)**: Linear interpolation between adjacent points
    - **Tier 2 (Medium gaps 3-10 hours)**: Pattern-based prediction using historical data from same time periods (1, 2, 7, 14 days ago) with weighted averaging, fallback to linear interpolation
    - **Tier 3 (Long gaps 11+ hours)**: No imputation to avoid introducing significant bias
    
    **Gap Detection**: Automatically identifies missing data periods exceeding 1.5x expected interval
    
    **Pattern Matching**: Uses weighted historical analysis with configurable lookback periods and time-based pattern recognition
    
  - **User Management**  
    Complete user lifecycle with enrollment tracking, data association, and secure deletion.
    Timezone-aware enrollment dates stored in UTC with proper conversion handling.
    
  - **Database Integration**  
    Dynamic schema detection for imputation columns with graceful fallback.
    Conflict resolution using `ON CONFLICT` for data consistency.
    Support for both legacy and enhanced database schemas.
    
  - **Date Validation**  
    Enforces business rules:  
    - Maximum 60-day look-back per request  
    - All dates interpreted in America/Los_Angeles timezone
    - Future date prevention and proper timezone conversion
    
  - **Synthetic Data Generation**  
    Creates realistic test data with intentional gaps:
    - 60% short gaps (2-3 hours) for testing linear interpolation
    - 30% medium gaps (4-8 hours) for testing pattern-based imputation  
    - 10% long gaps (12-24 hours) for testing no-imputation scenarios
    - Deterministic random seed for reproducible test datasets
    
  - **Error Handling and Logging**  
    Comprehensive exception handling with detailed error messages.
    Log capture system for debugging synthetic data generation.
    Proper HTTP status codes and structured error responses.
    
  - **CORS and Security**  
    Cross-origin resource sharing configured for frontend integration.
    Database connection management with proper resource cleanup.

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

  Defines three services:

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