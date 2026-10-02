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
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('GET /greet/:name returns a personalized greeting', async () => {
    const res = await request(app).get('/greet/EGSPEC');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('EGSPEC');
  });
});
