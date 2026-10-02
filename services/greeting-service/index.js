const express = require('express');
const os = require('os');
const client = require('prom-client');

const SERVICE = 'greeting-service';
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

app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// ---- Business API ----
app.get('/', (req, res) => {
  res.json({
    service: SERVICE,
    message: 'Hello from your first microservice!',
    version: process.env.APP_VERSION || 'dev',
    pod: os.hostname(), // shows WHICH replica answered (great for the Kubernetes demo)
    timestamp: new Date().toISOString(),
  });
});

app.get('/greet/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! Welcome to DevOps.`, pod: os.hostname() });
});

// Deliberate failure endpoint: produces 5xx for logs/metrics/Grafana demos
app.get('/error', (req, res) => {
  res.status(500).json({ error: 'Simulated failure for the monitoring demo' });
});

if (require.main === module) {
  app.listen(PORT, () => log('info', `listening on port ${PORT}`));
}
module.exports = app;
