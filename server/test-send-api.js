const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5050';
const TEST_DATA = {
  valid_user: 'harsha',
  invalid_user: 'nonexistent',
  valid_template: 'welcome_message',
  invalid_template: 'nonexistent_template',
  valid_phone: '+1234567890',
  invalid_phone: '1234567890'
};

console.log('🧪 Testing Prime SMS Send API\n');

// Test cases
const tests = [
  {
    name: 'Test 1: Missing required parameters',
    method: 'GET',
    url: `${BASE_URL}/api/send`,
    expectedStatus: 400
  },
  {
    name: 'Test 2: Invalid username',
    method: 'GET', 
    url: `${BASE_URL}/api/send?username=${TEST_DATA.invalid_user}&templatename=${TEST_DATA.valid_template}&recipient_number=${encodeURIComponent(TEST_DATA.valid_phone)}`,
    expectedStatus: 401
  },
  {
    name: 'Test 3: Invalid template name',
    method: 'GET',
    url: `${BASE_URL}/api/send?username=${TEST_DATA.valid_user}&templatename=${TEST_DATA.invalid_template}&recipient_number=${encodeURIComponent(TEST_DATA.valid_phone)}`,
    expectedStatus: 404
  },
  {
    name: 'Test 4: Invalid phone number format',
    method: 'GET',
    url: `${BASE_URL}/api/send?username=${TEST_DATA.valid_user}&templatename=${TEST_DATA.valid_template}&recipient_number=${TEST_DATA.invalid_phone}`,
    expectedStatus: 400
  },
  {
    name: 'Test 5: Valid GET request (will attempt to send - expect 502 due to test credentials)',
    method: 'GET',
    url: `${BASE_URL}/api/send?username=${TEST_DATA.valid_user}&templatename=${TEST_DATA.valid_template}&recipient_number=${encodeURIComponent(TEST_DATA.valid_phone)}&var1=Test%20User`,
    expectedStatus: [200, 502] // 200 if credentials work, 502 if test credentials fail
  },
  {
    name: 'Test 6: Valid POST request (will attempt to send)',
    method: 'POST',
    url: `${BASE_URL}/api/send`,
    data: {
      username: TEST_DATA.valid_user,
      templatename: TEST_DATA.valid_template,
      recipient_number: TEST_DATA.valid_phone,
      var1: 'Test User'
    },
    expectedStatus: [200, 502]
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n${test.name}`);
      console.log(`${test.method} ${test.url}`);
      
      let response;
      if (test.method === 'POST') {
        response = await axios.post(test.url, test.data, {
          validateStatus: () => true // Don't throw on any status code
        });
      } else {
        response = await axios.get(test.url, {
          validateStatus: () => true
        });
      }

      const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
      const isStatusValid = expectedStatuses.includes(response.status);
      
      console.log(`Status: ${response.status} (Expected: ${expectedStatuses.join(' or ')})`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
      
      if (isStatusValid) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED');
        failed++;
      }
      
    } catch (error) {
      console.log('❌ FAILED with error:', error.message);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Server is running');
    console.log('Health check response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server is not responding');
    console.log('Error:', error.message);
    console.log('\nPlease start the server first:');
    console.log('cd server && npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking server status...');
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);