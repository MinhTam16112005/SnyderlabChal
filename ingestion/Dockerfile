FROM python:3.11-slim

# Install cron and dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y cron tzdata && \
    # configure the container to use US Pacific time
    ln -fs /usr/share/zoneinfo/America/Los_Angeles /etc/localtime && \
    echo "America/Los_Angeles" > /etc/timezone && \
    dpkg-reconfigure --frontend noninteractive tzdata && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY ingest.py .
COPY last_run.txt .
COPY cron_jobs /etc/cron.d/fitbit-cron

# Set cron permissions
RUN chmod 0644 /etc/cron.d/fitbit-cron && \
    crontab /etc/cron.d/fitbit-cron

# Create log file
RUN touch /var/log/cron.log

# Start cron in foreground
CMD ["cron", "-f"]