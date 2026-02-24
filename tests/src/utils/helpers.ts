/**
 * Common test helpers and utilities
 */
import { Page, Locator, expect } from '@playwright/test';

/**
 * Wait for EasyUI datagrid to load
 */
export async function waitForDatagrid(page: Page, selector = '.datagrid-view'): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible', timeout: 15000 });
  // Wait for loading mask to disappear
  await page.waitForSelector('.datagrid-mask', { state: 'hidden', timeout: 15000 }).catch(() => {});
}

/**
 * Wait for RF page to fully load (AngularJS digest)
 */
export async function waitForRFPage(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  // Wait for ionic content to render
  await page.waitForSelector('ion-content, .scroll-content', { state: 'visible', timeout }).catch(() => {});
}

/**
 * Simulate barcode scan input on RF page
 * Many RF fields auto-submit on Enter after scan
 */
export async function scanBarcode(page: Page, selector: string, barcode: string): Promise<void> {
  const input = page.locator(selector);
  await input.waitFor({ state: 'visible' });
  await input.clear();
  await input.fill(barcode);
  await input.press('Enter');
  // Wait for AJAX response
  await page.waitForTimeout(500);
}

/**
 * Click EasyUI toolbar button by text
 */
export async function clickToolbarButton(page: Page, buttonText: string): Promise<void> {
  const btn = page.locator(`.datagrid-toolbar a, .panel-tool a, .easyui-linkbutton`).filter({ hasText: buttonText });
  await btn.click();
}

/**
 * Select row in EasyUI datagrid
 */
export async function selectDatagridRow(page: Page, rowIndex: number, gridSelector = '.datagrid-view'): Promise<void> {
  const row = page.locator(`${gridSelector} .datagrid-body tr.datagrid-row`).nth(rowIndex);
  await row.click();
}

/**
 * Get datagrid row count
 */
export async function getDatagridRowCount(page: Page, gridSelector = '.datagrid-view'): Promise<number> {
  return page.locator(`${gridSelector} .datagrid-body tr.datagrid-row`).count();
}

/**
 * Fill EasyUI combobox
 */
export async function fillCombobox(page: Page, selector: string, value: string): Promise<void> {
  const combo = page.locator(selector);
  await combo.click();
  // Type to filter
  const input = combo.locator('input.combo-text, input.textbox-text');
  await input.clear();
  await input.fill(value);
  // Select from dropdown
  const panel = page.locator('.combo-panel:visible, .combobox-item:visible').filter({ hasText: value }).first();
  await panel.click();
}

/**
 * Handle IWMS alert/confirm dialog
 */
export async function handleDialog(page: Page, action: 'ok' | 'cancel' = 'ok'): Promise<string> {
  let message = '';
  
  // EasyUI messager dialog
  const dialog = page.locator('.messager-body, .messager-window');
  if (await dialog.isVisible().catch(() => false)) {
    message = await dialog.locator('.messager-icon + div, .messager-body p').textContent() || '';
    const btn = action === 'ok' 
      ? dialog.locator('a.l-btn').filter({ hasText: /OK|确定|Yes/ }).first()
      : dialog.locator('a.l-btn').filter({ hasText: /Cancel|取消|No/ }).first();
    await btn.click();
  }
  
  return message;
}

/**
 * Wait for RF operation success message
 */
export async function waitForRFSuccess(page: Page, timeout = 10000): Promise<string> {
  // RF typically shows ion-popup or custom alert for results
  const successIndicator = page.locator('.popup-body, .success-msg, ion-popup .popup-body, .toast-message');
  await successIndicator.waitFor({ state: 'visible', timeout });
  return await successIndicator.textContent() || '';
}

/**
 * Wait for RF error and return message
 */
export async function waitForRFError(page: Page, timeout = 5000): Promise<string | null> {
  try {
    const errorIndicator = page.locator('.error-msg, .popup-body.error, ion-popup .popup-body');
    await errorIndicator.waitFor({ state: 'visible', timeout });
    return await errorIndicator.textContent() || '';
  } catch {
    return null;
  }
}

/**
 * Navigate to RF menu via Angular $state.go
 * This is the correct way - direct URL navigation breaks Angular templates
 */
export async function navigateToRFMenu(page: Page, stateName: string): Promise<void> {
  const fullState = stateName.startsWith('MENU_') ? stateName : `MENU_${stateName}`;
  await page.evaluate((state) => {
    const inj = (window as any).angular.element(document.body).injector();
    inj.get('$state').go(state);
  }, fullState);
  await page.waitForTimeout(1500);
}

/**
 * Check if user is logged into RF (loginInfo exists)
 */
export async function isRFLoggedIn(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return !!(window as any).loginInfo?.UserCode;
  });
}

/**
 * Get RF loginInfo
 */
export async function getRFLoginInfo(page: Page): Promise<any> {
  return page.evaluate(() => {
    const li = (window as any).loginInfo;
    return li ? { UserCode: li.UserCode, OrgName: li.OrgName, OrgID: li.OrgID, menuCount: li.ModuleRights?.length || 0 } : null;
  });
}

/**
 * Switch organization on RF
 */
export async function switchOrg(page: Page, orgCode: string): Promise<void> {
  // Navigate to settings/org switch
  await page.locator('#orgSelect, [ng-model="selectedOrg"], .org-selector').click();
  await page.locator(`.item, .option`).filter({ hasText: orgCode }).click();
  await page.waitForTimeout(500);
}

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `screenshots/${name}_${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Generate unique test identifier
 */
export function generateTestId(prefix = 'TEST'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Retry an async operation
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
