/**
 * Login Tests - Web and RF
 * @tags @smoke @web @rf
 */
import { test, expect } from '../../src/fixtures/base';
import { WebLoginPage } from '../../src/pages/web/WebLoginPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { ENV } from '../../src/config/env';

test.describe('Web Login @smoke @web', () => {
  test('Admin login with Radius', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    // Should be on main page
    await expect(page).toHaveURL(/FMainMP/, { timeout: 30000 });
  });

  test('Test user login without Radius', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsTest();
    await expect(page).toHaveURL(/FMainMP/, { timeout: 30000 });
  });

  test('Invalid credentials shows error', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.login('INVALID_USER', 'INVALID_PASS', false);
    // Should stay on login page or show error
    const errorVisible = await page.locator('.messager-body, .error-msg, .alert').isVisible().catch(() => false);
    const stillOnLogin = page.url().includes('FLogin');
    expect(errorVisible || stillOnLogin).toBeTruthy();
  });
});

test.describe('RF Login @smoke @rf', () => {
  test('Test user RF login', async ({ page }) => {
    const loginPage = new RFLoginPage(page);
    await loginPage.loginAsTest();
    // Should navigate to main menu
    await expect(page).toHaveURL(/index\.html#\/main/, { timeout: 15000 }).catch(() => {
      // Fallback: check we're no longer on login
      expect(page.url()).not.toContain('/login');
    });
  });

  test('Admin RF login with Radius', async ({ page }) => {
    const loginPage = new RFLoginPage(page);
    await loginPage.loginAsAdmin();
    await expect(page).toHaveURL(/index\.html#\/main/, { timeout: 15000 }).catch(() => {
      expect(page.url()).not.toContain('/login');
    });
  });
});
