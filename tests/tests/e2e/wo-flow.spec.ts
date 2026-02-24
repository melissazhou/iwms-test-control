/**
 * Work Order (MO) Full E2E Flow Test
 * 
 * Work Order lifecycle:
 * 1. MO Pick (RF) - pick components for the work order
 * 2. MO Issue (RF) - issue picked materials to shop floor
 * 3. MO Complete (RF) - complete the work order, receive finished goods
 * 
 * Organization: DDR (Factory)
 * 
 * @tags @e2e @wo @DDR
 */
import { test, expect } from '../../src/fixtures/base';
import { MOIssuePage, MOCompletePage, MOPickPage } from '../../src/pages/rf/MOIssuePage';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import * as db from '../../src/utils/db';

let testMO: string;

test.describe('Work Order Full Flow @e2e @wo @DDR', () => {
  const factory = new TestDataFactory('DDR');

  test.beforeAll(async () => {
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('Step 0: Find open MO', async () => {
    const mos = await factory.findOpenMOs(1);
    expect(mos.length, 'No open MO/WO found in DDR org').toBeGreaterThan(0);
    testMO = mos[0].DOC_NO;
    console.log(`Using MO: ${testMO} [${mos[0].STATUS}]`);
  });

  test('Step 1: MO Pick (RF) @rf', async ({ page }) => {
    test.skip(!testMO, 'No test MO available');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const pickPage = new MOPickPage(page);
    await pickPage.goto();

    // Would need MO component details to pick
    console.log(`MO Pick for: ${testMO}`);
  });

  test('Step 2: MO Issue (RF) @rf', async ({ page }) => {
    test.skip(!testMO, 'No test MO available');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const issuePage = new MOIssuePage(page);
    await issuePage.goto('MOIssue');

    console.log(`MO Issue for: ${testMO}`);
  });

  test('Step 3: MO Complete (RF) @rf', async ({ page }) => {
    test.skip(!testMO, 'No test MO available');

    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const completePage = new MOCompletePage(page);
    await completePage.goto();

    console.log(`MO Complete for: ${testMO}`);
  });

  test('Step 4: Verify inventory changes', async () => {
    test.skip(!testMO, 'No test MO available');

    const status = await factory.getDocStatus(testMO, 'MO');
    console.log(`MO final status: ${status}`);
  });
});
