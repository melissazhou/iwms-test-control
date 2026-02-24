/**
 * SO Release Web Tests
 * 
 * Actual menu structure observed:
 *   Product Sales Module →
 *     - Sales Order Maint. (SO management, direct release)
 *     - Create Wave (wave release)
 *     - Add Wave Detail
 *     - Allocation Query
 * 
 * @tags @web @so @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { WebLoginPage } from '../../src/pages/web/WebLoginPage';
import { WebMainPage } from '../../src/pages/web/WebMainPage';
import { SOReleasePage, CreateWavePage } from '../../src/pages/web/SOReleasePage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

test.describe('SO Release (Web) @web @so @AND', () => {
  const factory = new TestDataFactory('AND');
  test.beforeAll(async () => { await db.initDbPool(true); });
  test.afterAll(async () => { await db.closeAllPools(); });

  test('Login to Web as Admin @smoke', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    expect(await mainPage.isMainPage()).toBeTruthy();
  });

  test('Navigate to Sales Order Maint. @smoke', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'Sales Order Maint.']);
    await page.waitForTimeout(2000);
    // Verify iframe loaded with SO grid
    const frame = mainPage.getActiveFrame();
    await expect(frame.getByRole('link', { name: 'Search' })).toBeVisible({ timeout: 10000 });
  });

  test('Search SO in grid', async ({ page }) => {
    const sos = await factory.findReleasableSOs(1);
    test.skip(sos.length === 0, 'No releasable SO');

    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'Sales Order Maint.']);

    const releasePage = new SOReleasePage(page);
    await releasePage.searchSO(sos[0].DOC_NO);
    console.log(`Found SO: ${sos[0].DOC_NO}`);
  });

  test('Navigate to Create Wave @smoke', async ({ page }) => {
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'Create Wave']);
    await page.waitForTimeout(2000);
    const frame = mainPage.getActiveFrame();
    await expect(frame.getByRole('link', { name: 'Search' })).toBeVisible({ timeout: 10000 });
  });

  test('Wave Release SO', async ({ page }) => {
    const sos = await factory.findReleasableSOs(1);
    test.skip(sos.length === 0, 'No releasable SO');

    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'Create Wave']);

    const wavePage = new CreateWavePage(page);
    await wavePage.searchSO(sos[0].DOC_NO);
    await wavePage.selectSOs([sos[0].DOC_NO]);
    const waveName = `WAVE_TEST_${Date.now()}`;
    const result = await wavePage.createWave(waveName);
    console.log(`Wave release result: ${result}`);
  });
});
