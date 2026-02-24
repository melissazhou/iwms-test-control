/**
 * Smoke Test: RF Login
 * Verifies RF MobileApp login and menu access
 */
import { test, expect } from '@playwright/test';
import { RFLoginPage } from '../../src/pages/rf/RFLoginPage';
import { isRFLoggedIn, getRFLoginInfo } from '../../src/utils/helpers';

test.describe('RF Login Smoke Tests', () => {

  test('should login with Test user (no Radius)', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    // Verify loginInfo is populated
    const loggedIn = await isRFLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    const info = await getRFLoginInfo(page);
    expect(info).not.toBeNull();
    expect(info.UserCode).toBe('Test');
    expect(info.menuCount).toBeGreaterThan(0);
    console.log(`✅ RF Login OK: ${info.UserCode} @ ${info.OrgName}, ${info.menuCount} menus`);
  });

  test('should access SO Pick page after login', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    // Navigate to SO Pick via state.go
    await page.evaluate(() => {
      (window as any).angular.element(document.body).injector().get('$state').go('MENU_GoodsPickUp');
    });
    await page.waitForTimeout(1500);

    // Verify the state changed
    const state = await page.evaluate(() => {
      return (window as any).angular.element(document.body).injector().get('$state').current.name;
    });
    expect(state).toBe('MENU_GoodsPickUp');

    // Verify document number input exists
    const docInput = page.locator('[ng-model="InputData.BillNoTemp"]');
    await expect(docInput).toBeVisible();
    console.log('✅ SO Pick page loaded, document input visible');
  });

  test('should list available RF states', async ({ page }) => {
    const rfLogin = new RFLoginPage(page);
    await rfLogin.loginAsTest();

    const states = await page.evaluate(() => {
      return (window as any).angular.element(document.body).injector().get('$state')
        .get()
        .filter((s: any) => s.name && s.name.startsWith('MENU_'))
        .map((s: any) => s.name);
    });

    console.log(`📋 Available RF states: ${states.length}`);
    expect(states.length).toBeGreaterThan(50);

    // Check key states exist
    const requiredStates = [
      'MENU_GoodsPickUp',      // SO Pick
      'MENU_SorterPickingNew',  // Sorter Pick
      'MENU_POReceive',         // PO Receive
    ];
    for (const rs of requiredStates) {
      const exists = states.includes(rs);
      console.log(`  ${exists ? '✅' : '❌'} ${rs}`);
    }
  });
});
