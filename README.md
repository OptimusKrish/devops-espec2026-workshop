# DevOps Workshop Sandbox — Docker · Kubernetes · CI/CD · Prometheus/Grafana

Two tiny Node.js microservices that talk to each other over REST:

```
client ──► portal-service (:3001) ──HTTP──► greeting-service (:3000)
                 │                                  │
                 └──── /metrics + JSON logs ────────┘──► Prometheus ──► Grafana
```

| Path | What it is |
|---|---|
| `services/greeting-service` | Provider API: `/`, `/greet/:name`, `/health`, `/error` (fails on purpose), `/metrics` |
| `services/portal-service` | Consumer API: `/welcome/:name` calls greeting-service; returns 502 if it is down |
| `docker-compose.yml` | Both services + Prometheus + Grafana on one machine |
| `k8s/` | Namespace, Deployments (2 replicas, probes, resource limits), Services |
| `monitoring/` | Prometheus config, Grafana dashboard, ServiceMonitor for Kubernetes |
| `.github/workflows/ci-cd.yml` | Test → deploy-to-kind smoke test → push images to GHCR |
| `.devcontainer/` | GitHub Codespaces setup: Docker, kubectl, helm, kind, Node preinstalled |
| `scripts/load.sh` | Traffic generator for the Grafana demo |
| `render.yaml` | Optional Render Blueprint — one-click deploy of both services |
| `AGENDA.md` | Full-day session plan with timings |
| `exercises/` | Hands-on tasks per block (Docker, monitoring, K8s, CI/CD) |
| `monitoring/alerts.yml` + `alertmanager.yml` | Alerting rules + Alertmanager config for the compose demo |

## 0. Where to run it (pick ONE for the workshop)
- **Recommended: GitHub Codespaces.** Open the repo → Code → Codespaces → Create. Everything is preinstalled, so student laptop specs don't matter. Check the current free monthly allowance shortly before the session.
- **Local laptop:** Docker Desktop + `kubectl` + `kind` + `helm` + Node 20.

> Confirmed working end to end locally and on GitHub Codespaces (free tier). The Render.com section below has not yet been dry-run — do that at least a day before the workshop, same as everything else here.

## 1. Docker (Content 2)
```bash
docker compose up --build -d          # build images, start 4 containers
docker ps                              # list running containers
curl localhost:3001/welcome/Asha       # portal -> greeting, across containers
docker logs -f <container>             # follow logs
docker exec -it <container> sh         # shell inside a container
docker images                          # list images
docker compose down                    # stop and remove
```
Images and registries: `docker tag`, `docker push ghcr.io/<owner>/greeting-service:latest` (the pipeline does this for you).

## 2. Monitoring with compose (students do this hands-on)
```bash
./scripts/load.sh                      # leave running in a second terminal
```
- Prometheus: http://localhost:9090 → Status → Targets (both UP). Try `rate(http_requests_total[1m])`.
- Grafana: http://localhost:3002 → Dashboards → *Workshop Microservices Overview* (no login; demo only).
- Show a failure: `docker compose stop greeting-service` → portal returns 502, "Services UP" drops, 5xx panel rises. Then `docker compose start greeting-service`.
- **Alerting:** with the stack running, `docker compose stop greeting-service`, wait ~1 min → `ServiceDown` fires at Prometheus → Alerts (:9090/alerts) and Alertmanager (:9093). Start it again and the alert resolves.

## 3. Kubernetes with kind (Content 3 + 4)
```bash
kind create cluster --name workshop
docker build -t greeting-service:local services/greeting-service
docker build -t portal-service:local  services/portal-service
kind load docker-image greeting-service:local portal-service:local --name workshop
kubectl apply -f k8s/

kubectl get nodes
kubectl -n workshop get pods -o wide                 # LIST PODS
kubectl -n workshop get deploy,svc
kubectl -n workshop logs deployment/portal-service   # CHECK LOGS
kubectl -n workshop logs -f <pod-name>               # follow one pod
kubectl -n workshop describe pod <pod-name>          # events: why won't it start?
```
Call the API:
```bash
kubectl -n workshop port-forward svc/greeting-service 3000:80 &
kubectl -n workshop port-forward svc/portal-service   3001:80 &
curl localhost:3001/welcome/Asha
```
**Load balancing across pods** (port-forward pins to one pod, so call from inside the cluster):
```bash
kubectl -n workshop run curl --rm -it --restart=Never --image=curlimages/curl -- \
  sh -c 'for i in 1 2 3 4 5 6; do curl -s greeting-service; echo; done'   # "pod" value changes
```
**Four Kubernetes "wow" moments:**
```bash
# 1. Self-healing: delete a pod, watch a replacement appear
kubectl -n workshop delete pod <one-greeting-pod>; kubectl -n workshop get pods -w
# 2. Scaling
kubectl -n workshop scale deployment/greeting-service --replicas=5
# 3. Rolling update, zero downtime (an env change triggers a rollout, no rebuild needed)
kubectl -n workshop set env deployment/greeting-service APP_VERSION=v2
kubectl -n workshop rollout status deployment/greeting-service
# 4. Rollback
kubectl -n workshop rollout undo deployment/greeting-service
```
Clean up: `kind delete cluster --name workshop`.

## 4. Prometheus + Grafana on Kubernetes (instructor demo)
Heavy install (several minutes, ~2 GB RAM, many image pulls). **Install it the night before**; students watch, and do section 2 hands-on.
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
kubectl -n monitoring get pods                        # wait until Running
kubectl apply -f monitoring/servicemonitor.yaml       # "scrape our services"
kubectl apply -f monitoring/prometheusrule.yaml       # alert rules for the cluster demo

# load our dashboard into Grafana (its sidecar watches for this label)
kubectl -n monitoring create configmap workshop-dashboard \
  --from-file=monitoring/grafana/dashboards/workshop-overview.json
kubectl -n monitoring label configmap workshop-dashboard grafana_dashboard=1

kubectl -n monitoring port-forward svc/monitoring-grafana 3002:80 &     # login: admin / prom-operator
kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-prometheus 9090:9090 &
kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-alertmanager 9093:9093 &   # fired alerts land here
./scripts/load.sh        # needs the two service port-forwards from section 3
```
Then delete pods and scale replicas while Grafana is on screen.

## 5. CI/CD with GitHub Actions
1. Push this folder to your own GitHub repo. Settings → Actions → General → Workflow permissions → *Read and write*.
2. Every push runs: `test` (both services in parallel) → `k8s-smoke-test` (throw-away kind cluster, deploys and calls the API) → `build-and-push` (images to `ghcr.io/<owner>/…`, only on `main` and only if the earlier jobs passed).
3. **Push–break–fix:** edit a test in `services/greeting-service/index.test.js`, push, show the red run, fix, push, show green. Then open the repo's **Packages** tab.
4. (Optional, commented out) the `deploy` job in `ci-cd.yml` can also trigger a Render deploy hook automatically from Actions — see section 6.

## 6. Auto-Deploy on Render.com

Both services already have a working `Dockerfile` (`services/greeting-service/Dockerfile`, `services/portal-service/Dockerfile`) — Render builds straight from these, no extra file needed. This section is the live "push code, watch it deploy itself" demo.

### Deploy both services (no YAML, easiest to narrate live)
1. [render.com](https://render.com) → sign up free → **New +** → **Web Service** → connect your GitHub repo.
2. First service: name it `greeting-service`, set **Root Directory** to `services/greeting-service`. Render detects the `Dockerfile` automatically — leave build/start commands blank. **Health Check Path**: `/health`. Plan: **Free**. Create.
3. Wait for the first build (a few minutes), then open the assigned URL (e.g. `https://greeting-service.onrender.com`) and confirm `/greet/EGSPEC` responds.
4. Second service: repeat with **Root Directory** `services/portal-service`, name `portal-service`, **Health Check Path** `/health`. Before deploying, add an environment variable: `GREETING_URL` = the greeting-service URL from step 3. Create.
5. Confirm `https://portal-service.onrender.com/welcome/EGSPEC` returns a response that includes `greetingPod` — proof it really called the other live service over the internet.

### One-click alternative
`render.yaml` at the repo root is a Render **Blueprint** that defines both services at once: **New +** → **Blueprint** → connect the repo → Apply. Update `portal-service`'s `GREETING_URL` env var in the dashboard afterward if the guessed URL in the file doesn't match what Render assigned.

### The actual "auto-deploy" proof (do this live)
1. With both services already deployed, make a trivial visible change — e.g. edit the message string in `services/greeting-service/index.js`.
2. `git push`.
3. Switch to the Render dashboard **before** refreshing the browser tab — show students the new deploy kick off **on its own**, with no one clicking "Deploy."
4. Once it finishes, reload the live URL and show the changed text. This is the whole pitch: *push is the only human action; build, containerize, and deploy are automatic.*

Free-tier notes: free services sleep after 15 minutes of inactivity, so the first request after idle is slow (~30–50s) — mention this to students so it doesn't look broken. Verify current Render free-tier limits shortly before the workshop, as they can change.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Pod `ErrImagePull` / `ImagePullBackOff` | Image not loaded into kind: rerun `kind load docker-image …` |
| `port-forward` "address already in use" | `pkill -f port-forward` |
| Grafana panels empty | Run `scripts/load.sh`; check Prometheus → Targets are UP |
| Actions job can't push to GHCR | Workflow permissions not *Read and write* |
| Codespace out of hours | Fall back to instructor-only demo on the projector |
