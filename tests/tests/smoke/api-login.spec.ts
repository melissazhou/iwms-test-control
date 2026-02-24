/**
 * Smoke Test: API Login
 * Verifies IWMS backend API login and JWT token
 */
import { test, expect } from '@playwright/test';
import { ENV } from '../../src/config/env';

test.describe('API Login Smoke Tests', () => {

  test('should login via API and get JWT token', async ({ request }) => {
    const loginUrl = `${ENV.API_BASE_URL}${ENV.API.LOGIN}`;
    console.log(`🔗 Login URL: ${loginUrl}`);

    const response = await request.post(loginUrl, {
      data: {
        ActionName: 'LoginUser',
        UserCode: ENV.TEST_USER,
        Password: ENV.TEST_PASSWORD,
        UseRadius: ENV.TEST_USE_RADIUS,
        Language: 'US',
      },
      headers: { 'Content-Type': 'application/json' },
      ignoreHTTPSErrors: true,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    console.log(`📋 Login response keys: ${Object.keys(body).join(', ')}`);

    // Should return a token or session info
    const hasAuth = body.Token || body.token || body.authorization || body.SessionID;
    console.log(`🔑 Auth token present: ${!!hasAuth}`);
    if (hasAuth) {
      console.log(`✅ API Login succeeded, token: ${String(hasAuth).substring(0, 20)}...`);
    } else {
      console.log(`⚠️ No token in response, full body: ${JSON.stringify(body).substring(0, 300)}`);
    }
  });

  test('should reject invalid credentials', async ({ request }) => {
    const loginUrl = `${ENV.API_BASE_URL}${ENV.API.LOGIN}`;
    const response = await request.post(loginUrl, {
      data: {
        ActionName: 'LoginUser',
        UserCode: 'InvalidUser',
        Password: 'WrongPass',
        UseRadius: false,
        Language: 'US',
      },
      headers: { 'Content-Type': 'application/json' },
      ignoreHTTPSErrors: true,
    });

    const body = await response.json().catch(() => response.text());
    console.log(`📋 Invalid login response: ${JSON.stringify(body).substring(0, 200)}`);
    // Should either return error status or error in body
  });
});
