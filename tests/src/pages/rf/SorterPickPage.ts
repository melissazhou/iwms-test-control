/**
 * RF Sorter Pick Page (SorterPickingNew.html)
 * State: MENU_SorterPickingNew
 * 
 * Similar structure to GoodsPickUp - scan-based workflow
 * Scan Wave/SO → pick items to sorter belt
 */
import { Page, Locator } from '@playwright/test';

export class SorterPickPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).angular.element(document.body).injector().get('$state').go('MENU_SorterPickingNew');
    });
    await this.page.waitForTimeout(1000);
  }

  async enterDocumentNumber(docNumber: string): Promise<void> {
    const input = this.page.locator('[ng-model="InputData.BillNoTemp"]');
    await input.fill(docNumber);
    await input.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  async getBillInfo(): Promise<any> {
    return this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      if (!el) return { error: 'input not found' };
      const scope = (window as any).angular.element(el).scope().$parent;
      return {
        billNo: scope.InputData?.BillNo || '',
        skuListCount: scope.SkuList?.length || 0,
      };
    });
  }

  async scanSku(barcode: string): Promise<void> {
    const skuInput = this.page.locator('[ng-model="InputData.LabelSN"]').or(
      this.page.locator('[ng-model="InputData.labelSN"]')
    );
    await skuInput.fill(barcode);
    await skuInput.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  async submit(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      const scope = (window as any).angular.element(el).scope().$parent;
      if (scope.preSubmitCheck) scope.preSubmitCheck();
      else if (scope.submitBill) scope.submitBill();
    });
    await this.page.waitForTimeout(3000);
  }

  async clear(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      (window as any).angular.element(el).scope().$parent.clearUI();
    });
  }
}
