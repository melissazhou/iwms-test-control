/**
 * RF Main Menu Page Object
 * 
 * After login: #/tab/home with bottom tabs: Home | Menu | Me
 * Navigation: direct URL to page files under /MobileApp/
 * 
 * loginInfo.ModuleRights contains 137 menus with:
 *   MENUCODE, MENUDESC, FORMURL, TRANSSTYCODE, BIZFUNCCODE
 */
import { Page } from '@playwright/test';
import { waitForRFPage } from '../../utils/helpers';
import { ENV } from '../../config/env';

/** RF page URLs mapped from actual ModuleRights */
export const RF_PAGES = {
  // SO / Sales
  SO_PICK: 'page/goods/GoodsPickUp.html',
  SO_PICK_TRF: 'page/goods/GoodsPickUpTrf.html',
  SO_PICK_FULL_PALLET: 'page/goods/GoodsPickUpbyFullpallet.html',
  SO_DELIVERY: 'page/goods/GoodsDelivery.html',
  SO_DELIVERY_BY_SO: 'page/goods/GoodsDeliveryBySO.html',
  SORTER_PICK: 'page/inv/SorterPickingNew.html',
  SORTER_PICK_OLD: 'page/inv/SorterPicking.html',
  SORTER_REPACK: 'page/inv/SorterRepack.html',
  WAVE_REPLENISH: 'page/goods/ForkliftToSorterBelt.html',
  SO_LOAD: 'page/inv/SOLoad.html?version=1',
  SO_LOAD_DELIVERY: 'page/inv/SOLoadDelivery.html',
  SO_LOAD_SCAN: 'page/inv/SOLoadByScanSONew.html?version=1',
  SO_LOAD_SCAN_OPT: 'page/inv/SOLoadByScanSOOpt.html?version=1',
  SO_UNLOAD_DOOR: 'page/inv/SOUnLoadDoor.html',
  SO_RETURN: 'page/inv/SalesOrderReturn.html',
  SO_RETURN_CORRECT: 'page/inv/CorrectSOReturn.html',
  SO_UNPICK_REPACK: 'page/inv/SoUnPickRepack.html',
  SALES_RETURN: 'page/goods/GoodsBack.html',

  // PO / Receiving
  PO_RECEIVE: 'page/purchase/poreceive.html',
  DC_PO_RECEIVE: 'page/purchase/DCporeceive.html',
  ASN_RECEIVE: 'page/purchase/receive.html',
  ASN_RECEIVE_LINE: 'page/purchase/ASNReceiveL.html',
  PO_CORRECT: 'page/purchase/poreceivecorrect.html',
  PURCHASE_RETURN: 'page/purchase/reject.html',
  RETURN_TO_VENDOR: 'page/purchase/ReturnToVendor.html',

  // Putaway
  PUTAWAY: 'page/purchase/upshelf.html',
  PUTAWAY_BATCH: 'page/purchase/UpShelfFull.html',
  PUTAWAY_LABEL: 'page/purchase/UpShelfLabel.html',
  PUTAWAY_NO_IQC: 'page/purchase/UpShelfNoIQC.html',
  PUTAWAY_LOC: 'page/inv/POChagneInvLoc.html',
  DC_PUTAWAY: 'page/inv/DCPOChagneInvLoc.html',

  // Inventory
  BIN_MOVE: 'page/inv/BinMove.html',
  BIN_MOVE_LOT: 'page/inv/ChagneInvLotNo.html?ShowRcvOrg=Y',
  INV_ADJUST: 'page/inv/OtherNoDoc.html',
  INV_ADJUST_LPN: 'page/inv/NoDocHaveLabels.html',
  INV_ADJUST_NEW_LPN: 'page/inv/NoDocNewLabels.html',
  CYCLE_COUNT: 'page/inv/InvMakeCountInvLocation.html',
  CYCLE_COUNT_NORMAL: 'page/inv/NormalMakenCount.html',
  URGENT_COUNT: 'page/inv/UrgenMakenCount.html',
  TRANSFER: 'page/inv/InvTrf.html',
  MISC_RECEIPT: 'page/inv/InvTrfOtherInBatch.html',
  MISC_ISSUE: 'page/inv/InvTrfOtherOutBatch.html',
  STATUS_CHANGE: 'page/inv/ChagneInvStatus.html',
  RESTOCK: 'page/inv/Restock.html',
  LOAD_TRUCK: 'page/inv/LoadTruckPlus.html',
  UNLOAD_TRUCK: 'page/inv/UnLoadTruckPlus.html',

  // WO / Manufacturing
  WO_ISSUE: 'page/inv/InvIssueMaterial.html',
  WO_RETURN: 'page/inv/InvIssueMaterialReturn.html',
  WIP_ISSUE: 'page/inv/WIPIssue.html?MaterialType=PRINTED MATERIAL',
  WIP_ISSUE_NO_PRINT: 'page/inv/WIPIssueNoPrint.html?MaterialType=NON-PRINTED MATERIAL',
  WIP_RETURN: 'page/inv/WIPReturn.html',
  WIP_RETURN_NO_PRINT: 'page/inv/WIPReturnNoPrint.html',
  WIP_ISSUE_LOT: 'page/inv/WIPIssueLot.html',
  WIP_RETURN_LOT: 'page/inv/WIPReturnLot.html',
  WO_COMPLETE: 'page/goods/InvGoodRcvIn.html',
  WO_COMPLETE_PRINT: 'page/goods/InvGoodRcvInPrintSN.html',
  WO_COMPLETE_BY_ORDER: 'page/goods/InvGoodRcvIn.html?AutoLoadSN=Y',
  WO_COMPLETE_RETURN: 'page/goods/GoodsPReturn.html',
  WO_PICK: 'page/goods/InvGoodRcvPick.html?MaterialType=NON-PRINTED MATERIAL',

  // Labels
  LABEL_VIEW: 'page/inv/LabelView.html',
  LABEL_CHANGE: 'page/inv/LabelChange.html',
  LABEL_PACK: 'page/inv/InvLabelPackage.html?LevelRelation=N',
  LABEL_SPLIT: 'page/inv/InvSplitSNLabel.html?LeaveLabel=Y',
  LABEL_MERGE: 'page/inv/InvMergeSNLabel.html',

  // Query
  ONHAND_QUERY: 'templates/InvQuery.html',
  LPN_QUERY: 'templates/LPNQuery.html',
} as const;

export class RFMainPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to an RF page by its FORMURL
   * This is the actual navigation method used by IWMS RF
   */
  async navigateToPage(formUrl: string): Promise<void> {
    const fullUrl = `${ENV.RF_BASE_URL}/${formUrl}`;
    await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
    await waitForRFPage(this.page);
  }

  /**
   * Navigate using RF_PAGES constant
   */
  async goTo(pageKey: keyof typeof RF_PAGES): Promise<void> {
    await this.navigateToPage(RF_PAGES[pageKey]);
  }

  /**
   * Get current user's menu list via JS
   */
  async getMenuList(): Promise<any[]> {
    return this.page.evaluate(() => {
      return (window as any).loginInfo?.ModuleRights?.map((m: any) => ({
        code: m.MENUCODE,
        desc: m.MENUDESC,
        url: m.FORMURL,
      })) || [];
    });
  }

  /**
   * Get current org
   */
  async getCurrentOrg(): Promise<string> {
    return this.page.evaluate(() => (window as any).loginInfo?.OrgName || '');
  }

  /**
   * Switch org via loginInfo (requires re-login or API call)
   */
  async switchOrg(orgCode: string): Promise<void> {
    // Navigate to org selection or use button
    const orgBtn = this.page.locator('button').filter({ hasText: orgCode }).first();
    if (await orgBtn.isVisible().catch(() => false)) {
      await orgBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Go to Home tab
   */
  async goHome(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('.tab-item')[0]?.dispatchEvent(new Event('click'));
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Go to Menu tab
   */
  async goMenu(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('.tab-item')[1]?.dispatchEvent(new Event('click'));
    });
    await this.page.waitForTimeout(500);
  }
}
