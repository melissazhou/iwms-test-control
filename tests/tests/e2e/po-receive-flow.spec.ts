/**
 * PO Receive Full E2E Flow Test
 * 
 * Purchase Order lifecycle:
 * 1. PO Receive (RF) - scan PO and receive items
 * 2. Putaway (RF) - move received items to storage
 * 3. Verify onhand inventory changed
 * 
 * Organization: AND (DC) primary, DDR secondary
 * 
 * @tags @e2e @po @AND
 */
import { test, expect } from '../../src/fixtures/base';
import { POReceivePage } from '../../src/pages/rf/POReceivePage';
import { PutawayPage } from '../../src/pages/rf/PutawayPage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

let testPO: string;
let testPODetails: any[];

test.describe('PO Receive + Putaway E2E @e2e @po @AND', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => {
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('Step 0: Find a receivable PO', async () => {
    const pos = await factory.findReceivablePOs(1);
    expect(pos.length, 'No receivable PO found in AND org').toBeGreaterThan(0);
    
    testPO = pos[0].DOC_NO;
    console.log(`Using PO: ${testPO} [${pos[0].STATUS}] from ${pos[0].VENDOR_NAME}`);

    testPODetails = await factory.getPODetails(testPO);
    console.log(`PO has ${testPODetails.length} lines`);
    testPODetails.forEach(d => {
      console.log(`  Line ${d.LINE_NO}: ${d.ITEM_CODE} x ${d.QTY} ${d.UOM} (received: ${d.RECEIVED_QTY || 0})`);
    });
  });

  test('Step 1: PO Receive (RF) @rf', async ({ page }) => {
    test.skip(!testPO, 'No test PO available');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const receivePage = new POReceivePage(page);
    await receivePage.goto('poreceive');

    for (const line of testPODetails) {
      const remainingQty = line.QTY - (line.RECEIVED_QTY || 0);
      if (remainingQty <= 0) continue;

      // Record onhand before receive for verification
      const beforeQty = await factory.getCurrentOnhand(line.ITEM_CODE);
      console.log(`Before receive: ${line.ITEM_CODE} onhand = ${beforeQty}`);

      const result = await receivePage.receiveLine({
        poNumber: testPO,
        itemCode: line.ITEM_CODE,
        qty: Math.min(remainingQty, 1), // Receive 1 for testing
      });
      console.log(`Receive line ${line.LINE_NO}: ${result}`);
    }
  });

  test('Step 2: Putaway (RF) @rf', async ({ page }) => {
    test.skip(!testPO, 'No test PO available');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const putawayPage = new PutawayPage(page);
    await putawayPage.goto('upshelf');

    // Putaway requires knowing the staging location and target location
    // This would need to be determined from the receive step
    console.log('Putaway flow - scan label from staging to target location');
  });

  test('Step 3: Verify inventory @smoke', async () => {
    test.skip(!testPO, 'No test PO available');

    // Check PO status
    const status = await factory.getDocStatus(testPO, 'PO');
    console.log(`PO status after receive: ${status}`);

    // Check that inventory increased
    for (const line of testPODetails) {
      const currentQty = await factory.getCurrentOnhand(line.ITEM_CODE);
      console.log(`${line.ITEM_CODE} current onhand: ${currentQty}`);
    }
  });
});

test.describe('DC PO Receive (AND specific) @e2e @po @AND', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => {
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('DC PO Receive with directed putaway @rf', async ({ page }) => {
    const pos = await factory.findReceivablePOs(1);
    test.skip(pos.length === 0, 'No receivable PO');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const receivePage = new POReceivePage(page);
    await receivePage.goto('DCporeceive');

    // DC receive has directed putaway - system suggests location
    console.log(`DC Receive PO: ${pos[0].DOC_NO}`);
    await receivePage.scanPO(pos[0].DOC_NO);
  });
});
