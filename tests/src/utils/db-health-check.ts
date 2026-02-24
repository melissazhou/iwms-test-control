/**
 * Database health check - run with: npm run db:check
 * Switch env: set TEST_ENV=uat && npm run db:check
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.TEST_ENV || 'int';
dotenv.config({ path: path.resolve(__dirname, '../../', `.env.${env}`) });

import { initDbPool, query, closeAllPools } from './db';
import { ENV } from '../config/env';

async function main() {
  console.log(`🔍 IWMS ${env.toUpperCase()} Database Health Check`);
  console.log('==================================\n');
  console.log(`DB: ${ENV.DB_HOST}:${ENV.DB_PORT}/${ENV.DB_SERVICE}\n`);

  try {
    // Test RW connection
    console.log(`1. Testing RW connection (${ENV.DB_USER})...`);
    await initDbPool(false);
    await query('SELECT 1 AS OK FROM DUAL', {}, false);
    console.log('   ✅ RW connection OK\n');

    // Test RO connection
    console.log(`2. Testing RO connection (${ENV.DB_RO_USER})...`);
    await initDbPool(true);
    await query('SELECT 1 AS OK FROM DUAL', {}, true);
    console.log('   ✅ RO connection OK\n');

    // Check key tables
    console.log('3. Checking key tables...');
    const tables = [
      'TBLWHONHAND', 'TBLDOCBILL', 'TBLDOCBILLDTL', 'TBLINVENTORY',
      'TBLINVLOCATION', 'TBLUSER', 'TBLRECLABEL', 'TBLPROFILEVALUE',
    ];
    for (const table of tables) {
      try {
        const rows = await query(`SELECT COUNT(*) AS CNT FROM WMS.${table}`, {}, true);
        console.log(`   ✅ ${table}: ${rows[0]?.CNT || 0} rows`);
      } catch (e: any) {
        console.log(`   ❌ ${table}: ${e.message}`);
      }
    }

    // Check orgs
    console.log('\n4. Organizations...');
    // Query org table - try to find correct columns
    try {
      const orgCols = await query(`SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = 'TBLINVENTORY' AND OWNER = 'WMS' AND ROWNUM <= 20`, {}, true);
      console.log('   TBLINVENTORY columns:', orgCols.map((c: any) => c.COLUMN_NAME).join(', '));
      
      const orgs = await query(`SELECT * FROM WMS.TBLINVENTORY WHERE ROWNUM <= 5`, {}, true);
      if (orgs.length > 0) {
        console.log('   Sample keys:', Object.keys(orgs[0]).join(', '));
        orgs.forEach((org: any) => {
          const vals = Object.values(org).map(v => String(v)).join(' | ');
          console.log(`   📦 ${vals.substring(0, 100)}`);
        });
      }
    } catch (e: any) {
      console.log(`   ⚠️ Org query failed: ${e.message}`);
    }

    // Check users
    // Discover TBLUSER columns
    console.log('\n5. Users...');
    try {
      const userCols = await query(`SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = 'TBLUSER' AND OWNER = 'WMS' AND ROWNUM <= 20`, {}, true);
      console.log('   TBLUSER columns:', userCols.map((c: any) => c.COLUMN_NAME).join(', '));
      const users = await query(`SELECT * FROM WMS.TBLUSER WHERE ROWNUM <= 3`, {}, true);
      if (users.length > 0) {
        console.log('   Sample keys:', Object.keys(users[0]).join(', '));
      }
    } catch (e: any) {
      console.log(`   ⚠️ ${e.message}`);
    }

    // Discover TBLDOCBILL columns
    console.log('\n6. Documents...');
    try {
      const docCols = await query(`SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = 'TBLDOCBILL' AND OWNER = 'WMS' AND ROWNUM <= 30`, {}, true);
      console.log('   TBLDOCBILL columns:', docCols.map((c: any) => c.COLUMN_NAME).join(', '));
      const docs = await query(`SELECT * FROM WMS.TBLDOCBILL WHERE ROWNUM <= 2`, {}, true);
      if (docs.length > 0) {
        console.log('   Sample keys:', Object.keys(docs[0]).join(', '));
      }
    } catch (e: any) {
      console.log(`   ⚠️ ${e.message}`);
    }

    // Also check TBLWHONHAND and TBLINVLOCATION columns
    console.log('\n7. Key table schemas...');
    for (const tbl of ['TBLWHONHAND', 'TBLINVLOCATION', 'TBLRECLABEL']) {
      try {
        const cols = await query(`SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :tbl AND OWNER = 'WMS' ORDER BY COLUMN_ID`, { tbl }, true);
        console.log(`   ${tbl}: ${cols.map((c: any) => c.COLUMN_NAME).join(', ')}`);
      } catch (e: any) {
        console.log(`   ❌ ${tbl}: ${e.message}`);
      }
    }

    console.log('\n✅ Health check complete!');
  } catch (error: any) {
    console.error(`\n❌ Health check failed: ${error.message}`);
    process.exit(1);
  } finally {
    await closeAllPools();
  }
}

main();
