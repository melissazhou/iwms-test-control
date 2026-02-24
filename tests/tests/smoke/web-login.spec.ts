/**
 * Smoke Test: Web Login
 * Verifies IWMS Web EasyUI login
 */
import { test, expect } from '@playwright/test';
import { WebLoginPage } from '../../src/pages/web/WebLoginPage';

test.describe('Web Login Smoke Tests', () => {

  test('should login to Web with Test user', async ({ page }) => {
    const webLogin = new WebLoginPage(page);
    await webLogin.login('Test', 'Test', false);

    // Wait for main page
    await page.waitForTimeout(3000);

    // Check URL contains FStartPage or main page indicator
    const url = page.url();
    console.log(`📍 After login URL: ${url}`);

    // Should not be on login page anymore
    expect(url).not.toContain('FLogin.html');
    console.log('✅ Web login succeeded');
  });
});
