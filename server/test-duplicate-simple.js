// Simple test for duplicate detection logic only
const NodeCache = require('node-cache');
const crypto = require('crypto');

// Replicate the duplicate detection logic
const duplicateCache = new NodeCache({ stdTTL: 300 });

function generateMessageHash(templateName, phone, variables) {
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const variablesString = variables ? JSON.stringify(variables, Object.keys(variables).sort()) : '';
  const hashInput = `${templateName}|${normalizedPhone}|${variablesString}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

function checkDuplicate(templateName, phone, variables) {
  const messageHash = generateMessageHash(templateName, phone, variables);
  const cacheKey = `msg_${messageHash}`;
  const isDuplicate = duplicateCache.get(cacheKey);
  
  if (!isDuplicate) {
    duplicateCache.set(cacheKey, {
      timestamp: Date.now(),
      templateName,
      phone,
      variables
    });
  }
  
  return { isDuplicate: !!isDuplicate, hash: messageHash };
}

// Test with your exact data from the logs
console.log('🧪 Testing Duplicate Detection with Your Data\n');

const templateName = 'edi_mp';  
const phone = '919398424270';
const variables = { '1': '123456' };

console.log(`Template: ${templateName}`);
console.log(`Phone: ${phone}`);
console.log(`Variables:`, variables);
console.log('');

// Test 1: First message
console.log('📝 Test 1 - First message:');
const result1 = checkDuplicate(templateName, phone, variables);
console.log(`   isDuplicate: ${result1.isDuplicate} ✅`);
console.log(`   hash: ${result1.hash.substring(0, 20)}...`);

// Test 2: Exact same message (should be duplicate)
console.log('\n📝 Test 2 - Same message again:');
const result2 = checkDuplicate(templateName, phone, variables);
console.log(`   isDuplicate: ${result2.isDuplicate} ${result2.isDuplicate ? '✅' : '❌'}`);
console.log(`   hash: ${result2.hash.substring(0, 20)}...`);

// Test 3: Different variables
console.log('\n📝 Test 3 - Different variables:');
const result3 = checkDuplicate(templateName, phone, { '1': '654321' });
console.log(`   isDuplicate: ${result3.isDuplicate} ${!result3.isDuplicate ? '✅' : '❌'}`);
console.log(`   hash: ${result3.hash.substring(0, 20)}...`);

// Test 4: Different phone
console.log('\n📝 Test 4 - Different phone:');
const result4 = checkDuplicate(templateName, '919876543210', variables);
console.log(`   isDuplicate: ${result4.isDuplicate} ${!result4.isDuplicate ? '✅' : '❌'}`);
console.log(`   hash: ${result4.hash.substring(0, 20)}...`);

console.log('\n✅ All tests completed!');
console.log('\nHash comparison:');
console.log(`Same message hashes match: ${result1.hash === result2.hash ? '✅' : '❌'}`);
console.log(`Different var hashes differ: ${result1.hash !== result3.hash ? '✅' : '❌'}`);
console.log(`Different phone hashes differ: ${result1.hash !== result4.hash ? '✅' : '❌'}`);

// Show cache stats
console.log(`\nCache keys count: ${duplicateCache.keys().length}`);