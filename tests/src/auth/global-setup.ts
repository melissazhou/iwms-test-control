/**
 * Global auth setup - creates stored auth states for web and RF
 * Run as a Playwright setup project before all tests
 */
import { test as setup, expect } from '@playwright/test';
import { ENV } from '../config/env';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');

// Ensure auth directory exists
setup.beforeAll(async () => {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
});

/**
 * Setup admin web session (with Radius)
 */
setup('authenticate admin web', async ({ page }) => {
  // Navigate to web login
  await page.goto(ENV.WEB_LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});

  // Fill admin credentials
  const userInput = page.locator('#txtUserCode, input[name="UserCode"], input[name="txtUserCode"]');
  await userInput.waitFor({ state: 'visible', timeout: 15000 });
  await userInput.fill(ENV.ADMIN_USER);
  
  await page.locator('#txtPassword, input[name="Password"], input[name="txtPassword"]').fill(ENV.ADMIN_PASSWORD);

  // Check Use Radius for admin
  const radiusCheckbox = page.locator('#chkRadius, input[name="UseRadius"], input[type="checkbox"]').first();
  const isChecked = await radiusCheckbox.isChecked().catch(() => false);
  if (!isChecked) {
    await radiusCheckbox.check();
  }

  // Login
  await page.locator('#btnLogin, input[type="submit"], button:has-text("Login"), a:has-text("Login")').click();
  
  // Wait for main page
  await page.waitForURL('**/FMainMP**', { timeout: 30000 }).catch(() => {
    // Some versions may redirect differently
  });
  await page.waitForLoadState('networkidle').catch(() => {});

  // Save auth state
  await page.context().storageState({ path: path.join(AUTH_DIR, 'admin-web.json') });
});

/**
 * Setup test RF session (without Radius)
 */
setup('authenticate test RF', async ({ page }) => {
  // Navigate to RF login
  await page.goto(ENV.RF_LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000); // Wait for Angular to bootstrap

  // Fill test credentials
  const userInput = page.locator('input[ng-model*="UserCode"], input[ng-model*="userCode"], #txtUserCode, input[placeholder*="User"]');
  await userInput.waitFor({ state: 'visible', timeout: 15000 });
  await userInput.fill(ENV.TEST_USER);
  
  await page.locator('input[ng-model*="Password"], input[type="password"]').fill(ENV.TEST_PASSWORD);

  // Make sure Radius is NOT checked for test user
  const radiusToggle = page.locator('input[ng-model*="Radius"], #chkRadius');
  const isChecked = await radiusToggle.isChecked().catch(() => false);
  if (isChecked) {
    await radiusToggle.uncheck();
  }

  // Login
  await page.locator('button:has-text("Login"), button:has-text("Sign"), .login-btn').click();
  
  // Wait for main menu
  await page.waitForURL('**/index.html#/main**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Save auth state
  await page.context().storageState({ path: path.join(AUTH_DIR, 'test-rf.json') });
});
