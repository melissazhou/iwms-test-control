/**
 * Ship Confirm Page Object (Web端 - DocBill)
 * Final step in SO flow: confirm shipment after SO Load
 */
import { Page, FrameLocator } from '@playwright/test';
import { waitForDatagrid, clickToolbarButton, handleDialog } from '../../utils/helpers';

export class ShipConfirmPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Search for delivery/trip
   */
  async searchDelivery(deliveryNo: string): Promise<void> {
    const input = this.page.locator('#txtDeliveryNo, input[name="DeliveryNo"]');
    await input.clear();
    await input.fill(deliveryNo);
    await clickToolbarButton(this.page, 'Search');
    await waitForDatagrid(this.page);
  }

  /**
   * Search by SO number
   */
  async searchBySO(soNumber: string): Promise<void> {
    const input = this.page.locator('#txtSONo, input[name="DocNo"]');
    await input.clear();
    await input.fill(soNumber);
    await clickToolbarButton(this.page, 'Search');
    await waitForDatagrid(this.page);
  }

  /**
   * Select deliveries for ship confirm
   */
  async selectDeliveries(deliveryNos: string[]): Promise<void> {
    for (const dn of deliveryNos) {
      const row = this.page.locator('.datagrid-body tr').filter({ hasText: dn });
      const checkbox = row.locator('input[type="checkbox"], .datagrid-cell-check');
      await checkbox.click();
    }
  }

  /**
   * Execute ship confirm
   */
  async confirmShipment(): Promise<string> {
    await clickToolbarButton(this.page, 'Ship Confirm');
    await this.page.waitForTimeout(1000);
    
    // Handle confirmation dialog
    const msg = await handleDialog(this.page, 'ok');
    
    // Wait for processing
    await this.page.waitForTimeout(3000);
    
    // Handle result dialog
    const result = await handleDialog(this.page, 'ok');
    return result || msg;
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(deliveryNo: string): Promise<string> {
    const row = this.page.locator('.datagrid-body tr').filter({ hasText: deliveryNo });
    const statusCell = row.locator('td[field="STATUS"], td[field="Status"]');
    return (await statusCell.textContent()) || '';
  }
}
