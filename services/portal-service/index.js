const express = require('express');
const os = require('os');
const client = require('prom-client');

const SERVICE = 'portal-service';
const PORT = process.env.PORT || 3000;

// ---- Observability: Prometheus metrics + structured JSON logs ----
client.register.setDefaultLabels({ service: SERVICE });
client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
});

function log(level, msg, extra = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, service: SERVICE, pod: os.hostname(), msg, ...extra }));
}

function observe(req, res, next) {
  const stop = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.route ? req.route.path : 'unmatched', status: res.statusCode };
    httpRequests.inc(labels);
    stop(labels);
    log(res.statusCode >= 500 ? 'error' : 'info', 'request', { method: req.method, path: req.originalUrl, status: res.statusCode });
  });
  next();
}

const app = express();
app.use(observe);

app.get('/health', (req, res) => res.status(200).json({ status: 'Portal Service is UP' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ---- Business API: calls ANOTHER microservice over HTTP ----
const GREETING_URL = process.env.GREETING_URL || 'http://localhost:3000';

app.get('/welcome/:name', async (req, res) => {
  try {
    const r = await fetch(`${GREETING_URL}/greet/${encodeURIComponent(req.params.name)}`);
    if (!r.ok) throw new Error(`greeting-service returned ${r.status}`);
    const data = await r.json();
    res.json({ portal: 'portal-service', greeting: data.message, servedByPod: os.hostname(), greetingPod: data.pod });
  } catch (err) {
    log('error', 'upstream call failed', { error: err.message });
    res.status(502).json({ error: 'greeting-service unavailable' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => log('info', `listening on port ${PORT}, upstream=${GREETING_URL}`));
}
module.exports = app;
