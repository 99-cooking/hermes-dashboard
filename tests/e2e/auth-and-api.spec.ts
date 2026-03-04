import { expect, test } from '@playwright/test';

test.describe('auth and api gate', () => {
  test('blocks protected api without authentication', async ({ request }) => {
    const res = await request.get('/api/overview');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  test('allows protected api after login', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: {
        username: 'admin_e2e',
        password: 'super-secure-pass',
      },
    });
    expect(login.status()).toBe(200);
    const sessionCookie = login.headers()['set-cookie'];
    expect(sessionCookie).toContain('hermes-session=');

    const res = await request.get('/api/overview', {
      headers: { cookie: sessionCookie },
    });
    expect(res.status()).toBe(200);
    const payload = await res.json();
    expect(payload).toHaveProperty('stats');
  });
});
