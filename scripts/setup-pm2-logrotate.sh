#!/bin/bash
set -euo pipefail

if ! command -v pm2 >/dev/null 2>&1; then
  echo "pm2 is not installed or not in PATH" >&2
  exit 1
fi

pm2 install pm2-logrotate >/dev/null 2>&1 || true
pm2 set pm2-logrotate:max_days 2
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 set pm2-logrotate:retain 2
pm2 set pm2-logrotate:compress true

echo "pm2-logrotate configured to keep only the last 2 days of logs."
