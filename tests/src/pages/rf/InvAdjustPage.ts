/**
 * Inventory Adjust RF Page Object
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFSuccess, waitForRFError } from '../../utils/helpers';

export class InvAdjustPage {
  readonly page: Page;

  private readonly subInvInput = 'input[ng-model*="SubInv"], #txtSubInv';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly lotInput = 'input[ng-model*="LotNo"], #txtLotNo';
  private readonly reasonInput = 'input[ng-model*="Reason"], select[ng-model*="Reason"], #txtReason';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Adjust"), button[ng-click*="confirm"]';
  private readonly submitBtn = 'button:has-text("Submit"), button[ng-click*="submit"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/InvAdjust`);
    await waitForRFPage(this.page);
  }

  async adjust(params: {
    subInv: string;
    location: string;
    itemCode: string;
    qty: number;
    lotNo?: string;
    reason?: string;
  }): Promise<string> {
    await scanBarcode(this.page, this.subInvInput, params.subInv);
    await scanBarcode(this.page, this.locationInput, params.location);
    await scanBarcode(this.page, this.itemInput, params.itemCode);
    if (params.lotNo) await scanBarcode(this.page, this.lotInput, params.lotNo);
    
    const qtyEl = this.page.locator(this.qtyInput);
    await qtyEl.clear();
    await qtyEl.fill(params.qty.toString());
    
    if (params.reason) {
      const reasonEl = this.page.locator(this.reasonInput);
      await reasonEl.fill(params.reason);
    }
    
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}
