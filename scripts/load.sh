#!/usr/bin/env bash
# Generates traffic (with the occasional error) so Grafana has something to draw.
# Compose: defaults work. Kubernetes: port-forward greeting->3000 and portal->3001 first.
PORTAL=${1:-http://localhost:3001}
GREETING=${2:-http://localhost:3000}
echo "Sending traffic to $PORTAL (Ctrl+C to stop)"
while true; do
  curl -s "$PORTAL/welcome/student$((RANDOM % 10))" > /dev/null
  [ $((RANDOM % 8)) -eq 0 ] && curl -s "$GREETING/error" > /dev/null
  sleep 0.2
done
