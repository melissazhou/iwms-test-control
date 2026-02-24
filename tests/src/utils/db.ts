/**
 * Oracle Database utility for test data management and verification
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const oracledb = require('oracledb');
import { ENV } from '../config/env';

function getConnectionConfig(readOnly = false) {
  return {
    user: readOnly ? ENV.DB_RO_USER : ENV.DB_USER,
    password: readOnly ? ENV.DB_RO_PASSWORD : ENV.DB_PASSWORD,
    connectString: `${ENV.DB_HOST}:${ENV.DB_PORT}/${ENV.DB_SERVICE}`,
  };
}

let pool: any = null;
let roPool: any = null;

export async function initDbPool(readOnly = false): Promise<any> {
  const config = getConnectionConfig(readOnly);
  const p = await oracledb.createPool({
    ...config,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  });
  if (readOnly) { roPool = p; } else { pool = p; }
  return p;
}

export async function getConnection(readOnly = false): Promise<any> {
  const p = readOnly ? roPool : pool;
  if (!p) { await initDbPool(readOnly); }
  return (readOnly ? roPool : pool).getConnection();
}

export async function query<T = any>(sql: string, params: any = {}, readOnly = true): Promise<T[]> {
  const conn = await getConnection(readOnly);
  try {
    const result = await conn.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });
    return (result.rows || []) as T[];
  } finally {
    await conn.close();
  }
}

export async function execute(sql: string, params: any = {}, autoCommit = true): Promise<any> {
  const conn = await getConnection(false);
  try {
    return await conn.execute(sql, params, { autoCommit });
  } finally {
    await conn.close();
  }
}

export async function closeAllPools(): Promise<void> {
  if (pool) { await pool.close(0); pool = null; }
  if (roPool) { await roPool.close(0); roPool = null; }
}

// ============================================================
// Convenience queries
// ============================================================

export async function getItems(orgCode: string, limit = 10): Promise<any[]> {
  return query(`
    SELECT DISTINCT i.ITEM_CODE, i.ITEM_DESC, i.UOM 
    FROM WMS.TBLINVENTORYITEM i
    WHERE i.ORG_CODE = :orgCode AND ROWNUM <= :limit
  `, { orgCode, limit });
}

export async function getSubInventories(orgCode: string): Promise<any[]> {
  return query(`
    SELECT SUBINV_CODE, SUBINV_DESC FROM WMS.TBLINVENTORY 
    WHERE ORG_CODE = :orgCode ORDER BY SUBINV_CODE
  `, { orgCode });
}

export async function getLocators(orgCode: string, subInvCode: string): Promise<any[]> {
  return query(`
    SELECT LOCATION_CODE, LOCATION_DESC FROM WMS.TBLWHINVLOCATION 
    WHERE ORG_CODE = :orgCode AND SUBINV_CODE = :subInvCode ORDER BY LOCATION_CODE
  `, { orgCode, subInvCode });
}

export async function getOnhand(orgCode: string, itemCode?: string, subInvCode?: string): Promise<any[]> {
  let sql = `SELECT ITEM_CODE, SUBINV_CODE, LOCATION_CODE, LOT_NUMBER, QTY, UOM
    FROM WMS.TBLWHONHAND WHERE ORG_CODE = :orgCode AND QTY > 0`;
  const params: any = { orgCode };
  if (itemCode) { sql += ` AND ITEM_CODE = :itemCode`; params.itemCode = itemCode; }
  if (subInvCode) { sql += ` AND SUBINV_CODE = :subInvCode`; params.subInvCode = subInvCode; }
  sql += ` AND ROWNUM <= 50 ORDER BY ITEM_CODE`;
  return query(sql, params);
}

export async function getOpenPOs(orgCode: string, limit = 10): Promise<any[]> {
  return query(`
    SELECT DISTINCT d.DOC_NO, d.DOC_TYPE, d.STATUS, d.VENDOR_CODE, d.VENDOR_NAME
    FROM WMS.TBLDOCBILL d WHERE d.ORG_CODE = :orgCode AND d.DOC_TYPE = 'PO' 
    AND d.STATUS IN ('OPEN', 'APPROVED') AND ROWNUM <= :limit ORDER BY d.DOC_NO DESC
  `, { orgCode, limit });
}

export async function getOpenSOs(orgCode: string, limit = 10): Promise<any[]> {
  return query(`
    SELECT DISTINCT d.DOC_NO, d.DOC_TYPE, d.STATUS, d.CUSTOMER_CODE, d.CUSTOMER_NAME
    FROM WMS.TBLDOCBILL d WHERE d.ORG_CODE = :orgCode AND d.DOC_TYPE = 'SO' 
    AND d.STATUS IN ('OPEN', 'RELEASED', 'ALLOCATED') AND ROWNUM <= :limit ORDER BY d.DOC_NO DESC
  `, { orgCode, limit });
}

export async function getOpenMOs(orgCode: string, limit = 10): Promise<any[]> {
  return query(`
    SELECT DISTINCT d.DOC_NO, d.DOC_TYPE, d.STATUS FROM WMS.TBLDOCBILL d 
    WHERE d.ORG_CODE = :orgCode AND d.DOC_TYPE IN ('MO', 'WO')
    AND d.STATUS IN ('OPEN', 'RELEASED') AND ROWNUM <= :limit ORDER BY d.DOC_NO DESC
  `, { orgCode, limit });
}

export async function getUsers(): Promise<any[]> {
  return query(`SELECT USER_CODE, USER_NAME, USER_TYPE FROM WMS.TBLUSER WHERE STATUS = 'ACTIVE' ORDER BY USER_CODE`);
}

export async function getLabelBySN(sn: string): Promise<any[]> {
  return query(`SELECT * FROM WMS.TBLLABELSN WHERE SN = :sn`, { sn });
}

export async function getProfileValue(profileName: string, orgCode?: string): Promise<string | null> {
  const rows = await query(`
    SELECT PROFILE_VALUE FROM WMS.TBLPROFILEVALUE
    WHERE PROFILE_NAME = :profileName ${orgCode ? 'AND ORG_CODE = :orgCode' : ''} AND ROWNUM = 1
  `, orgCode ? { profileName, orgCode } : { profileName });
  return rows.length > 0 ? rows[0].PROFILE_VALUE : null;
}
