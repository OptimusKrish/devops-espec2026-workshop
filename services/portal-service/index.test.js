const request = require('supertest');
const app = require('./index');

describe('portal-service', () => {
  afterEach(() => jest.restoreAllMocks());

  it('GET /welcome/:name combines the upstream greeting', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ message: 'Hello, Asha!', pod: 'g-1' }) });
    const res = await request(app).get('/welcome/Asha');
    expect(res.statusCode).toBe(200);
    expect(res.body.greeting).toBe('Hello, Asha!');
  });
  it('returns 502 when greeting-service is down', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('connection refused'));
    const res = await request(app).get('/welcome/Asha');
    expect(res.statusCode).toBe(502);
  });
  it('GET /health returns UP', async () => {
    const res = await request(app).get('/health');
    expect(res.body.status).toBe('UP');
  });
});
