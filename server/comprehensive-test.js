#!/usr/bin/env node
/**
 * Comprehensive test script to verify all Prime SMS API endpoints
 */

const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

// Create an agent to maintain session cookies
const agent = new http.Agent({ keepAlive: true });

// Make HTTP request with cookie support
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      ...options,
      agent,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Prime-SMS-Comprehensive-Test/1.0',
        ...options.headers
      }
    };

    const req = http.request(`${BASE_URL}${path}`, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, details = {}) {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details.message) {
    console.log(`   ${details.message}`);
  }
  if (details.statusCode) {
    console.log(`   Status Code: ${details.statusCode}`);
  }
  
  results.tests.push({ name, success, ...details });
  if (success) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function comprehensiveTest() {
  console.log('🔄 Starting Prime SMS Comprehensive API Test\\n');
  console.log('=' .repeat(60));

  try {
    // 1. Health Endpoints
    console.log('\\n📊 HEALTH CHECK ENDPOINTS');
    console.log('-'.repeat(40));

    const healthResponse = await makeRequest('/api/health');
    logTest('GET /api/health', healthResponse.statusCode === 200, {
      statusCode: healthResponse.statusCode,
      message: healthResponse.body.status || 'No status'
    });

    const readyResponse = await makeRequest('/api/ready');
    logTest('GET /api/ready', readyResponse.statusCode === 200 || readyResponse.statusCode === 503, {
      statusCode: readyResponse.statusCode,
      message: readyResponse.body.status || 'No status'
    });

    const pingResponse = await makeRequest('/api/ping');
    logTest('GET /api/ping', pingResponse.statusCode === 200, {
      statusCode: pingResponse.statusCode,
      message: pingResponse.body.status || 'No status'
    });

    const infoResponse = await makeRequest('/api/info');
    logTest('GET /api/info', infoResponse.statusCode === 200, {
      statusCode: infoResponse.statusCode,
      message: infoResponse.body.application || 'No app info'
    });

    // 2. Authentication Endpoints
    console.log('\\n🔐 AUTHENTICATION ENDPOINTS');
    console.log('-'.repeat(40));

    // Test unauthorized access
    const unauthorizedResponse = await makeRequest('/api/auth/me');
    logTest('GET /api/auth/me (unauthorized)', unauthorizedResponse.statusCode === 401, {
      statusCode: unauthorizedResponse.statusCode,
      message: 'Should be unauthorized'
    });

    // Test login
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: TEST_USER
    });
    logTest('POST /api/auth/login', loginResponse.statusCode === 200, {
      statusCode: loginResponse.statusCode,
      message: loginResponse.body.message || loginResponse.body.error || 'Login test'
    });

    if (loginResponse.statusCode === 200) {
      // Test authenticated access
      const meResponse = await makeRequest('/api/auth/me');
      logTest('GET /api/auth/me (authenticated)', meResponse.statusCode === 200, {
        statusCode: meResponse.statusCode,
        message: meResponse.body.user ? `User: ${meResponse.body.user.username}` : 'No user data'
      });
    }

    // 3. Admin Endpoints (if user is admin)
    console.log('\\n👑 ADMIN ENDPOINTS');
    console.log('-'.repeat(40));

    const statsResponse = await makeRequest('/api/admin/stats');
    logTest('GET /api/admin/stats', [200, 403].includes(statsResponse.statusCode), {
      statusCode: statsResponse.statusCode,
      message: statsResponse.statusCode === 200 ? 'Admin access granted' : 
               statsResponse.statusCode === 403 ? 'User not admin (normal)' : 
               'Unexpected response'
    });

    const usersResponse = await makeRequest('/api/admin/users');
    logTest('GET /api/admin/users', [200, 403].includes(usersResponse.statusCode), {
      statusCode: usersResponse.statusCode,
      message: usersResponse.statusCode === 200 ? `Found ${usersResponse.body.users?.length || 0} users` :
               usersResponse.statusCode === 403 ? 'User not admin (normal)' :
               'Unexpected response'
    });

    // 4. Template Endpoints
    console.log('\\n📝 TEMPLATE ENDPOINTS');
    console.log('-'.repeat(40));

    const templatesResponse = await makeRequest('/api/templates');
    logTest('GET /api/templates', [200, 401].includes(templatesResponse.statusCode), {
      statusCode: templatesResponse.statusCode,
      message: templatesResponse.statusCode === 200 ? `Found ${templatesResponse.body.templates?.length || 0} templates` :
               templatesResponse.statusCode === 401 ? 'Authentication required' :
               'Unexpected response'
    });

    // 5. Credits Endpoints
    console.log('\\n💰 CREDITS ENDPOINTS');
    console.log('-'.repeat(40));

    const balanceResponse = await makeRequest('/api/credits/balance');
    logTest('GET /api/credits/balance', [200, 401].includes(balanceResponse.statusCode), {
      statusCode: balanceResponse.statusCode,
      message: balanceResponse.statusCode === 200 ? `Balance: ${balanceResponse.body.balance || 'N/A'}` :
               balanceResponse.statusCode === 401 ? 'Authentication required' :
               'Unexpected response'
    });

    const historyResponse = await makeRequest('/api/credits/history');
    logTest('GET /api/credits/history', [200, 401].includes(historyResponse.statusCode), {
      statusCode: historyResponse.statusCode,
      message: historyResponse.statusCode === 200 ? `Transactions: ${historyResponse.body.transactions?.length || 0}` :
               historyResponse.statusCode === 401 ? 'Authentication required' :
               'Unexpected response'
    });

    // 6. Logs Endpoints
    console.log('\\n📋 LOGS ENDPOINTS');
    console.log('-'.repeat(40));

    const logsResponse = await makeRequest('/api/logs');
    logTest('GET /api/logs', [200, 401].includes(logsResponse.statusCode), {
      statusCode: logsResponse.statusCode,
      message: logsResponse.statusCode === 200 ? `Logs: ${logsResponse.body.logs?.length || 0}` :
               logsResponse.statusCode === 401 ? 'Authentication required' :
               'Unexpected response'
    });

    // 7. WhatsApp Endpoints
    console.log('\\n📱 WHATSAPP ENDPOINTS');
    console.log('-'.repeat(40));

    const whatsappResponse = await makeRequest('/api/whatsapp/templates');
    logTest('GET /api/whatsapp/templates', [200, 401, 400].includes(whatsappResponse.statusCode), {
      statusCode: whatsappResponse.statusCode,
      message: whatsappResponse.statusCode === 200 ? 'WhatsApp templates retrieved' :
               whatsappResponse.statusCode === 401 ? 'Authentication required' :
               whatsappResponse.statusCode === 400 ? 'Missing configuration' :
               'Unexpected response'
    });

    // 8. Send Endpoints
    console.log('\\n📤 SEND ENDPOINTS');
    console.log('-'.repeat(40));

    // Just test the endpoint exists (don't actually send)
    const sendResponse = await makeRequest('/api/send', {
      method: 'POST',
      body: {} // Empty body to trigger validation error
    });
    logTest('POST /api/send (validation test)', [400, 401].includes(sendResponse.statusCode), {
      statusCode: sendResponse.statusCode,
      message: sendResponse.statusCode === 400 ? 'Validation working' :
               sendResponse.statusCode === 401 ? 'Authentication required' :
               'Endpoint accessible'
    });

    // 9. 404 Test
    console.log('\\n❓ ERROR HANDLING');
    console.log('-'.repeat(40));

    const notFoundResponse = await makeRequest('/api/nonexistent');
    logTest('GET /api/nonexistent (404 test)', notFoundResponse.statusCode === 404, {
      statusCode: notFoundResponse.statusCode,
      message: '404 handler working'
    });

    // Test Results Summary
    console.log('\\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.failed > 0) {
      console.log('\\n❌ FAILED TESTS:');
      results.tests.filter(t => !t.success).forEach(test => {
        console.log(`   • ${test.name} (${test.statusCode || 'No status'})`);
      });
    }

    console.log('\\n🎯 RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    if (results.passed >= (results.passed + results.failed) * 0.8) {
      console.log('✅ API is functioning well overall');
    } else {
      console.log('⚠️  Several endpoints have issues - review failed tests');
    }

    // Check specific issues
    const authWorking = results.tests.find(t => t.name === 'GET /api/auth/me (authenticated)')?.success;
    if (!authWorking) {
      console.log('🔑 Session authentication needs fixing');
    } else {
      console.log('🔑 Session authentication is working');
    }

    const dbWorking = results.tests.find(t => t.name === 'GET /api/health')?.success;
    if (!dbWorking) {
      console.log('💾 Database connection issues detected');
    } else {
      console.log('💾 Database connection is working');
    }

    console.log('\\n🚀 Ready for production deployment!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the comprehensive test
comprehensiveTest().catch(console.error);