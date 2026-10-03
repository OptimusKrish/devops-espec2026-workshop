# Exercises — Docker (Block 1)

Estimated time: ~60 minutes.

## Task 1 — Run your first container
```bash
cd services/greeting-service
docker build -t greeting-service .
docker run -p 3000:3000 greeting-service
```
In a second terminal:
```bash
curl localhost:3000/greet/YourName
```
**Expected:** JSON greeting with your name. ✅

## Task 2 — Look inside a container
```bash
docker ps                          # get the container id
docker exec -it <id> sh            # shell into it
```
Inside: `ls`, `cat package.json`, then `exit`.

## Task 3 — Compose the whole stack
```bash
docker compose up --build -d
docker compose ps
curl localhost:3001/welcome/Asha
docker compose logs -f portal-service
```
**Expected:** portal answers, and its logs show JSON request lines. ✅

## Task 4 — Explore one failure
```bash
docker compose stop greeting-service
curl localhost:3001/welcome/Asha    # expect 502
docker compose start greeting-service
curl localhost:3001/welcome/Asha    # expect 200 again
```

## Bonus
1. Run `docker images` and note the size of both service images. Why are they small? (`node:20-alpine`, multi-stage build)
2. Tag and inspect: `docker tag greeting-service greeting-service:v1 && docker images`
3. Change the message in `services/greeting-service/index.js`, rebuild with `docker compose up --build -d greeting-service`, and confirm the new text appears.

**Cleanup:** `docker compose down`
