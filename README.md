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
  
# Task 1: Ingesiton / Write Flow (Fitbit Ingestion pipeline)

## Getting started

1. **Clone and configure env**  
```
git clone https://github.com/MinhTam16112005/SnyderlabChal.git  
cd <repo-dir>  
cp .env.example .env
```
**Note: Edit .env as needed (Check docker-compose.yml for .env variable needed for configuration)**

2) **Launch the stack (builds & starts both services)**
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

4) **To actually test out the script we can force run it**

```
docker-compose exec ingester python /app/ingest.py
```

and if you want to check what data have been recieved

```
docker-compose exec timescaledb \
  psql -U fitbit_user -d fitbit_data \
    -c "SELECT timestamp, metric_type, value FROM raw_data ORDER BY timestamp DESC LIMIT 5;"
```

You can change `5` to other quantity depend on how many data points you want

5) **Clean up command**
```
docker-compose down -v
```
## File Structure
```
SnyderlabChal/
├── ingestion/                      # Ingestion service
│   ├── cron_jobs                   # Cron schedule (runs ingest.py daily at 1 AM PDT)
│   ├── Dockerfile                  # Builds the Python+cron container
│   ├── ingest.py                   # Main ingestion script (delta-load logic)
│   ├── last_run.txt                # Tracks the timestamp of the last successful run
│   └── requirements.txt            # Python dependencies (requests, psycopg2, wearipedia, etc.)
│
├── timescaledb/                    # TimescaleDB service initialization
│   ├── data/                       # PostgreSQL data directory (persistent volume)
│   └── docker-entrypoint-initdb.d/ # Initialization scripts
│       └── init.sql                # Creates database, enables TimescaleDB, defines hypertable
│
├── .env.example                    # Template for environment variables (DB_*, SEED)
├── .gitignore                      # Excludes .env, data folders, logs, etc.
├── docker-compose.yml              # Orchestrates both the `timescaledb` and `ingester` services
├── LICENSE                         # Project license (MIT)
└── README.md                       # This documentation
```

## Detail Explaination
🗂️ **`ingestion/`**  
- **`Dockerfile`**: Installs Python 3.11, cron, and tzdata; copies application files and cron definition; runs `cron -f` in the foreground.

- **`cron_jobs`** : Defines the cron schedule (`0 1 * * *`) for `/etc/cron.d/fitbit-cron`, triggering daily ingestion at 1 AM PDT.

- **`ingest.py`**  Implements the delta-load logic:
1. Reads `last_run.txt` (ISO8601 with offset)  
2. Captures current time in local timezone  
3. Fetches synthetic or real Fitbit data  
4. Bulk-inserts into `raw_data` (with `ON CONFLICT` deduplication)  
5. Updates `last_run.txt` to the new timestamp

  - **`last_run.txt`**  Stores the timestamp of the last successful run, enabling true incremental (delta) ingestion.

  - **`requirements.txt`** : Lists Python libraries required by `ingest.py` (e.g., `psycopg2-binary`, `wearipedia`, `python-dotenv`).

🏠 **`timescaledb/`**  
- **`data/`**: Host-mounted directory for PostgreSQL’s data files, ensuring durability across container restarts.

- **`docker-entrypoint-initdb.d/init.sql`**  SQL script executed on the first startup of the TimescaleDB container to:  
1. Create the `fitbit_data` database  
2. Enable the TimescaleDB extension  
3. Define the `raw_data` table and convert it into a hypertable with a composite primary key for idempotency

📁 **Root files**  
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


## Database Schema

- `raw_data` table:
  - Columns: `timestamp TIMESTAMPTZ`, `metric_type TEXT`, `value DOUBLE PRECISION`
  - Primary Key: `(timestamp, metric_type)`
- Converted to a hypertable on `timestamp`
- Unique index on `(timestamp, metric_type)` for idempotency
