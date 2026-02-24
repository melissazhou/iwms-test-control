/**
 * SO Load Module Tests (RF)
 * @tags @rf @so @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { SOLoadPage } from '../../src/pages/rf/SOLoadPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';

test.describe('SO Load @rf @so @AND', () => {
  test('Navigate to SO Load page @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const loadPage = new SOLoadPage(page);
    await loadPage.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Scan SO for loading', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const loadPage = new SOLoadPage(page);
    await loadPage.goto();
    // Would need a picked SO ready for loading
    console.log('SO Load - needs picked SO data');
  });
});
