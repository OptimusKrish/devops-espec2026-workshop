# Exercises — Prometheus · Grafana · Alerting (Block 2)

Estimated time: ~90 minutes. Prerequisite: `docker compose up --build -d` is running.

## Task 1 — Find the metrics
```bash
curl localhost:3000/metrics | head -20
```
**Expected:** text exposition format with `http_requests_total` and `http_request_duration_seconds_*`. ✅

## Task 2 — Prometheus UI
Open http://localhost:9090 → Status → Targets.
- **Expected:** both `greeting-service` and `portal-service` are UP. ✅

Run these queries:
```promql
rate(http_requests_total[1m])
sum(rate(http_requests_total{status=~"5.."}[1m]))
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))
```

## Task 3 — Grafana dashboard
Open http://localhost:3002 → Dashboards → *Workshop Microservices Overview*.
Start the load generator in a spare terminal: `./scripts/load.sh`
**Expected:** request rate panel climbs, pod names appear. ✅

## Task 4 — Watch a failure live
```bash
docker compose stop greeting-service
```
- Portal `/welcome/:name` now returns 502
- "Services UP" drops, 5xx panel rises
```bash
docker compose start greeting-service
```
**Expected:** everything recovers without touching code. ✅

## Task 5 — Alerting
Open http://localhost:9090/alerts.
1. With Alertmanager running (`docker compose ps` shows `alertmanager`), stop greeting-service again:
   ```bash
   docker compose stop greeting-service
   ```
2. Wait ~1 minute → `ServiceDown` flips to **firing**.
3. Open http://localhost:9093 → the same alert appears in Alertmanager.
4. Restore with `docker compose start greeting-service` → alert resolves.

**Expected:** you saw an alert fire and resolve. ✅

## Bonus
1. Run `curl localhost:3000/error` in a loop for a minute — which alert fires? (`HighErrorRate`)
2. Edit `monitoring/alerts.yml` to change a threshold, then `docker compose restart prometheus` and watch the new rule appear.
3. In Grafana, create a panel from scratch using `rate(http_requests_total[1m])`.
