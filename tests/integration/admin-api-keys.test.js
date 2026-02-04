import { describe, it, expect } from 'vitest';
import { request } from '../../test/setup.js';

describe('Admin API keys', () => {
  it('creates an API key', async () => {
    const res = await request
      .post('/admin/api-keys')
      .set('X-Admin-Secret', 'test-admin-secret');

    expect(res.status).toBe(201);
    expect(res.body.apiKey).toBeDefined();
  });

  it('rejects invalid admin secret', async () => {
    const res = await request
      .post('/admin/api-keys')
      .set('X-Admin-Secret', 'wrong');

    expect(res.status).toBe(401);
  });
});
