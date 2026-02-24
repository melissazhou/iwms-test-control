/**
 * Base test fixtures - extends Playwright test with IWMS-specific utilities
 */
import { test as base, expect, Page } from '@playwright/test';
import { WebLoginPage } from '../pages/web/WebLoginPage';
import { WebMainPage } from '../pages/web/WebMainPage';
import { RFLoginPage } from '../pages/rf/RFLoginPage';
import { RFMainPage } from '../pages/rf/RFMainPage';
import { IWMSApiClient } from '../utils/api-client';
import { ENV } from '../config/env';
import * as db from '../utils/db';

// Extend test with custom fixtures
export const test = base.extend<{
  webLogin: WebLoginPage;
  webMain: WebMainPage;
  rfLogin: RFLoginPage;
  rfMain: RFMainPage;
  apiClient: IWMSApiClient;
  testOrg: string;
}>({
  webLogin: async ({ page }, use) => {
    await use(new WebLoginPage(page));
  },

  webMain: async ({ page }, use) => {
    await use(new WebMainPage(page));
  },

  rfLogin: async ({ page }, use) => {
    await use(new RFLoginPage(page));
  },

  rfMain: async ({ page }, use) => {
    await use(new RFMainPage(page));
  },

  apiClient: async ({}, use) => {
    const client = new IWMSApiClient();
    await client.init();
    await use(client);
    await client.dispose();
  },

  testOrg: async ({}, use) => {
    await use(ENV.DEFAULT_ORG);
  },
});

export { expect };

/**
 * Test tags for filtering
 * Usage: test('my test @smoke @so', ...)
 */
export const Tags = {
  SMOKE: '@smoke',
  SO: '@so',
  PO: '@po',
  WO: '@wo',
  INVENTORY: '@inventory',
  WEB: '@web',
  RF: '@rf',
  AND: '@AND',
  DDR: '@DDR',
  E2E: '@e2e',
  API: '@api',
} as const;
