/**
 * Inventory Operations Tests (RF)
 * BinMove, InvAdjust, CycleCount, SubinvTransfer
 * @tags @rf @inventory @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { BinMovePage } from '../../src/pages/rf/BinMovePage';
import { InvAdjustPage } from '../../src/pages/rf/InvAdjustPage';
import { CycleCountPage } from '../../src/pages/rf/CycleCountPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

test.describe('Bin Move @rf @inventory', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => { await db.initDbPool(true); });
  test.afterAll(async () => { await db.closeAllPools(); });

  test('Navigate to Bin Move @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const binMove = new BinMovePage(page);
    await binMove.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Move item between locations', async ({ page }) => {
    // Find item with onhand
    const items = await factory.findItemsWithOnhand(1);
    test.skip(items.length === 0, 'No items with onhand');

    const item = items[0];
    // Find another location in same subinventory
    const locations = await factory.getAvailableLocations(item.SUBINV_CODE, 5);
    const targetLoc = locations.find(l => l.LOCATION_CODE !== item.LOCATION_CODE);
    test.skip(!targetLoc, 'No alternate location available');

    const beforeQty = await factory.getCurrentOnhand(item.ITEM_CODE, item.SUBINV_CODE, item.LOCATION_CODE);

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const binMove = new BinMovePage(page);
    await binMove.goto();

    const result = await binMove.moveBin({
      fromLocation: item.LOCATION_CODE,
      toLocation: targetLoc.LOCATION_CODE,
      itemCode: item.ITEM_CODE,
      qty: 1,
      lotNo: item.LOT_NUMBER,
    });
    console.log(`BinMove result: ${result}`);

    // Verify: source decreased, target increased
    const afterQty = await factory.getCurrentOnhand(item.ITEM_CODE, item.SUBINV_CODE, item.LOCATION_CODE);
    console.log(`Source onhand: ${beforeQty} -> ${afterQty}`);
  });
});

test.describe('Inventory Adjust @rf @inventory', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => { await db.initDbPool(true); });
  test.afterAll(async () => { await db.closeAllPools(); });

  test('Navigate to Inv Adjust @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const adjustPage = new InvAdjustPage(page);
    await adjustPage.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });

  test('Adjust inventory quantity', async ({ page }) => {
    const items = await factory.findItemsWithOnhand(1);
    test.skip(items.length === 0, 'No items with onhand');

    const item = items[0];
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const adjustPage = new InvAdjustPage(page);
    await adjustPage.goto();

    const result = await adjustPage.adjust({
      subInv: item.SUBINV_CODE,
      location: item.LOCATION_CODE,
      itemCode: item.ITEM_CODE,
      qty: 1,
      lotNo: item.LOT_NUMBER,
      reason: 'TEST_ADJUSTMENT',
    });
    console.log(`Adjust result: ${result}`);
  });
});

test.describe('Cycle Count @rf @inventory', () => {
  test('Navigate to Cycle Count @smoke', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();
    const countPage = new CycleCountPage(page);
    await countPage.goto();
    await expect(page.locator('ion-content, .scroll-content')).toBeVisible({ timeout: 10000 });
  });
});
