#!/usr/bin/env node

/**
 * Test Script to verify Quick-Send rejects CSV format
 */

const axios = require('axios');

console.log('🧪 TESTING QUICK-SEND CSV REJECTION');
console.log('==================================\n');

const API_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

async function testQuickSendCSVRejection() {
  let cookieHeader = '';
  
  try {
    // Step 1: Login as harsha
    console.log('🔑 Step 1: Logging in as harsha...');
    
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login successful!');
    
    // Get cookies for session
    const cookies = loginResponse.headers['set-cookie'];
    cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Step 2: Try to send with CSV format (should be rejected)
    console.log('\n🚫 Step 2: Testing CSV format rejection...');
    
    const csvPayload = {
      phone_number_id: '711843948681844',
      template_name: 'test_img_template_1754463683140',
      language: 'en_US',
      variables: { '1': 'Static Variable' },
      recipients_text: '919398424270,John Doe\n918765432109,Jane Smith', // CSV format
      campaign_name: 'Test CSV Rejection'
    };
    
    console.log('📋 Trying to send with CSV format...');
    
    const csvResponse = await axios.post(`${API_URL}/api/whatsapp/quick-send`, csvPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      timeout: 10000
    });
    
    // This should not succeed
    console.log('❌ ERROR: CSV format was accepted when it should have been rejected!');
    console.log('Response:', csvResponse.data);
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      const errorData = error.response.data;
      if (errorData.error && errorData.error.includes('Quick-send only supports phone numbers')) {
        console.log('✅ CSV FORMAT PROPERLY REJECTED!');
        console.log('🔍 Error message:', errorData.error);
        console.log('📊 Details:', errorData.details);
        
        // Step 3: Test that simple phone numbers still work
        console.log('\n📞 Step 3: Testing simple phone numbers (should work)...');
        
        const simplePayload = {
          phone_number_id: '711843948681844',
          template_name: 'test_img_template_1754463683140',
          language: 'en_US',
          variables: { '1': 'Static Variable' },
          recipients_text: '919398424270\n918765432109', // Simple format
          campaign_name: 'Test Simple Format'
        };
        
        try {
          const simpleResponse = await axios.post(`${API_URL}/api/whatsapp/quick-send`, simplePayload, {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieHeader
            },
            timeout: 30000
          });
          
          if (simpleResponse.status === 200 && simpleResponse.data.success) {
            console.log('✅ SIMPLE PHONE NUMBERS WORK CORRECTLY!');
            console.log('📊 Results:');
            console.log(`   Campaign ID: ${simpleResponse.data.data.campaign_id}`);
            console.log(`   Total Recipients: ${simpleResponse.data.data.total_recipients}`);
            console.log(`   Successful Sends: ${simpleResponse.data.data.successful_sends}`);
            console.log(`   Failed Sends: ${simpleResponse.data.data.failed_sends}`);
            console.log('\n🎉 QUICK-SEND RESTRICTION TO STATIC VARIABLES IS WORKING!');
          } else {
            console.log('⚠️ Simple format failed:', simpleResponse.data);
          }
        } catch (simpleError) {
          console.log('⚠️ Simple format test failed:', simpleError.response?.data || simpleError.message);
        }
        
      } else {
        console.log('❌ Wrong error message. Expected CSV rejection but got:', errorData.error);
      }
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Run the test
testQuickSendCSVRejection();