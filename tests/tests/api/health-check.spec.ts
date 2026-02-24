/**
 * API & Environment Health Check Tests
 * @tags @smoke @api
 */
import { test, expect } from '../../src/fixtures/base';
import { IWMSApiClient } from '../../src/utils/api-client';
import { ENV } from '../../src/config/env';

test.describe('Environment Health @smoke @api', () => {
  test('Web login page reachable', async ({ page }) => {
    const response = await page.goto(ENV.WEB_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
  });

  test('RF login page reachable', async ({ page }) => {
    const response = await page.goto(ENV.RF_LOGIN_URL, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(500);
  });

  test('API endpoint responds', async ({ apiClient }) => {
    // Test common endpoint
    const result = await apiClient.commonAction('Ping', {}).catch(e => ({ error: e.message }));
    console.log('API ping result:', JSON.stringify(result).substring(0, 200));
  });
});

test.describe('API Authentication @api', () => {
  test('Login via API with test user', async ({ apiClient }) => {
    const result = await apiClient.login(ENV.TEST_USER, ENV.TEST_PASSWORD, false);
    console.log('Login result:', JSON.stringify(result).substring(0, 200));
  });
});

test.describe('API Data Queries @api', () => {
  test('Query items', async ({ apiClient }) => {
    const result = await apiClient.getItems('AND');
    console.log('Items query result:', JSON.stringify(result).substring(0, 300));
  });

  test('Query subinventories', async ({ apiClient }) => {
    const result = await apiClient.getSubInventories('AND');
    console.log('SubInv result:', JSON.stringify(result).substring(0, 300));
  });

  test('Query onhand', async ({ apiClient }) => {
    const result = await apiClient.getOnhand('*', 'AND');
    console.log('Onhand result:', JSON.stringify(result).substring(0, 300));
  });

  test('Query open documents', async ({ apiClient }) => {
    const soResult = await apiClient.queryDocs('SO', 'OPEN', 'AND');
    console.log('Open SOs:', JSON.stringify(soResult).substring(0, 300));

    const poResult = await apiClient.queryDocs('PO', 'OPEN', 'AND');
    console.log('Open POs:', JSON.stringify(poResult).substring(0, 300));
  });
});
