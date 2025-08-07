// Test script for duplicate detection functionality
const NodeCache = require('node-cache');
const crypto = require('crypto');

// Test the duplicate detection logic
console.log('🧪 Testing Duplicate Detection Logic\n');

// Simulate the cache with 5 minute TTL
const testCache = new NodeCache({ stdTTL: 300 });

// Function to generate message hash (copied from middleware)
function generateMessageHash(templateName, phone, variables) {
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const variablesString = variables ? JSON.stringify(variables, Object.keys(variables).sort()) : '';
  const hashInput = `${templateName}|${normalizedPhone}|${variablesString}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

// Test messages
const testMessages = [
  { template: 'welcome_message', phone: '919876543210', variables: { name: 'John', code: '123' } },
  { template: 'welcome_message', phone: '+919876543210', variables: { name: 'John', code: '123' } }, // Same as above (+ prefix)
  { template: 'welcome_message', phone: '919876543210', variables: { name: 'Jane', code: '456' } }, // Different variables
  { template: 'otp_message', phone: '919876543210', variables: { code: '789' } }, // Different template
  { template: 'welcome_message', phone: '919876543211', variables: { name: 'John', code: '123' } }, // Different phone
];

console.log('Test Messages:');
testMessages.forEach((msg, i) => {
  console.log(`${i + 1}. Template: ${msg.template}, Phone: ${msg.phone}, Variables:`, msg.variables);
});

console.log('\n🔍 Testing Hash Generation and Duplicate Detection:\n');

testMessages.forEach((msg, i) => {
  const hash = generateMessageHash(msg.template, msg.phone, msg.variables);
  const cacheKey = `msg_${hash}`;
  const isDuplicate = testCache.get(cacheKey);
  
  console.log(`Message ${i + 1}:`);
  console.log(`  Hash: ${hash.substring(0, 16)}...`);
  console.log(`  Is Duplicate: ${isDuplicate ? '❌ YES' : '✅ NO'}`);
  
  if (!isDuplicate) {
    testCache.set(cacheKey, {
      timestamp: Date.now(),
      templateName: msg.template,
      phone: msg.phone
    });
    console.log(`  Added to cache ✓`);
  }
  
  console.log('');
});

console.log('🔄 Testing Same Message Again (Should be duplicates):\n');

// Test the first two messages again - they should be duplicates now
[testMessages[0], testMessages[1]].forEach((msg, i) => {
  const hash = generateMessageHash(msg.template, msg.phone, msg.variables);
  const cacheKey = `msg_${hash}`;
  const isDuplicate = testCache.get(cacheKey);
  
  console.log(`Retry Message ${i + 1}:`);
  console.log(`  Template: ${msg.template}, Phone: ${msg.phone}`);
  console.log(`  Is Duplicate: ${isDuplicate ? '❌ YES (Expected)' : '⚠️  NO (Unexpected)'}`);
  console.log('');
});

console.log('✅ Duplicate Detection Test Complete');