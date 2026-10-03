# Exercises — Kubernetes with kind (Block 3)

Estimated time: ~75 minutes.

## Task 1 — Create a cluster and deploy
```bash
kind create cluster --name workshop
docker build -t greeting-service:local services/greeting-service
docker build -t portal-service:local  services/portal-service
kind load docker-image greeting-service:local portal-service:local --name workshop
kubectl apply -f k8s/
kubectl -n workshop get pods -o wide
```
**Expected:** 4 pods (2 greeting + 2 portal), STATUS `Running`. ✅

## Task 2 — List and inspect
```bash
kubectl -n workshop get deploy,svc
kubectl -n workshop logs deployment/portal-service
kubectl -n workshop describe pod <one-pod>
```
**Expected:** you can find the ports, labels, and readiness probes in the describe output. ✅

## Task 3 — Call the API
```bash
kubectl -n workshop port-forward svc/portal-service 3001:80 &
curl localhost:3001/welcome/Asha
```

## Task 4 — Load balancing in action
```bash
kubectl -n workshop run curl --rm -it --restart=Never --image=curlimages/curl -- \
  sh -c 'for i in 1 2 3 4 5 6; do curl -s greeting-service; echo; done'
```
**Expected:** the `"pod"` value changes between replies. ✅

## Task 5 — The four "wow" moments
```bash
# 1. Self-healing
kubectl -n workshop delete pod <one-greeting-pod>
kubectl -n workshop get pods -w        # a replacement appears, then Ctrl+C

# 2. Scaling
kubectl -n workshop scale deployment/greeting-service --replicas=5
kubectl -n workshop get pods

# 3. Rolling update (env change triggers it — no rebuild)
kubectl -n workshop set env deployment/greeting-service APP_VERSION=v2
kubectl -n workshop rollout status deployment/greeting-service
curl localhost:3000/                     # version now "v2" (via port-forward, re-run it)

# 4. Rollback
kubectl -n workshop rollout undo deployment/greeting-service
```

## Task 6 — Alerting on Kubernetes
```bash
kubectl apply -f monitoring/servicemonitor.yaml
kubectl apply -f monitoring/prometheusrule.yaml
kubectl -n monitoring port-forward svc/monitoring-kube-prometheus-alertmanager 9093:9093 &
kubectl -n workshop scale deployment/greeting-service --replicas=0
```
**Expected:** within ~1 minute `ServiceDown` fires in the Alertmanager UI. ✅
Then `scale --replicas=2` and watch it resolve.

## Bonus
1. Edit `k8s/10-greeting-service.yaml` service port from 80 → 8080, apply, and explain why `port-forward svc/greeting-service 3000:80` now breaks.
2. Set a resource limit too low (`memory: 8Mi`) and watch `describe pod` show `OOMKilled`.
3. `kubectl get events -n workshop --sort-by=.lastTimestamp | tail` — read Kubernetes' own diary.

**Cleanup:** `kind delete cluster --name workshop`
