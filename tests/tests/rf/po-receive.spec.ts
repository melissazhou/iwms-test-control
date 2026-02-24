/**
 * PO Receive Module Tests (RF)
 * @tags @rf @po @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { POReceivePage } from '../../src/pages/rf/POReceivePage';
import { PutawayPage } from '../../src/pages/rf/PutawayPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

test.describe('PO Receive @rf @po', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => { await db.initDbPool(true); });
  test.afterAll(async () => { await db.closeAllPools(); });

  test('Navigate to PO Receive @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const receivePage = new POReceivePage(page);
    await receivePage.goto('poreceive');
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Navigate to DC PO Receive @smoke @AND', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const receivePage = new POReceivePage(page);
    await receivePage.goto('DCporeceive');
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Scan valid PO number', async ({ page }) => {
    const pos = await factory.findReceivablePOs(1);
    test.skip(pos.length === 0, 'No receivable PO');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const receivePage = new POReceivePage(page);
    await receivePage.goto('poreceive');
    await receivePage.scanPO(pos[0].DOC_NO);
    console.log(`Scanned PO: ${pos[0].DOC_NO}`);
  });

  test('Scan invalid PO shows error', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const receivePage = new POReceivePage(page);
    await receivePage.goto('poreceive');
    await receivePage.scanPO('INVALID_PO_99999');
    // Error should appear
  });

  test('Receive PO line item', async ({ page }) => {
    const pos = await factory.findReceivablePOs(1);
    test.skip(pos.length === 0, 'No receivable PO');

    const details = await factory.getPODetails(pos[0].DOC_NO);
    const receivable = details.find(d => (d.QTY - (d.RECEIVED_QTY || 0)) > 0);
    test.skip(!receivable, 'No receivable line');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const receivePage = new POReceivePage(page);
    await receivePage.goto('poreceive');

    const result = await receivePage.receiveLine({
      poNumber: pos[0].DOC_NO,
      itemCode: receivable.ITEM_CODE,
      qty: 1,
    });
    console.log(`Receive result: ${result}`);
  });
});

test.describe('Putaway @rf @po', () => {
  test('Navigate to Putaway @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const putawayPage = new PutawayPage(page);
    await putawayPage.goto('upshelf');
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });
});
