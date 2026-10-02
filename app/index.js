const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory "microservice" — a Greeting Service
app.get('/', (req, res) => {
  res.json({
    service: 'greeting-service',
    message: 'Hello from your first microservice!',
    version: process.env.APP_VERSION || 'dev',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint — every microservice needs one (used by
// load balancers, container orchestrators, and uptime monitors)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.get('/greet/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}! Welcome to DevOps.` });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`greeting-service listening on port ${PORT}`));
}

module.exports = app;
