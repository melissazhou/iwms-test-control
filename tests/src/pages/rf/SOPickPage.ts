/**
 * RF SO Pick Page (GoodsPickUp.html)
 * State: MENU_GoodsPickUp
 * 
 * DOM Structure (from UAT observation):
 * - Header: back button, title (销售出库 / Sale Out Of Storage), home button
 * - Document number: input[ng-model="InputData.BillNoTemp"] placeholder="Scan the document..."
 * - BillNo hidden: input[ng-model="InputData.BillNo"]
 * - Transaction type: select[ng-model="TransStyCode_SelectedItem"]
 * - Customer: readonly text input
 * - Subinventory: readonly text input
 * - Dynamic fields via ng-repeat (WorkOrder, Warehouse, TaskID, SO Number, Delivery Id, etc.)
 * - Detail list section with item cards
 * 
 * Key scope functions ($parent):
 *   onBillKeyUp, checkBill, checkSku, checkSkuQty, appendSku, removeSku,
 *   preSubmitCheck, submitBill, clearUI, goBack, goHome, scanBarcode
 */
import { Page, Locator } from '@playwright/test';
import { waitForRFPage } from '../../utils/helpers';

export class SOPickPage {
  readonly page: Page;

  // Header
  readonly backButton: Locator;
  readonly homeButton: Locator;

  // Main inputs
  readonly documentNumberInput: Locator;
  readonly transactionTypeSelect: Locator;
  readonly customerField: Locator;
  readonly subinventoryField: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header buttons - first two buttons on the page
    this.backButton = page.locator('button').first();
    this.homeButton = page.locator('button').nth(1);

    // Core fields - use ng-model selectors for precision in Ionic cached DOM
    this.documentNumberInput = page.locator('[ng-model="InputData.BillNoTemp"]');
    this.transactionTypeSelect = page.locator('[ng-model="TransStyCode_SelectedItem"]');
    this.customerField = page.locator('.item').filter({ hasText: 'Customer' }).locator('input');
    this.subinventoryField = page.locator('.item').filter({ hasText: 'Subinventory' }).locator('input');
  }

  /**
   * Navigate to this page via Angular state
   */
  async navigate(): Promise<void> {
    await this.page.evaluate(() => {
      const inj = (window as any).angular.element(document.body).injector();
      inj.get('$state').go('MENU_GoodsPickUp');
    });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Scan or enter a document number (SO/Delivery)
   */
  async enterDocumentNumber(docNumber: string): Promise<void> {
    await this.documentNumberInput.fill(docNumber);
    // Trigger onBillKeyUp via Enter key (simulates scanner)
    await this.documentNumberInput.press('Enter');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if bill was loaded successfully
   */
  async isBillLoaded(): Promise<boolean> {
    const billNo = await this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNo"]') as HTMLInputElement;
      return el?.value || '';
    });
    return billNo.length > 0;
  }

  /**
   * Get current bill info from scope
   */
  async getBillInfo(): Promise<any> {
    return this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      const scope = (window as any).angular.element(el).scope().$parent;
      return {
        billNo: scope.InputData?.BillNo || '',
        skuListCount: scope.SkuList?.length || 0,
        detailListCount: scope.DetailList?.length || 0,
      };
    });
  }

  /**
   * Get detail list items
   */
  async getDetailItems(): Promise<any[]> {
    return this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      const scope = (window as any).angular.element(el).scope().$parent;
      return (scope.SkuList || []).map((item: any) => ({
        seq: item.Seq,
        itemName: item.ItemName,
        itemDesc: item.ItemDesc,
        qty: item.Qty,
        leaveQty: item.LeaveQty,
        uom: item.Uom,
      }));
    });
  }

  /**
   * Scan SKU/LPN barcode for picking
   */
  async scanSku(barcode: string): Promise<void> {
    // After bill loaded, the SKU scan input appears
    const skuInput = this.page.locator('[ng-model="InputData.LabelSN"]').or(
      this.page.locator('[ng-model="InputData.labelSN"]')
    ).or(
      this.page.locator('[ng-model="InputData.SkuBarcode"]')
    );
    await skuInput.fill(barcode);
    await skuInput.press('Enter');
    await this.page.waitForTimeout(1500);
  }

  /**
   * Submit the pick transaction
   */
  async submit(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      const scope = (window as any).angular.element(el).scope().$parent;
      if (scope.preSubmitCheck) scope.preSubmitCheck();
      else if (scope.submitBill) scope.submitBill();
    });
    await this.page.waitForTimeout(3000);
  }

  /**
   * Clear the form
   */
  async clear(): Promise<void> {
    await this.page.evaluate(() => {
      const el = document.querySelector('[ng-model="InputData.BillNoTemp"]');
      const scope = (window as any).angular.element(el).scope().$parent;
      scope.clearUI();
      scope.$apply();
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Check for alert/error messages
   */
  async getAlertMessage(): Promise<string> {
    const popup = this.page.locator('.popup-body, .popup-title, ion-popup');
    if (await popup.isVisible().catch(() => false)) {
      return await popup.textContent() || '';
    }
    return '';
  }
}
