# Exercises — CI/CD with GitHub Actions (Block 4)

Estimated time: ~60 minutes.

## Task 1 — Push your code
1. Create a new GitHub repo and push this folder.
2. Settings → Actions → General → Workflow permissions → **Read and write**.
3. Push a commit → watch the Actions tab → all three jobs should go green in a few minutes.

**Expected:** `test` → `k8s-smoke-test` → `build-and-push` all green; Packages tab shows both images. ✅

## Task 2 — Push–break–fix
1. In `services/greeting-service/index.test.js`, change the expected message text.
2. Commit and push → the `test` job goes **red**. `k8s-smoke-test` and `build-and-push` are skipped (they need green tests).
3. Fix the text, push again → **green**.

**Expected:** you have felt the CI safety net. ✅

## Task 3 — Add a new endpoint with CI guarding it (bonus)
1. Add `app.get('/time', ...)` to greeting-service returning the current time.
2. Add a matching test asserting `res.json().time` exists.
3. Push — green run means your new code is tested, imaged, and published.

## Task 4 — Deploy free (optional)
Render → New Web Service → connect repo → Root Directory `services/greeting-service` → it detects the Dockerfile → live URL.

## Discussion questions
1. Why does `build-and-push` only run on `main` and not on PRs?
2. What would happen if `secrets.GITHUB_TOKEN` lost `packages: write`?
3. Where in the workflow would you add a security scan (e.g. Trivy)?
