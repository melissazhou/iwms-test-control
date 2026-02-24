/**
 * Bin Move RF Page Object
 * Move inventory between locations within same subinventory
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFSuccess, waitForRFError } from '../../utils/helpers';

export class BinMovePage {
  readonly page: Page;

  private readonly fromLocInput = 'input[ng-model*="FromLoc"], #txtFromLoc, input[placeholder*="From"]';
  private readonly toLocInput = 'input[ng-model*="ToLoc"], #txtToLoc, input[placeholder*="To"]';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode, input[placeholder*="Item"]';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly lotInput = 'input[ng-model*="LotNo"], #txtLotNo';
  private readonly labelInput = 'input[ng-model*="Label"], input[ng-model*="SN"], #txtLabel';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Move"), button[ng-click*="confirm"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/BinMove`);
    await waitForRFPage(this.page);
  }

  async scanFromLocation(location: string): Promise<void> {
    await scanBarcode(this.page, this.fromLocInput, location);
  }

  async scanToLocation(location: string): Promise<void> {
    await scanBarcode(this.page, this.toLocInput, location);
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

  async moveBin(params: {
    fromLocation: string;
    toLocation: string;
    itemCode: string;
    qty: number;
    lotNo?: string;
    label?: string;
  }): Promise<string> {
    await this.scanFromLocation(params.fromLocation);
    await this.scanItem(params.itemCode);
    if (params.lotNo) await this.scanLot(params.lotNo);
    if (params.label) await this.scanLabel(params.label);
    await this.enterQty(params.qty);
    await this.scanToLocation(params.toLocation);
    await this.confirm();
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}
