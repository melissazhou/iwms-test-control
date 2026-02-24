/**
 * MO Issue / MO Pick / MO Complete / MO Return RF Page Objects
 * Work Order related operations
 */
import { Page } from '@playwright/test';
import { scanBarcode, waitForRFPage, waitForRFError } from '../../utils/helpers';

export class MOIssuePage {
  readonly page: Page;

  private readonly moInput = 'input[ng-model*="MONo"], input[ng-model*="DocNo"], #txtMONo, input[placeholder*="MO"]';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation';
  private readonly lotInput = 'input[ng-model*="LotNo"], #txtLotNo';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Issue"), button[ng-click*="confirm"]';
  private readonly submitBtn = 'button:has-text("Submit"), button[ng-click*="submit"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(menuId = 'MOIssue'): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/${menuId}`);
    await waitForRFPage(this.page);
  }

  async issueMaterial(params: {
    moNumber: string;
    itemCode: string;
    qty: number;
    location?: string;
    lotNo?: string;
  }): Promise<string> {
    await scanBarcode(this.page, this.moInput, params.moNumber);
    await scanBarcode(this.page, this.itemInput, params.itemCode);
    if (params.location) await scanBarcode(this.page, this.locationInput, params.location);
    if (params.lotNo) await scanBarcode(this.page, this.lotInput, params.lotNo);
    
    const qtyEl = this.page.locator(this.qtyInput);
    await qtyEl.clear();
    await qtyEl.fill(params.qty.toString());
    
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}

export class MOCompletePage {
  readonly page: Page;

  private readonly moInput = 'input[ng-model*="MONo"], #txtMONo';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly subInvInput = 'input[ng-model*="SubInv"], #txtSubInv';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Complete"), button[ng-click*="confirm"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/MOComplete`);
    await waitForRFPage(this.page);
  }

  async completeMO(params: {
    moNumber: string;
    itemCode: string;
    qty: number;
    subInv?: string;
    location?: string;
  }): Promise<string> {
    await scanBarcode(this.page, this.moInput, params.moNumber);
    await scanBarcode(this.page, this.itemInput, params.itemCode);
    
    const qtyEl = this.page.locator(this.qtyInput);
    await qtyEl.clear();
    await qtyEl.fill(params.qty.toString());
    
    if (params.subInv) await scanBarcode(this.page, this.subInvInput, params.subInv);
    if (params.location) await scanBarcode(this.page, this.locationInput, params.location);
    
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}

export class MOPickPage {
  readonly page: Page;

  private readonly moInput = 'input[ng-model*="MONo"], #txtMONo';
  private readonly itemInput = 'input[ng-model*="ItemCode"], #txtItemCode';
  private readonly qtyInput = 'input[ng-model*="Qty"], #txtQty';
  private readonly locationInput = 'input[ng-model*="Location"], #txtLocation';
  private readonly confirmBtn = 'button:has-text("Confirm"), button:has-text("Pick"), button[ng-click*="confirm"]';

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto(`${process.env.RF_BASE_URL}/index.html#/MOPick`);
    await waitForRFPage(this.page);
  }

  async pickForMO(params: {
    moNumber: string;
    itemCode: string;
    qty: number;
    location: string;
  }): Promise<string> {
    await scanBarcode(this.page, this.moInput, params.moNumber);
    await scanBarcode(this.page, this.locationInput, params.location);
    await scanBarcode(this.page, this.itemInput, params.itemCode);
    
    const qtyEl = this.page.locator(this.qtyInput);
    await qtyEl.clear();
    await qtyEl.fill(params.qty.toString());
    
    await this.page.locator(this.confirmBtn).click();
    await this.page.waitForTimeout(1000);
    
    const error = await waitForRFError(this.page, 2000);
    return error ? `ERROR: ${error}` : 'OK';
  }
}
