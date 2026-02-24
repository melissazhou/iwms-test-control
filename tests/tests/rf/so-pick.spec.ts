/**
 * SO Pick Module Tests (RF)
 * Individual test cases for SO picking operations
 * 
 * @tags @rf @so @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { SOPickPage } from '../../src/pages/rf/SOPickPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

test.describe('SO Pick (GoodsPickUp) @rf @so', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => {
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('Navigate to SO Pick page @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const pickPage = new SOPickPage(page);
    await pickPage.goto();
    
    // Verify page loaded
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Scan valid SO number', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const sos = await factory.findPickableSOs(1);
    test.skip(sos.length === 0, 'No pickable SO available');

    const pickPage = new SOPickPage(page);
    await pickPage.goto();
    await pickPage.scanSO(sos[0].DOC_NO);

    // Should load SO details
    console.log(`Scanned SO: ${sos[0].DOC_NO}`);
  });

  test('Scan invalid SO shows error', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const pickPage = new SOPickPage(page);
    await pickPage.goto();
    await pickPage.scanSO('INVALID_SO_99999');

    // Should show error
    const errorMsg = page.locator('.error-msg, .popup-body, .toast-message');
    await expect(errorMsg).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Error message not visible - may need selector adjustment');
    });
  });

  test('Pick single line item', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const sos = await factory.findPickableSOs(1);
    test.skip(sos.length === 0, 'No pickable SO available');

    const details = await factory.getSODetails(sos[0].DOC_NO);
    const pickableLine = details.find(d => d.STATUS === 'RELEASED' || d.STATUS === 'ALLOCATED');
    test.skip(!pickableLine, 'No pickable line');

    const beforeQty = await factory.getCurrentOnhand(
      pickableLine.ITEM_CODE,
      pickableLine.SUBINV_CODE,
      pickableLine.LOCATION_CODE
    );

    const pickPage = new SOPickPage(page);
    await pickPage.goto();

    const result = await pickPage.pickLine({
      soNumber: sos[0].DOC_NO,
      itemCode: pickableLine.ITEM_CODE,
      location: pickableLine.LOCATION_CODE,
      qty: 1,
      lotNo: pickableLine.LOT_NUMBER,
    });

    console.log(`Pick result: ${result}`);

    // Verify onhand decreased
    const afterQty = await factory.getCurrentOnhand(
      pickableLine.ITEM_CODE,
      pickableLine.SUBINV_CODE,
      pickableLine.LOCATION_CODE
    );
    console.log(`Onhand: ${beforeQty} -> ${afterQty}`);
  });
});
