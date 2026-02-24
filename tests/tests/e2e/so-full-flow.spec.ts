/**
 * SO Full E2E Flow Test
 * 
 * Complete Sales Order lifecycle:
 * 1. SO Release (Web) - Wave Release or Direct Release
 * 2. SO Pick (RF) - GoodsPickUp or Wave Pick
 * 3. Sorter Pick (RF) - after Wave Pick
 * 4. SO Load (RF) - load onto truck
 * 5. Ship Confirm (Web) - final confirmation
 * 
 * Organization: AND (DC)
 * 
 * @tags @e2e @so @AND
 */
import { test, expect, Tags } from '../../src/fixtures/base';
import { WebLoginPage } from '../../src/pages/web/WebLoginPage';
import { WebMainPage } from '../../src/pages/web/WebMainPage';
import { SODashBoardPage } from '../../src/pages/web/SOReleasePage';
import { ShipConfirmPage } from '../../src/pages/web/ShipConfirmPage';
import { SOPickPage } from '../../src/pages/rf/SOPickPage';
import { WavePickPage } from '../../src/pages/rf/WavePickPage';
import { SorterPickPage } from '../../src/pages/rf/SorterPickPage';
import { SOLoadPage } from '../../src/pages/rf/SOLoadPage';
import { TestDataFactory } from '../../src/data/test-data-factory';
import { ENV } from '../../src/config/env';
import * as db from '../../src/utils/db';

// Test data that flows between steps
let testSO: string;
let testSODetails: any[];

test.describe('SO Full E2E Flow @e2e @so @AND', () => {
  const factory = new TestDataFactory('AND');

  test.beforeAll(async () => {
    // Initialize DB pool for data verification
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('Step 0: Find a testable SO', async () => {
    // Find an SO that can be released
    const sos = await factory.findReleasableSOs(1);
    expect(sos.length, 'No releasable SO found in AND org').toBeGreaterThan(0);
    
    testSO = sos[0].DOC_NO;
    console.log(`Using SO: ${testSO} [${sos[0].STATUS}]`);

    // Get SO details for pick verification
    testSODetails = await factory.getSODetails(testSO);
    console.log(`SO has ${testSODetails.length} lines`);
    testSODetails.forEach(d => {
      console.log(`  Line ${d.LINE_NO}: ${d.ITEM_CODE} x ${d.QTY} ${d.UOM}`);
    });
  });

  test('Step 1: SO Direct Release (Web) @web', async ({ page }) => {
    test.skip(!testSO, 'No test SO available');

    // Login as admin to web
    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();

    // Navigate to SO Release page
    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'SO DashBoard']);

    const dashboard = new SODashBoardPage(page);
    await dashboard.searchSO(testSO);
    await dashboard.selectSOs([testSO]);
    const result = await dashboard.release();
    console.log(`Release result: ${result}`);

    // Verify SO status changed
    const status = await factory.getDocStatus(testSO, 'SO');
    console.log(`SO status after release: ${status}`);
    expect(['RELEASED', 'ALLOCATED']).toContain(status);
  });

  test('Step 2: SO Pick (RF) @rf', async ({ page }) => {
    test.skip(!testSO, 'No test SO available');

    // Login to RF as test user
    const rfLogin = new (await import('../../src/pages/rf/RFLoginPage')).RFLoginPage(page);
    await rfLogin.loginAsTest();

    const pickPage = new SOPickPage(page);
    await pickPage.goto();

    // Pick each line
    for (const line of testSODetails) {
      if (line.STATUS === 'RELEASED' || line.STATUS === 'ALLOCATED') {
        const result = await pickPage.pickLine({
          soNumber: testSO,
          itemCode: line.ITEM_CODE,
          location: line.LOCATION_CODE || '',
          qty: line.QTY - (line.PICKED_QTY || 0),
          lotNo: line.LOT_NUMBER,
        });
        console.log(`Pick line ${line.LINE_NO}: ${result}`);
      }
    }

    // Submit picks
    const submitResult = await pickPage.submitPick();
    console.log(`Pick submit: ${submitResult}`);
  });

  test('Step 3: SO Load (RF) @rf', async ({ page }) => {
    test.skip(!testSO, 'No test SO available');

    const rfLogin = new (await import('../../src/pages/rf/RFLoginPage')).RFLoginPage(page);
    await rfLogin.loginAsTest();

    const loadPage = new SOLoadPage(page);
    await loadPage.goto();

    // Load items - use a test door
    const result = await loadPage.loadItem({
      soNumber: testSO,
      doorNo: 'DOOR01', // This will need to be configured per environment
    });
    console.log(`SO Load result: ${result}`);
  });

  test('Step 4: Ship Confirm (Web) @web', async ({ page }) => {
    test.skip(!testSO, 'No test SO available');

    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();

    const mainPage = new WebMainPage(page);
    // Ship confirm may be under Product Sales Module or a separate page
    await mainPage.navigateToMenu(['Product Sales Module', 'Sales Dely. Order (Source Notice)']);

    const shipPage = new ShipConfirmPage(page);
    await shipPage.searchBySO(testSO);
    const result = await shipPage.confirmShipment();
    console.log(`Ship confirm result: ${result}`);

    // Verify final SO status
    const finalStatus = await factory.getDocStatus(testSO, 'SO');
    console.log(`Final SO status: ${finalStatus}`);
    expect(['SHIPPED', 'CLOSED', 'COMPLETED']).toContain(finalStatus);
  });
});

test.describe('SO Wave Release + Wave Pick + Sorter Flow @e2e @so @AND', () => {
  const factory = new TestDataFactory('AND');
  let waveSONumber: string;

  test.beforeAll(async () => {
    await db.initDbPool(true);
  });

  test.afterAll(async () => {
    await db.closeAllPools();
  });

  test('Step 0: Find SO for Wave Release', async () => {
    const sos = await factory.findReleasableSOs(1);
    expect(sos.length).toBeGreaterThan(0);
    waveSONumber = sos[0].DOC_NO;
    console.log(`Wave test SO: ${waveSONumber}`);
  });

  test('Step 1: Wave Release (Web) @web', async ({ page }) => {
    test.skip(!waveSONumber, 'No SO for wave');

    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();

    const mainPage = new WebMainPage(page);
    await mainPage.navigateToMenu(['Product Sales Module', 'Create Wave']);

    const releasePage = new SOReleasePage(page);
    await releasePage.searchSO(waveSONumber);
    await releasePage.selectSOs([waveSONumber]);
    
    const waveName = `WAVE_TEST_${Date.now()}`;
    const result = await releasePage.waveRelease(waveName);
    console.log(`Wave release result: ${result}`);
  });

  test('Step 2: Wave Pick (RF) @rf', async ({ page }) => {
    test.skip(!waveSONumber, 'No SO for wave');

    const rfLogin = new (await import('../../src/pages/rf/RFLoginPage')).RFLoginPage(page);
    await rfLogin.loginAsTest();

    const wavePick = new WavePickPage(page);
    await wavePick.goto();

    // Wave pick would need the wave number from the release step
    // This is a placeholder - actual wave number needs to be captured from Step 1
    console.log('Wave pick flow - requires wave number from release step');
  });

  test('Step 3: Sorter Pick (RF) @rf', async ({ page }) => {
    test.skip(!waveSONumber, 'No SO for wave');

    const rfLogin = new (await import('../../src/pages/rf/RFLoginPage')).RFLoginPage(page);
    await rfLogin.loginAsTest();

    const sorterPick = new SorterPickPage(page);
    await sorterPick.goto();

    console.log('Sorter pick flow - requires items from wave pick');
  });

  test('Step 4: SO Load after Sorter (RF) @rf', async ({ page }) => {
    test.skip(!waveSONumber, 'No SO for wave');

    const rfLogin = new (await import('../../src/pages/rf/RFLoginPage')).RFLoginPage(page);
    await rfLogin.loginAsTest();

    const loadPage = new SOLoadPage(page);
    await loadPage.goto();

    console.log('SO Load after sorter flow');
  });

  test('Step 5: Ship Confirm (Web) @web', async ({ page }) => {
    test.skip(!waveSONumber, 'No SO for wave');

    const loginPage = new WebLoginPage(page);
    await loginPage.loginAsAdmin();

    const shipPage = new ShipConfirmPage(page);
    await shipPage.searchBySO(waveSONumber);
    const result = await shipPage.confirmShipment();
    console.log(`Ship confirm result: ${result}`);
  });
});
