# DIY Activity Cards — DevOps & Microservices Workshop

Short, self-paced challenges for the two hands-on labs. **Core** = every
student/team should try these. **Stretch** = for anyone finished early
or wanting more. Each card lists a time estimate and a clear "success
check" so students know when they're done without waiting for you.

Print these as a handout, or project the relevant block at the start of
each lab.

---

## Lab 1 — Docker (2:00–2:45)

### Core

**1. Change the Greeting** — 5 min
- Edit the message returned by `GET /greet/:name` in
  `services/greeting-service/index.js`.
- Rebuild: `docker compose up --build -d`.
- ✅ Success check: your new wording shows up at
  `localhost:3001/welcome/<yourname>`.

**2. Find the Secret** — 5 min, no coding
- Open `.github/workflows/ci-cd.yml` and find `secrets.GITHUB_TOKEN`.
- ✅ Success check: you can explain in one sentence why nobody had to
  type a password anywhere for this to work.

**3. Add a New Route** — 10 min
- Add `GET /roll` to `greeting-service` that returns a random number
  from 1–6, e.g. `{ "roll": 4 }`.
- Test it locally with `curl localhost:3000/roll`.
- ✅ Success check: 5 calls in a row give you believable random values,
  and `docker compose up --build -d` still starts cleanly.

### Stretch

**4. Write a Test for Your New Route** — 10 min
- Add a Jest test in `index.test.js` asserting the `/roll` response is
  between 1 and 6.
- Push to GitHub and watch the Actions tab run it.
- ✅ Success check: temporarily change your route to return `7`, push,
  and watch CI go red — then fix it and watch it go green again.

**5. Break It, Then Read the Logs** — 5 min
- Deliberately throw an error in a route (e.g. `throw new
  Error('oops')` inside `/greet/:name`).
- Run `docker logs -f <container>` and find the stack trace.
- ✅ Success check: you can point to the exact line number the error
  came from, using only the logs.

---

## Lab 2 — Kubernetes & Monitoring (2:45–3:30)

### Core

**1. Spot the Load Balancing** — 5 min
- Call the Service (not a Pod directly) ten times in a row:
  `for i in {1..10}; do curl -s localhost:3000/ | grep pod; done`
  (the response includes the Pod hostname that answered).
- ✅ Success check: you see more than one Pod hostname in the output —
  proof the Service is spreading requests across replicas.

**2. Scale Challenge** — 5 min
- `kubectl scale deployment/greeting-service --replicas=5 -n workshop`
- `kubectl get pods -n workshop`
- ✅ Success check: 5 Pods show `Running`, and re-running Activity 1
  now shows even more distinct hostnames.

**3. Kill It and Watch It Heal** — 5 min
- Pick a Pod name from `kubectl get pods -n workshop`.
- `kubectl delete pod <name> -n workshop`
- Immediately run `kubectl get pods -n workshop -w`.
- ✅ Success check: you can say, within a few seconds, how long it took
  for a replacement Pod to appear and reach `Running`.

### Stretch

**4. Cause an Error Spike on the Dashboard** — 10 min
- Hit the sandbox's `/error` route in a loop for ~20 seconds while
  Grafana is open:
  `for i in {1..40}; do curl -s localhost:3000/error > /dev/null; done`
- ✅ Success check: describe in one sentence what you saw move on the
  Grafana dashboard while the loop ran.

**5. Create Your Own Namespace** — 10 min
- `kubectl create namespace <yourname>`
- `kubectl apply -f k8s/ -n <yourname>`
- ✅ Success check: `kubectl get pods -n <yourname>` shows your own
  independent copy, untouched by anything happening in the shared
  `workshop` namespace.

**6. Rollback Drill** — 10 min
- `kubectl set env deployment/greeting-service APP_VERSION=broken -n workshop`
- `kubectl rollout undo deployment/greeting-service -n workshop`
- ✅ Success check: you can explain what `rollout undo` actually did,
  in one sentence, without looking it up again.

---

## Bonus Group Activity — "Diagnose the Incident" (facilitator-led, ~5 min)

Best run just before the 3:30 recap quiz, if time allows.

1. Without telling students, the facilitator runs:
   `kubectl scale deployment/greeting-service --replicas=0 -n workshop`
2. Teams race to:
   - Notice something's wrong (Grafana "Services UP" panel, or a failed
     `curl`)
   - Use `kubectl get pods -n workshop` to confirm zero Pods are running
   - Fix it: `kubectl scale deployment/greeting-service --replicas=2 -n workshop`
3. First team to correctly explain *what happened and why* wins.

This is a fast, no-prep way to prove the whole day's toolkit — Docker,
Kubernetes, and monitoring — works together as one system, not three
separate topics.
