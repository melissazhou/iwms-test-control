/**
 * SO DashBoard Page Object — SO Release操作在这里
 * 
 * Menu: Product Sales Module → SO DashBoard
 * 
 * Actual DOM (inside iframe):
 *   Title: "SO+DashBoard"
 *   Search Form:
 *     Row 1: "SO" textbox | "Delivery ID" textbox | "SO STATUS" textbox (default: "Booked")
 *     Row 2: "Allocated Status" textbox | "Delivery Status" textbox | "Wave ID" textbox
 *     Row 3: "Customer Name" textbox | "Scheduled ship date" textbox | "Pick Type" textbox
 *     Row 4: "Ship Date Start" textbox | "Ship Date End" textbox | "IVC Internal Status" textbox
 *     "Search" link button
 *   Toolbar:
 *     "Printer:" combobox (Auto) | "print" | "Release" link | "Un-Release" link | "Backorder" link | "Show All Columns" link
 *   Datagrid: checkbox | Organization ID | Sales order | Count line | Oracle Status | Order type | Hold |
 *     Customer PO number | Customer Name | Order Date | Ship To Address | Total Order qty | Total Case qty |
 *     Allocation status | Delivery ID | Wave ID | Delivery Status | Line Details | ...many more
 *   Pagination: 200/page, Page X of Y
 *   Bottom filter: "WDD-WEI-IN" | "NON WDD-WEI-IN"
 */
import { Page, FrameLocator } from '@playwright/test';
import { handleDialog } from '../../utils/helpers';

export class SODashBoardPage {
  readonly page: Page;
  private frame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator('iframe').last();
  }

  // ---- Search ----

  /** Search by SO number */
  async searchSO(soNumber: string): Promise<void> {
    // "SO" is the first textbox in search form (ref f7e19)
    const soInput = this.frame.locator('input.textbox-text, input.easyui-textbox').first();
    await soInput.click();
    await soInput.clear();
    await soInput.fill(soNumber);
    await this.clickSearch();
  }

  /** Search by Delivery ID */
  async searchDelivery(deliveryId: string): Promise<void> {
    const deliveryInput = this.frame.locator('input.textbox-text, input.easyui-textbox').nth(1);
    await deliveryInput.click();
    await deliveryInput.clear();
    await deliveryInput.fill(deliveryId);
    await this.clickSearch();
  }

  /** Set SO STATUS filter */
  async setSOStatus(status: string): Promise<void> {
    // SO STATUS is the 3rd textbox (index 2), default "Booked"
    const statusInput = this.frame.locator('input.textbox-text, input.easyui-textbox').nth(2);
    await statusInput.click();
    await statusInput.clear();
    await statusInput.fill(status);
  }

  /** Clear SO STATUS filter (to see all statuses) */
  async clearSOStatus(): Promise<void> {
    const statusInput = this.frame.locator('input.textbox-text, input.easyui-textbox').nth(2);
    await statusInput.click();
    await statusInput.clear();
  }

  /** Click Search button */
  async clickSearch(): Promise<void> {
    const searchBtn = this.frame.getByRole('link', { name: 'Search' });
    await searchBtn.click();
    await this.page.waitForTimeout(3000); // Wait for grid to load
  }

  // ---- Selection ----

  /** Select SO row(s) by SO number */
  async selectSOs(soNumbers: string[]): Promise<void> {
    for (const so of soNumbers) {
      const row = this.frame.locator('tr.datagrid-row').filter({ hasText: so });
      await row.click();
    }
  }

  /** Select all via header checkbox */
  async selectAll(): Promise<void> {
    const headerCheckbox = this.frame.locator('.datagrid-header-row input[type="checkbox"]').first();
    await headerCheckbox.click();
  }

  // ---- Actions ----

  /** Release selected SOs */
  async release(): Promise<string> {
    const releaseBtn = this.frame.getByRole('link', { name: 'Release' });
    await releaseBtn.click();
    await this.page.waitForTimeout(2000);
    return await handleDialog(this.page, 'ok');
  }

  /** Un-Release selected SOs */
  async unRelease(): Promise<string> {
    const btn = this.frame.getByRole('link', { name: 'Un-Release' });
    await btn.click();
    await this.page.waitForTimeout(2000);
    return await handleDialog(this.page, 'ok');
  }

  /** Backorder selected SOs */
  async backorder(): Promise<string> {
    const btn = this.frame.getByRole('link', { name: 'Backorder' });
    await btn.click();
    await this.page.waitForTimeout(2000);
    return await handleDialog(this.page, 'ok');
  }

  /** Show all columns */
  async showAllColumns(): Promise<void> {
    const btn = this.frame.getByRole('link', { name: 'Show All Columns' });
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  // ---- Read Grid Data ----

  /** Get row count from pagination text */
  async getRowCount(): Promise<number> {
    const text = await this.frame.locator('div:has-text("Displaying")').last().textContent();
    const match = text?.match(/of (\d+) items/);
    return match ? parseInt(match[1]) : 0;
  }

  /** Get SO data from a specific row */
  async getSORowData(soNumber: string): Promise<Record<string, string>> {
    const row = this.frame.locator('tr.datagrid-row').filter({ hasText: soNumber }).first();
    const cells = row.locator('td');
    const data: Record<string, string> = {};
    
    // Key columns by approximate position
    const cols = ['orgId', 'salesOrder', 'countLine', 'oracleStatus', 'orderType', 'hold',
      'customerPO', 'customerName', 'orderDate', 'shipToAddress', 'totalOrderQty', 'totalCaseQty',
      'allocationStatus', 'deliveryId', 'waveId', 'deliveryStatus'];
    
    const count = Math.min(await cells.count(), cols.length);
    for (let i = 0; i < count; i++) {
      data[cols[i]] = (await cells.nth(i).textContent())?.trim() || '';
    }
    return data;
  }

  // ---- Bottom Filters ----

  /** Click WDD-WEI-IN filter */
  async filterWDDWEIIN(): Promise<void> {
    await this.frame.getByText('WDD-WEI-IN').first().click();
    await this.page.waitForTimeout(1000);
  }

  /** Click NON WDD-WEI-IN filter */
  async filterNonWDDWEIIN(): Promise<void> {
    await this.frame.getByText('NON WDD-WEI-IN').click();
    await this.page.waitForTimeout(1000);
  }
}

// Keep backward-compatible export
export { SODashBoardPage as SOReleasePage };

/**
 * Create Wave Page Object
 * Menu: Product Sales Module → Create Wave
 */
export class CreateWavePage {
  readonly page: Page;
  private frame: FrameLocator;

  constructor(page: Page) {
    this.page = page;
    this.frame = page.frameLocator('iframe').last();
  }

  async searchSO(soNumber: string): Promise<void> {
    const soInput = this.frame.locator('input.textbox-text, input.easyui-textbox').first();
    await soInput.click();
    await soInput.fill(soNumber);
    const searchBtn = this.frame.getByRole('link', { name: 'Search' });
    await searchBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async selectSOs(soNumbers: string[]): Promise<void> {
    for (const so of soNumbers) {
      const row = this.frame.locator('tr.datagrid-row').filter({ hasText: so });
      await row.click();
    }
  }

  async createWave(waveName?: string): Promise<string> {
    const btn = this.frame.getByRole('link', { name: /Create Wave|Wave/ });
    await btn.click();
    await this.page.waitForTimeout(1000);
    if (waveName) {
      const nameInput = this.page.locator('.window-body input, .messager-input');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(waveName);
      }
    }
    return await handleDialog(this.page, 'ok');
  }
}
