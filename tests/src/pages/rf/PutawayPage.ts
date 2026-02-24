/**
 * Putaway (Upshelf) RF Page Object
 * Move received items from staging to storage locations
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFSuccess, waitForRFError } from '../../utils/helpers';

export class PutawayPage {
  readonly page: Page;

  private readonly labelInput = 'input[ng-model*="Label"], input[ng-model*="SN"], #txtLabel, input[placeholder*="Label"]';
  private readonly fromLocInput = 'input[ng-model*="FromLoc"], input[ng-model*="fromLocation"], #txtFromLoc';
  private readonly toLocInput = 'input[ng-model*="ToLoc"], input[ng-model*="toLocation"], #txtToLoc, input[placeholder*="To"]';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Putaway"), button[ng-click*="confirm"]';
  private readonly submitBtn = 'button:has-text("Submit"), button[ng-click*="submit"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(menuId = 'upshelf'): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/${menuId}`);
    await waitForRFPage(this.page);
  }

  async scanLabel(label: string): Promise<void> {
    await scanBarcode(this.page, this.labelInput, label);
  }

  async scanFromLocation(location: string): Promise<void> {
    await scanBarcode(this.page, this.fromLocInput, location);
  }

  async scanToLocation(location: string): Promise<void> {
    await scanBarcode(this.page, this.toLocInput, location);
  }

  async enterQty(qty: number): Promise<void> {
    const input = this.page.locator(this.qtyInput);
    await input.clear();
    await input.fill(qty.toString());
  }

  async confirm(): Promise<void> {
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
  }

  async submit(): Promise<string> {
    await this.page.locator(this.submitBtn).click();
    await this.page.waitForTimeout(2000);
    return await waitForRFSuccess(this.page).catch(() => '');
  }

  async putaway(params: {
    label?: string;
    fromLocation?: string;
    toLocation: string;
    qty?: number;
  }): Promise<string> {
    if (params.label) await this.scanLabel(params.label);
    if (params.fromLocation) await this.scanFromLocation(params.fromLocation);
    await this.scanToLocation(params.toLocation);
    if (params.qty) await this.enterQty(params.qty);
    await this.confirm();
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}
