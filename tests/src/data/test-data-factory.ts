/**
 * Test Data Factory
 * Creates test data via DB or API for E2E test scenarios
 */
import * as db from '../utils/db';
import { IWMSApiClient } from '../utils/api-client';
import { generateTestId } from '../utils/helpers';

export interface TestSOData {
  soNumber: string;
  customerCode: string;
  items: Array<{
    itemCode: string;
    qty: number;
    uom: string;
    subInv: string;
    location: string;
  }>;
}

export interface TestPOData {
  poNumber: string;
  vendorCode: string;
  items: Array<{
    itemCode: string;
    qty: number;
    uom: string;
  }>;
}

export interface TestMOData {
  moNumber: string;
  assemblyItem: string;
  qty: number;
  components: Array<{
    itemCode: string;
    qty: number;
  }>;
}

export class TestDataFactory {
  private orgCode: string;

  constructor(orgCode = 'AND') {
    this.orgCode = orgCode;
  }

  // ============================================================
  // Query existing data for testing
  // ============================================================

  /** Find items with available inventory */
  async findItemsWithOnhand(limit = 5): Promise<any[]> {
    return db.query(`
      SELECT oh.ITEM_CODE, oh.SUBINV_CODE, oh.LOCATION_CODE, oh.LOT_NUMBER, 
             oh.QTY, oh.UOM
      FROM WMS.TBLWHONHAND oh
      WHERE oh.ORG_CODE = :orgCode AND oh.QTY > 0
      AND ROWNUM <= :limit
      ORDER BY oh.QTY DESC
    `, { orgCode: this.orgCode, limit });
  }

  /** Find a releasable SO */
  async findReleasableSOs(limit = 5): Promise<any[]> {
    return db.query(`
      SELECT d.DOC_NO, d.STATUS, d.CUSTOMER_CODE, d.CUSTOMER_NAME, d.CREATE_DATE
      FROM WMS.TBLDOCBILL d
      WHERE d.ORG_CODE = :orgCode 
      AND d.DOC_TYPE = 'SO'
      AND d.STATUS IN ('OPEN', 'APPROVED')
      AND ROWNUM <= :limit
      ORDER BY d.CREATE_DATE DESC
    `, { orgCode: this.orgCode, limit });
  }

  /** Find released/allocated SOs ready for picking */
  async findPickableSOs(limit = 5): Promise<any[]> {
    return db.query(`
      SELECT d.DOC_NO, d.STATUS, d.CUSTOMER_CODE
      FROM WMS.TBLDOCBILL d
      WHERE d.ORG_CODE = :orgCode 
      AND d.DOC_TYPE = 'SO'
      AND d.STATUS IN ('RELEASED', 'ALLOCATED')
      AND ROWNUM <= :limit
      ORDER BY d.CREATE_DATE DESC
    `, { orgCode: this.orgCode, limit });
  }

  /** Find open POs for receiving */
  async findReceivablePOs(limit = 5): Promise<any[]> {
    return db.query(`
      SELECT d.DOC_NO, d.STATUS, d.VENDOR_CODE, d.VENDOR_NAME
      FROM WMS.TBLDOCBILL d
      WHERE d.ORG_CODE = :orgCode 
      AND d.DOC_TYPE = 'PO'
      AND d.STATUS IN ('OPEN', 'APPROVED')
      AND ROWNUM <= :limit
      ORDER BY d.CREATE_DATE DESC
    `, { orgCode: this.orgCode, limit });
  }

  /** Find open work orders */
  async findOpenMOs(limit = 5): Promise<any[]> {
    return db.query(`
      SELECT d.DOC_NO, d.STATUS, d.DOC_TYPE
      FROM WMS.TBLDOCBILL d
      WHERE d.ORG_CODE = :orgCode 
      AND d.DOC_TYPE IN ('MO', 'WO')
      AND d.STATUS IN ('OPEN', 'RELEASED')
      AND ROWNUM <= :limit
      ORDER BY d.CREATE_DATE DESC
    `, { orgCode: this.orgCode, limit });
  }

  /** Get SO detail lines */
  async getSODetails(soNumber: string): Promise<any[]> {
    return db.query(`
      SELECT dtl.LINE_NO, dtl.ITEM_CODE, dtl.QTY, dtl.PICKED_QTY, 
             dtl.SHIPPED_QTY, dtl.UOM, dtl.STATUS, dtl.SUBINV_CODE, dtl.LOCATION_CODE
      FROM WMS.TBLDOCBILLDTL dtl
      JOIN WMS.TBLDOCBILL d ON d.DOC_ID = dtl.DOC_ID
      WHERE d.DOC_NO = :soNumber AND d.ORG_CODE = :orgCode
      ORDER BY dtl.LINE_NO
    `, { soNumber, orgCode: this.orgCode });
  }

  /** Get PO detail lines */
  async getPODetails(poNumber: string): Promise<any[]> {
    return db.query(`
      SELECT dtl.LINE_NO, dtl.ITEM_CODE, dtl.QTY, dtl.RECEIVED_QTY,
             dtl.UOM, dtl.STATUS
      FROM WMS.TBLDOCBILLDTL dtl
      JOIN WMS.TBLDOCBILL d ON d.DOC_ID = dtl.DOC_ID
      WHERE d.DOC_NO = :poNumber AND d.ORG_CODE = :orgCode
      ORDER BY dtl.LINE_NO
    `, { poNumber, orgCode: this.orgCode });
  }

  /** Get available locations for a subinventory */
  async getAvailableLocations(subInvCode: string, limit = 10): Promise<any[]> {
    return db.query(`
      SELECT l.LOCATION_CODE, l.LOCATION_DESC
      FROM WMS.TBLWHINVLOCATION l
      WHERE l.ORG_CODE = :orgCode AND l.SUBINV_CODE = :subInvCode
      AND l.STATUS = 'ACTIVE'
      AND ROWNUM <= :limit
      ORDER BY l.LOCATION_CODE
    `, { orgCode: this.orgCode, subInvCode, limit });
  }

  // ============================================================
  // Create test data (via RW DB connection)
  // ============================================================

  /** Get next sequence value for test doc numbers */
  async getNextTestDocNo(prefix: string): Promise<string> {
    const result = await db.query(
      `SELECT WMS.SEQ_TEST_DOC.NEXTVAL AS NEXT_VAL FROM DUAL`,
      {}, false
    ).catch(() => [{ NEXT_VAL: Date.now() % 100000 }]);
    return `${prefix}_${result[0].NEXT_VAL}`;
  }

  /** Verify onhand changed after an operation */
  async verifyOnhandChange(
    itemCode: string,
    subInvCode: string,
    locationCode: string,
    expectedDelta: number,
    beforeQty: number
  ): Promise<{ passed: boolean; actualQty: number; expectedQty: number }> {
    const rows = await db.query(`
      SELECT NVL(SUM(QTY), 0) AS TOTAL_QTY 
      FROM WMS.TBLWHONHAND
      WHERE ORG_CODE = :orgCode AND ITEM_CODE = :itemCode
      AND SUBINV_CODE = :subInvCode AND LOCATION_CODE = :locationCode
    `, { orgCode: this.orgCode, itemCode, subInvCode, locationCode });
    
    const actualQty = rows[0]?.TOTAL_QTY || 0;
    const expectedQty = beforeQty + expectedDelta;
    return {
      passed: Math.abs(actualQty - expectedQty) < 0.001,
      actualQty,
      expectedQty,
    };
  }

  /** Get current onhand for verification */
  async getCurrentOnhand(itemCode: string, subInvCode?: string, locationCode?: string): Promise<number> {
    let sql = `
      SELECT NVL(SUM(QTY), 0) AS TOTAL_QTY 
      FROM WMS.TBLWHONHAND
      WHERE ORG_CODE = :orgCode AND ITEM_CODE = :itemCode
    `;
    const params: any = { orgCode: this.orgCode, itemCode };
    if (subInvCode) { sql += ` AND SUBINV_CODE = :subInvCode`; params.subInvCode = subInvCode; }
    if (locationCode) { sql += ` AND LOCATION_CODE = :locationCode`; params.locationCode = locationCode; }
    
    const rows = await db.query(sql, params);
    return rows[0]?.TOTAL_QTY || 0;
  }

  /** Get document status */
  async getDocStatus(docNo: string, docType: string): Promise<string> {
    const rows = await db.query(`
      SELECT STATUS FROM WMS.TBLDOCBILL
      WHERE DOC_NO = :docNo AND DOC_TYPE = :docType AND ORG_CODE = :orgCode
    `, { docNo, docType, orgCode: this.orgCode });
    return rows[0]?.STATUS || 'NOT_FOUND';
  }
}
