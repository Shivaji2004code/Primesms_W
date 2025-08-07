#!/usr/bin/env node

/**
 * Test Script to Send Image Template Message
 * This tests the complete flow from template creation to message sending
 */

const axios = require('axios');

console.log('🧪 TESTING IMAGE TEMPLATE MESSAGE SENDING');
console.log('=======================================\n');

const API_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

// Template we created earlier
const TEMPLATE_NAME = 'test_img_template_1754463683140';

async function testSendImageTemplate() {
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
    const cookieHeader = cookies ? cookies.join('; ') : '';
    
    // Step 2: Send template message using quick-send
    console.log('\\n📤 Step 2: Sending image template message...');
    console.log(`Using template: ${TEMPLATE_NAME}`);
    
    const quickSendPayload = {
      phone_number_id: '711843948681844', // From harsha's business info
      template_name: TEMPLATE_NAME,
      language: 'en_US',
      variables: {
        '1': 'Test User' // The template has one variable {{1}}
      },
      recipients_text: '919398424270', // Test phone number (replace with your number)
      campaign_name: 'Test Image Template Send'
    };
    
    console.log('📋 Quick send payload:', quickSendPayload);
    console.log('📤 Sending template message...');
    
    const sendResponse = await axios.post(`${API_URL}/api/whatsapp/quick-send`, quickSendPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (sendResponse.status === 200 && sendResponse.data.success) {
      console.log('🎉 IMAGE TEMPLATE MESSAGE SENT SUCCESSFULLY!');
      console.log('📊 Results:');
      console.log(`   Campaign ID: ${sendResponse.data.data.campaign_id}`);
      console.log(`   Total Recipients: ${sendResponse.data.data.total_recipients}`);
      console.log(`   Successful Sends: ${sendResponse.data.data.successful_sends}`);
      console.log(`   Failed Sends: ${sendResponse.data.data.failed_sends}`);
      console.log('📸 This confirms our complete image template flow is working!');
    } else {
      console.log('❌ Template message sending failed');
      console.log('Response:', sendResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 400) {
        console.error('\\n📝 This might be due to:');
        console.error('   - Template not found or not approved');
        console.error('   - Invalid phone number format');
        console.error('   - Missing or incorrect variables');
        console.error('   - WhatsApp API issues with media handling');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testSendImageTemplate();