/**
 * Cleanup test data from INT environment
 * Run with: npm run data:cleanup
 * Only cleans up records created by the test suite (identified by TEST_ prefix)
 */
import { initDbPool, execute, query, closeAllPools } from '../utils/db';

async function main() {
  console.log('🧹 IWMS Test Data Cleanup');
  console.log('=========================\n');

  await initDbPool(false); // Need RW access

  // Find test-created documents
  const testDocs = await query(`
    SELECT DOC_NO, DOC_TYPE, STATUS, ORG_CODE 
    FROM WMS.TBLDOCBILL 
    WHERE DOC_NO LIKE 'TEST_%'
    ORDER BY CREATE_DATE DESC
  `, {}, false);

  console.log(`Found ${testDocs.length} test documents`);
  
  if (testDocs.length === 0) {
    console.log('Nothing to clean up!');
    await closeAllPools();
    return;
  }

  for (const doc of testDocs) {
    console.log(`  Cleaning: ${doc.DOC_NO} (${doc.DOC_TYPE}) [${doc.STATUS}] in ${doc.ORG_CODE}`);
    try {
      // Delete detail lines first
      await execute(`
        DELETE FROM WMS.TBLDOCBILLDTL 
        WHERE DOC_ID IN (SELECT DOC_ID FROM WMS.TBLDOCBILL WHERE DOC_NO = :docNo)
      `, { docNo: doc.DOC_NO });
      
      // Delete header
      await execute(`
        DELETE FROM WMS.TBLDOCBILL WHERE DOC_NO = :docNo
      `, { docNo: doc.DOC_NO });
      
      console.log(`    ✅ Deleted`);
    } catch (e: any) {
      console.log(`    ❌ Failed: ${e.message}`);
    }
  }

  console.log('\n✅ Cleanup complete!');
  await closeAllPools();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
