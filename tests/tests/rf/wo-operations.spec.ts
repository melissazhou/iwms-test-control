/**
 * Work Order Operations Tests (RF)
 * MO Pick, MO Issue, MO Complete, MO Return
 * @tags @rf @wo @DDR
 */
import { test, expect } from '../../src/fixtures/base';
import { MOIssuePage, MOCompletePage, MOPickPage } from '../../src/pages/rf/MOIssuePage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

test.describe('MO Pick @rf @wo @DDR', () => {
  test('Navigate to MO Pick @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const pickPage = new MOPickPage(page);
    await pickPage.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('MO Issue @rf @wo @DDR', () => {
  const factory = new TestDataFactory('DDR');
  test.beforeAll(async () => { await db.initDbPool(true); });
  test.afterAll(async () => { await db.closeAllPools(); });

  test('Navigate to MO Issue @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const issuePage = new MOIssuePage(page);
    await issuePage.goto('MOIssue');
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Issue material to MO', async ({ page }) => {
    const mos = await factory.findOpenMOs(1);
    test.skip(mos.length === 0, 'No open MO');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const issuePage = new MOIssuePage(page);
    await issuePage.goto('MOIssue');
    console.log(`MO Issue for: ${mos[0].DOC_NO}`);
  });
});

test.describe('MO Complete @rf @wo @DDR', () => {
  test('Navigate to MO Complete @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const completePage = new MOCompletePage(page);
    await completePage.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });
});
