const request = require('supertest');
const app = require('./index');

describe('greeting-service', () => {
  it('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.service).toBe('greeting-service');
  });
  it('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('UP');
  });
  it('GET /greet/:name greets the caller', async () => {
    const res = await request(app).get('/greet/EGSPEC');
    expect(res.body.message).toContain('EGSPEC');
  });
  it('GET /error returns 500', async () => {
    const res = await request(app).get('/error');
    expect(res.statusCode).toBe(500);
  });
  it('GET /metrics exposes Prometheus metrics', async () => {
    await request(app).get('/health');
    const res = await request(app).get('/metrics');
    expect(res.text).toContain('http_requests_total');
  });
});
