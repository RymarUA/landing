/**
 * scripts/outbox-cron.sh
 *
 * Cron job script for running the outbox worker.
 * 
 * Setup:
 * 1. Make executable: chmod +x scripts/outbox-cron.sh
 * 2. Add to crontab: */5 * * * * /path/to/project/scripts/outbox-cron.sh
 * 
 * This script runs the outbox worker every 5 minutes and logs the results.
 */

#!/bin/bash

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_FILE="$PROJECT_DIR/logs/outbox-cron.log"
WORKER_URL="http://localhost:3000/api/outbox/worker"
ADMIN_WEBHOOK_URL="${ADMIN_WEBHOOK_URL:-}"  # Optional: for alerts

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
    local message="$1"
    if [[ -n "$ADMIN_WEBHOOK_URL" ]]; then
        curl -s -X POST "$ADMIN_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"🤖 Outbox Cron Alert: $message\"}" \
            > /dev/null 2>&1
    fi
}

# Main execution
log "Starting outbox worker cron job"

# Check if the application is running
if ! curl -s "$WORKER_URL?stats=true" > /dev/null 2>&1; then
    log "ERROR: Application is not running or worker endpoint not accessible"
    send_alert "Application is not running at $WORKER_URL"
    exit 1
fi

# Run the worker
response=$(curl -s -X GET "$WORKER_URL" 2>/dev/null)
curl_exit_code=$?

if [[ $curl_exit_code -ne 0 ]]; then
    log "ERROR: Failed to call worker endpoint (curl exit code: $curl_exit_code)"
    send_alert "Failed to call worker endpoint"
    exit 1
fi

# Parse response
success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d '"' | tr -d ' ')

if [[ "$success" == "true" ]]; then
    processed=$(echo "$response" | grep -o '"processed":[^,]*' | cut -d':' -f2 | tr -d '"' | tr -d ' ')
    failed=$(echo "$response" | grep -o '"failed":[^,]*' | cut -d':' -f2 | tr -d '"' | tr -d ' ')
    pending=$(echo "$response" | grep -o '"pending":[^,]*' | cut -d':' -f2 | tr -d '"' | tr -d ' ')
    dead_letter=$(echo "$response" | grep -o '"deadLetter":[^,]*' | cut -d':' -f2 | tr -d '"' | tr -d ' ')
    
    log "SUCCESS: Processed=$processed, Failed=$failed, Pending=$pending, DeadLetter=$dead_letter"
    
    # Alert if too many failed items
    if [[ "$failed" -gt 5 ]]; then
        send_alert "High failure rate: $failed items failed processing"
    fi
    
    # Alert if dead letter queue is growing
    if [[ "$dead_letter" -gt 10 ]]; then
        send_alert "Dead letter queue is large: $dead_letter items"
    fi
    
else
    error_msg=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    log "ERROR: Worker failed - $error_msg"
    send_alert "Worker failed: $error_msg"
    exit 1
fi

log "Outbox worker cron job completed successfully"

# Cleanup old logs (keep last 7 days)
find "$(dirname "$LOG_FILE")" -name "outbox-cron.log*" -mtime +7 -delete 2>/dev/null || true
