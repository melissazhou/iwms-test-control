/**
 * RF SO Load Page (SOLoad.html?version=1)
 * State: MENU_SOLoad (or APP_装车（销售出库）)
 * 
 * Scan SO/Delivery to load onto truck
 */
import { Page } from '@playwright/test';

export class SOLoadPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.evaluate(() => {
      // Try multiple possible state names
      const $state = (window as any).angular.element(document.body).injector().get('$state');
      const states = $state.get().filter((s: any) => s.name && s.name.includes('SOLoad') && !s.name.includes('Delivery') && !s.name.includes('UnLoad'));
      if (states.length > 0) $state.go(states[0].name);
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

  async scanLabel(barcode: string): Promise<void> {
    const input = this.page.locator('[ng-model="InputData.LabelSN"]').or(
      this.page.locator('[ng-model="InputData.labelSN"]')
    );
    await input.fill(barcode);
    await input.press('Enter');
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
}
