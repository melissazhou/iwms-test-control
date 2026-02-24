/**
 * Cycle Count RF Page Object
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFError } from '../../utils/helpers';

export class CycleCountPage {
  readonly page: Page;

  private readonly countNoInput = 'input[ng-model*="CountNo"], #txtCountNo, input[placeholder*="Count"]';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly lotInput = 'input[ng-model*="LotNo"], #txtLotNo';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Count"), button[ng-click*="confirm"]';
  private readonly submitBtn = 'button:has-text("Submit"), button[ng-click*="submit"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/CycleCount`);
    await waitForRFPage(this.page);
  }

  async scanCountNo(countNo: string): Promise<void> {
    await scanBarcode(this.page, this.countNoInput, countNo);
  }

  async countItem(params: {
    countNo?: string;
    location: string;
    itemCode: string;
    qty: number;
    lotNo?: string;
  }): Promise<string> {
    if (params.countNo) await this.scanCountNo(params.countNo);
    await scanBarcode(this.page, this.locationInput, params.location);
    await scanBarcode(this.page, this.itemInput, params.itemCode);
    if (params.lotNo) await scanBarcode(this.page, this.lotInput, params.lotNo);
    
    const qtyEl = this.page.locator(this.qtyInput);
    await qtyEl.clear();
    await qtyEl.fill(params.qty.toString());
    
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }

  async submit(): Promise<string> {
    await this.page.locator(this.submitBtn).click();
    await this.page.waitForTimeout(2000);
    return 'submitted';
  }
}
