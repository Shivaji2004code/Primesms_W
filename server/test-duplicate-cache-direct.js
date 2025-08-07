// Direct test of duplicate detection cache functionality
const { checkAndHandleDuplicate } = require('./dist/middleware/duplicateDetection');

async function testDirectDuplicateDetection() {
  console.log('🧪 Testing Direct Duplicate Detection Cache\n');
  
  const testUserId = 'test-user-123';
  const templateName = 'edi_mp';
  const phone = '919398424270';
  const variables1 = { '1': '123456' };
  const variables2 = { '1': '123456' }; // Same
  const variables3 = { '1': '654321' }; // Different
  
  try {
    console.log('📝 Test 1 - First message (should be allowed):');
    const result1 = await checkAndHandleDuplicate(testUserId, templateName, phone, variables1);
    console.log(`   isDuplicate: ${result1.isDuplicate}`);
    console.log(`   hash: ${result1.hash.substring(0, 16)}...`);
    console.log('');
    
    console.log('📝 Test 2 - Same message again (should be blocked):');
    const result2 = await checkAndHandleDuplicate(testUserId, templateName, phone, variables2);
    console.log(`   isDuplicate: ${result2.isDuplicate}`);  
    console.log(`   hash: ${result2.hash.substring(0, 16)}...`);
    console.log('');
    
    console.log('📝 Test 3 - Different variables (should be allowed):');
    const result3 = await checkAndHandleDuplicate(testUserId, templateName, phone, variables3);
    console.log(`   isDuplicate: ${result3.isDuplicate}`);
    console.log(`   hash: ${result3.hash.substring(0, 16)}...`);
    console.log('');
    
    console.log('✅ Direct Cache Test Complete!');
    console.log('\nExpected Results:');
    console.log('- Test 1: isDuplicate = false (first message)');
    console.log('- Test 2: isDuplicate = true (duplicate detected)'); 
    console.log('- Test 3: isDuplicate = false (different variables)');
    
    // Verify hashes
    console.log('\nHash Verification:');
    console.log(`- Test 1 & 2 should have same hash: ${result1.hash === result2.hash ? '✅' : '❌'}`);
    console.log(`- Test 1 & 3 should have different hash: ${result1.hash !== result3.hash ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectDuplicateDetection();