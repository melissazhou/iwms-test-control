/**
 * Wave Pick RF Page Object
 * Wave picking mode - picks are grouped by wave, then flow to Sorter
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFSuccess, waitForRFError } from '../../utils/helpers';

export class WavePickPage {
  readonly page: Page;

  private readonly waveInput = 'input[ng-model*="WaveNo"], input[ng-model*="waveNo"], #txtWaveNo, input[placeholder*="Wave"]';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation, input[placeholder*="Loc"]';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode, input[placeholder*="Item"]';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty, input[placeholder*="Qty"]';
  private readonly lotInput = 'input[ng-model*="LotNo"], #txtLotNo';
  private readonly labelInput = 'input[ng-model*="Label"], input[ng-model*="SN"], #txtLabel';
  private readonly confirmBtn = 'button:has-text("Confirm"), button[ng-click*="confirm"]';
  private readonly submitBtn = 'button:has-text("Submit"), button[ng-click*="submit"]';
  private readonly nextBtn = 'button:has-text("Next"), button[ng-click*="next"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    // Wave pick may use different menu names in different setups
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/WavePick`);
    await waitForRFPage(this.page);
  }

  async scanWave(waveNo: string): Promise<void> {
    await scanBarcode(this.page, this.waveInput, waveNo);
  }

  async scanLocation(location: string): Promise<void> {
    await scanBarcode(this.page, this.locationInput, location);
  }

  async scanItem(itemCode: string): Promise<void> {
    await scanBarcode(this.page, this.itemInput, itemCode);
  }

  async enterQty(qty: number): Promise<void> {
    const input = this.page.locator(this.qtyInput);
    await input.clear();
    await input.fill(qty.toString());
  }

  async scanLot(lotNo: string): Promise<void> {
    await scanBarcode(this.page, this.lotInput, lotNo);
  }

  async scanLabel(label: string): Promise<void> {
    await scanBarcode(this.page, this.labelInput, label);
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

  async next(): Promise<void> {
    await this.page.locator(this.nextBtn).click();
    await waitForRFPage(this.page);
  }

  /**
   * Pick a wave line
   */
  async pickWaveLine(params: {
    location: string;
    itemCode: string;
    qty: number;
    lotNo?: string;
    label?: string;
  }): Promise<string> {
    await this.scanLocation(params.location);
    await this.scanItem(params.itemCode);
    if (params.lotNo) await this.scanLot(params.lotNo);
    if (params.label) await this.scanLabel(params.label);
    await this.enterQty(params.qty);
    await this.confirm();
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }

  /**
   * Get remaining pick tasks count
   */
  async getRemainingCount(): Promise<number> {
    const countEl = this.page.locator('.remaining-count, .task-count, [ng-bind*="remaining"]');
    const text = await countEl.textContent().catch(() => '0');
    return parseInt(text || '0', 10);
  }
}
