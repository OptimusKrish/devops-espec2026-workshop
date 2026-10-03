# DevOps Tools Cheat Sheet
Simple concepts, one-line analogies, and real examples using the
`greeting-service` / `portal-service` sandbox.

---

## Docker

| Concept | What it is, simply | Example |
|---|---|---|
| **Image** | A frozen blueprint — your app + everything it needs, packaged once | `docker build -t greeting-service .` |
| **Container** | A running copy of an image — like opening an app from that blueprint | `docker run -p 3000:3000 greeting-service` |
| **Dockerfile** | The recipe used to bake the image | `FROM node:20-alpine` → copy code → `CMD ["node","index.js"]` |
| **Registry** | A shared shelf where images are stored so any machine can grab one | `docker push ghcr.io/krish/greeting-service:latest` |
| **Tag** | A label/version on an image (so `:latest` and `:v2` can coexist) | `docker tag greeting-service greeting-service:v2` |

**One-liner:** *"It works on my machine" stops being an excuse once the machine's relevant parts ship inside the container with the code.*

**Everyday commands:**
```
docker ps                 # what's running right now
docker logs -f <id>       # watch a container's logs live
docker exec -it <id> sh   # get a shell inside a running container
docker images             # what blueprints do I have locally
```

---

## Kubernetes

**One-liner:** *Docker runs one container. Kubernetes is the manager that runs hundreds of them across many machines — restarting crashed ones, spreading load, and rolling out updates without you touching a server.*

| Concept | Analogy | What it is | Example |
|---|---|---|---|
| **Namespace** | A labelled drawer in a shared filing cabinet | Isolates a group of resources (e.g. `workshop`) from everything else in the cluster | `kubectl create namespace workshop` |
| **Pod** | One food stall | The smallest deployable unit — one (or a few) containers running together | `kubectl get pods -n workshop` |
| **Deployment** | The stall manager who guarantees "N stalls are always open" | Declares *how many* replicas of a Pod should exist; Kubernetes keeps that promise even if one dies | `kubectl scale deployment/greeting-service --replicas=3` |
| **Service** | The signboard customers follow, not caring which stall answers | A stable network name that load-balances traffic across all healthy Pods of a Deployment | `greeting-service` (port 80) → routes to any healthy Pod on port 3000 |

**Minimal Deployment + Service (what's really in `k8s/10-greeting-service.yaml`):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: greeting-service
  namespace: workshop
spec:
  replicas: 2
  selector:
    matchLabels: { app: greeting-service }
  template:
    metadata:
      labels: { app: greeting-service }
    spec:
      containers:
        - name: greeting-service
          image: greeting-service:local
          ports: [{ containerPort: 3000 }]
---
apiVersion: v1
kind: Service
metadata:
  name: greeting-service
  namespace: workshop
spec:
  selector: { app: greeting-service }
  ports: [{ port: 80, targetPort: 3000 }]
```

**Everyday commands:**
```
kubectl get pods -n workshop                     # list Pods
kubectl logs deployment/greeting-service -n workshop   # check logs
kubectl describe pod <pod> -n workshop           # why won't it start?
kubectl delete pod <pod> -n workshop             # kill one on purpose — watch it self-heal
kubectl rollout status deployment/greeting-service -n workshop  # watch a rollout
kubectl rollout undo deployment/greeting-service -n workshop    # rollback
```

---

## Prometheus

**One-liner:** *A Pod being "Running" doesn't mean the app inside is healthy. Prometheus is the stopwatch and counter that tells you how the app is actually performing.*

| Concept | What it is | Example |
|---|---|---|
| **/metrics endpoint** | A page your app exposes with numbers (request counts, latency) in a format Prometheus understands | `GET /metrics` on `greeting-service` → `http_requests_total{method="GET",status="200"} 42` |
| **Scrape** | Prometheus visiting `/metrics` every few seconds and storing what it sees over time | `scrape_configs: [{ job_name: greeting-service, targets: ["greeting-service:3000"] }]` |
| **Query (PromQL)** | Asking the stored data a question | `rate(http_requests_total[1m])` → requests per second over the last minute |

**Why it matters:** this is the raw data layer — Grafana (below) is just a prettier window onto it.

---

## Grafana

**One-liner:** *Prometheus stores the numbers; Grafana turns them into a dashboard you can actually look at.*

| Concept | What it is | Example |
|---|---|---|
| **Data source** | Where Grafana pulls numbers from | Prometheus, pointed at `http://prometheus:9090` |
| **Panel** | One chart on a dashboard | "Request rate (req/s)" panel, built from a PromQL query |
| **Dashboard** | A page of panels | `workshop-overview.json` → Services UP, request rate, p95 latency, 5xx errors |
| **Alert** | A rule that notifies someone when a panel crosses a threshold | `monitoring/alerts.yml` → `ServiceDown` fires when a service stops being scraped |

**Live demo pattern:** generate traffic → watch the "Request rate" panel climb → stop one service → watch "Services UP" drop and the error panel spike → restart it → watch it recover. That loop is the whole pitch for monitoring in one minute.

---

## GitHub Actions

**One-liner:** *A robot that watches your repo and automatically tests, builds, and ships your code every time you push — so a human doesn't have to remember to do it.*

| Concept | What it is | Example |
|---|---|---|
| **Workflow** | The whole automated process, defined in one YAML file | `.github/workflows/ci-cd.yml` |
| **Trigger (`on:`)** | The event that wakes the workflow up | `on: push: branches: [main]` |
| **Job** | A group of steps that run together on one fresh virtual machine | `test`, `build-and-push` |
| **Step** | One command, or a reusable pre-built Action | `uses: actions/checkout@v4`, `run: npm test` |
| **Secret** | An encrypted value a workflow can use without exposing it in logs | `secrets.GITHUB_TOKEN` (auto-provided, no setup needed) |

**Minimal CI job (what's really in the sandbox's `ci-cd.yml`):**
```yaml
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
```

**The full chain, end to end:**
```
git push  →  test job runs  →  (if green) build Docker image
          →  push image to GitHub Container Registry
          →  (optional) deploy to Kubernetes or a free host
```

---

## How They All Fit Together

```
 You push code
      │
      ▼
 GitHub Actions  ──runs tests, builds image──►  Container Registry (GHCR)
      │                                                │
      │                                                ▼
      └────────────────────────────────►  Kubernetes pulls the image
                                                        │
                                          Pods run inside a Deployment,
                                          reached via a Service
                                                        │
                                                        ▼
                                          App exposes /metrics
                                                        │
                                                        ▼
                                          Prometheus scrapes it
                                                        │
                                                        ▼
                                          Grafana shows you the dashboard
```

One push → tested, containerized, orchestrated, and observable — with no manual step in between.
