/**
 * Seed test data into INT environment
 * Run with: npm run data:seed
 * 
 * This script queries existing data and reports what's available for testing.
 * It can also create test-specific records if needed.
 */
import { initDbPool, query, closeAllPools } from '../utils/db';
import { TestDataFactory } from './test-data-factory';

async function main() {
  console.log('🌱 IWMS Test Data Seed Report');
  console.log('=============================\n');

  await initDbPool(true); // Start with read-only

  const andFactory = new TestDataFactory('AND');
  const ddrFactory = new TestDataFactory('DDR');

  // ---- AND Organization ----
  console.log('📦 AND (Distribution Center)');
  console.log('----------------------------');

  const andSOs = await andFactory.findReleasableSOs();
  console.log(`\n  Releasable SOs: ${andSOs.length}`);
  andSOs.forEach(so => console.log(`    ${so.DOC_NO} [${so.STATUS}] - ${so.CUSTOMER_NAME}`));

  const andPickSOs = await andFactory.findPickableSOs();
  console.log(`\n  Pickable SOs: ${andPickSOs.length}`);
  andPickSOs.forEach(so => console.log(`    ${so.DOC_NO} [${so.STATUS}]`));

  const andPOs = await andFactory.findReceivablePOs();
  console.log(`\n  Receivable POs: ${andPOs.length}`);
  andPOs.forEach(po => console.log(`    ${po.DOC_NO} [${po.STATUS}] - ${po.VENDOR_NAME}`));

  const andOnhand = await andFactory.findItemsWithOnhand(10);
  console.log(`\n  Items with Onhand: ${andOnhand.length}`);
  andOnhand.forEach(oh => console.log(`    ${oh.ITEM_CODE} @ ${oh.SUBINV_CODE}/${oh.LOCATION_CODE}: ${oh.QTY} ${oh.UOM}`));

  // ---- DDR Organization ----
  console.log('\n📦 DDR (Factory Warehouse)');
  console.log('--------------------------');

  const ddrMOs = await ddrFactory.findOpenMOs();
  console.log(`\n  Open MOs/WOs: ${ddrMOs.length}`);
  ddrMOs.forEach(mo => console.log(`    ${mo.DOC_NO} [${mo.STATUS}] - ${mo.DOC_TYPE}`));

  const ddrPOs = await ddrFactory.findReceivablePOs();
  console.log(`\n  Receivable POs: ${ddrPOs.length}`);
  ddrPOs.forEach(po => console.log(`    ${po.DOC_NO} [${po.STATUS}] - ${po.VENDOR_NAME}`));

  const ddrOnhand = await ddrFactory.findItemsWithOnhand(10);
  console.log(`\n  Items with Onhand: ${ddrOnhand.length}`);
  ddrOnhand.forEach(oh => console.log(`    ${oh.ITEM_CODE} @ ${oh.SUBINV_CODE}/${oh.LOCATION_CODE}: ${oh.QTY} ${oh.UOM}`));

  console.log('\n✅ Seed report complete!');
  console.log('💡 If data is insufficient, run with --create flag to generate test records');

  await closeAllPools();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
