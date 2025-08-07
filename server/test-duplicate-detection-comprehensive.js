// Comprehensive test for duplicate detection with actual request simulation
const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

// Test data
const testMessage1 = {
  username: 'testuser',
  templatename: 'edi_mp',
  recipient_number: '919398424270',
  var1: '123456'
};

const testMessage2 = {
  username: 'testuser', 
  templatename: 'edi_mp',
  recipient_number: '919398424270',
  var1: '123456' // Same as message1 - should be blocked
};

const testMessage3 = {
  username: 'testuser',
  templatename: 'edi_mp', 
  recipient_number: '919398424270',
  var1: '654321' // Different variable - should be allowed
};

async function testDuplicateDetection() {
  console.log('🧪 Testing Comprehensive Duplicate Detection\n');
  
  try {
    console.log('📤 Sending Message 1 (should succeed):');
    console.log('   Template:', testMessage1.templatename);
    console.log('   Phone:', testMessage1.recipient_number);  
    console.log('   Variables:', { var1: testMessage1.var1 });
    
    const response1 = await axios.post(`${BASE_URL}/api/send`, testMessage1);
    console.log('   Result:', response1.data.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   Message ID:', response1.data.message_id || 'N/A');
    console.log('');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📤 Sending Message 2 (should be blocked - duplicate):');
    console.log('   Template:', testMessage2.templatename);
    console.log('   Phone:', testMessage2.recipient_number);
    console.log('   Variables:', { var1: testMessage2.var1 });
    
    try {
      const response2 = await axios.post(`${BASE_URL}/api/send`, testMessage2);
      console.log('   Result: ⚠️ UNEXPECTED SUCCESS - duplicate was not detected!');
      console.log('   Message ID:', response2.data.message_id || 'N/A');
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.duplicate) {
        console.log('   Result: ✅ CORRECTLY BLOCKED as duplicate');
        console.log('   Hash:', error.response.data.hash?.substring(0, 16) + '...');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('   Result: ❌ FAILED for different reason:', error.response?.data || error.message);
      }
    }
    console.log('');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📤 Sending Message 3 (should succeed - different variables):');
    console.log('   Template:', testMessage3.templatename);
    console.log('   Phone:', testMessage3.recipient_number);
    console.log('   Variables:', { var1: testMessage3.var1 });
    
    const response3 = await axios.post(`${BASE_URL}/api/send`, testMessage3);
    console.log('   Result:', response3.data.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('   Message ID:', response3.data.message_id || 'N/A');
    console.log('');
    
    console.log('✅ Duplicate Detection Test Complete!');
    console.log('\nExpected Results:');
    console.log('- Message 1: ✅ Success (first time)');
    console.log('- Message 2: ❌ Blocked (duplicate of Message 1)');
    console.log('- Message 3: ✅ Success (different variables)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testDuplicateDetection();