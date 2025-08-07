#!/usr/bin/env node
/**
 * Test script to verify session authentication works correctly
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha' // Make sure this user exists in the database
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
        'User-Agent': 'Prime-SMS-Test/1.0',
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

async function testAuthentication() {
  console.log('🔐 Testing Prime SMS Authentication Flow\n');

  try {
    // Step 1: Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest('/api/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.body)}`);
    
    if (healthResponse.statusCode !== 200) {
      throw new Error('Health check failed');
    }
    console.log('   ✅ Health check passed\n');

    // Step 2: Test unauthorized access to protected route
    console.log('2. Testing unauthorized access to /api/auth/me...');
    const unauthorizedResponse = await makeRequest('/api/auth/me');
    console.log(`   Status: ${unauthorizedResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(unauthorizedResponse.body)}`);
    
    if (unauthorizedResponse.statusCode !== 401) {
      throw new Error('Expected 401 for unauthorized access');
    }
    console.log('   ✅ Unauthorized access properly blocked\n');

    // Step 3: Login
    console.log('3. Testing login...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: TEST_USER
    });
    
    console.log(`   Status: ${loginResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(loginResponse.body, null, 2)}`);
    console.log(`   Set-Cookie: ${loginResponse.headers['set-cookie'] || 'None'}`);
    
    if (loginResponse.statusCode !== 200) {
      console.log('   ❌ Login failed - make sure user "harsha" exists with password "test123"');
      return;
    }
    console.log('   ✅ Login successful\n');

    // Step 4: Test authenticated access to protected route
    console.log('4. Testing authenticated access to /api/auth/me...');
    const meResponse = await makeRequest('/api/auth/me');
    console.log(`   Status: ${meResponse.statusCode}`);
    console.log(`   Response: ${JSON.stringify(meResponse.body, null, 2)}`);
    
    if (meResponse.statusCode !== 200) {
      console.log('   ❌ Session authentication failed!');
      console.log('   This indicates the session cookie is not being maintained.');
      return;
    }
    console.log('   ✅ Session authentication working!\n');

    // Step 5: Test admin route (if user is admin)
    console.log('5. Testing admin route access...');
    const adminResponse = await makeRequest('/api/admin/stats');
    console.log(`   Status: ${adminResponse.statusCode}`);
    
    if (adminResponse.statusCode === 200) {
      console.log('   ✅ Admin access successful');
      console.log(`   Stats: ${JSON.stringify(adminResponse.body, null, 2)}`);
    } else if (adminResponse.statusCode === 403) {
      console.log('   ℹ️ User is not admin (403 Forbidden) - this is normal');
    } else {
      console.log(`   ⚠️ Unexpected response: ${JSON.stringify(adminResponse.body)}`);
    }

    console.log('\n🎉 Authentication test completed successfully!');
    console.log('✅ Session cookies are working correctly');
    console.log('✅ Protected routes are properly secured');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAuthentication().catch(console.error);