# Full-Day Workshop Agenda — Docker · Kubernetes · CI/CD · Prometheus · Grafana

Target audience: final-year MCA students. Assumes GitHub Codespaces (or one preinstalled local laptop).
Instructor note: **do a full dry run at least a day before** — especially the `helm install` of kube-prometheus-stack.

| Time | Block | What happens | Hands-on? |
|---|---|---|---|
| 09:00–09:20 | Welcome & setup check | Intro to the sandbox, open Codespace, `docker ps` should show nothing but `node --version` works | ✓ |
| 09:20–10:30 | **Docker** | Images vs containers, build, run, logs, exec, compose (4 containers) | ✓ |
| 10:30–10:45 | Break | | |
| 10:45–11:15 | **Monitoring I** | `/metrics` endpoint, Prometheus scrape, PromQL basics in the Prometheus UI | ✓ |
| 11:15–12:15 | **Grafana** | Dashboard walk-through, load generator, kill a service → dashboard spikes | ✓ |
| 12:15–13:15 | Lunch | | |
| 13:15–14:30 | **Kubernetes (kind)** | Create cluster, deploy, pods/services/namespaces, probes, resource limits | ✓ |
| 14:30–14:45 | Break | | |
| 14:45–15:30 | **K8s "wow" moments** | Self-healing (delete a pod), scale to 5, rolling update via env, rollback | ✓ |
| 15:30–16:00 | **Alerting** | Alertmanager demo in compose + PrometheusRule in kind; trigger ServiceDown | ✓ |
| 16:00–17:00 | **CI/CD (GitHub Actions)** | Push–break–fix cycle, watch test fail, fix, watch it pass, GHCR images, Render deploy (optional) | ✓ |
| 17:00–17:20 | Wrap-up | Recap the pipeline, Q&A, cleanup reminders (Codespaces hours, `kind delete cluster`) | |

## Per-block exercise files
- `exercises/01-docker.md`
- `exercises/02-monitoring.md` (Prometheus + Grafana + alerting)
- `exercises/03-kubernetes.md`
- `exercises/04-cicd.md`

## Instructor tips
- Keep `scripts/load.sh` running in a spare terminal during the monitoring and K8s blocks — it makes Grafana/Prometheus alive.
- The deliberate failure endpoint (`/error`) is your friend for alert + dashboard demos.
- If a student is stuck > 5 minutes, pair them up — DevOps is a team sport.
