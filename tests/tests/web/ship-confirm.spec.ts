/**
 * Ship Confirm Web Tests
 * @tags @web @so @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { WebLoginPage } from '../../src/pages/web/WebLoginPage';
import { WebMainPage } from '../../src/pages/web/WebMainPage';
import { ShipConfirmPage } from '../../src/pages/web/ShipConfirmPage';

test.describe('Ship Confirm (Web) @web @so @AND', () => {
  test('Login and navigate to Ship Confirm @smoke', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Shipping', 'Ship Confirm']);
    await page.waitForTimeout(2000);
  });

  test('Search delivery by SO number', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Shipping', 'Ship Confirm']);

    const shipPage = new ShipConfirmPage(page);
    // Would need a loaded SO to search
    console.log('Ship confirm search - needs loaded SO data');
  });
});
