#!/usr/bin/env node

/**
 * Test Script to Send Image Template Message with File Upload
 * This tests the complete flow with actual image upload
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING IMAGE TEMPLATE MESSAGE WITH IMAGE UPLOAD');
console.log('================================================\n');

const API_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

// Template we created earlier
const TEMPLATE_NAME = 'test_img_template_1754463683140';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-images', 'test-template.png'); // Use our test image

async function testSendImageTemplateWithUpload() {
  try {
    // Check if test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('❌ Test image not found at:', TEST_IMAGE_PATH);
      console.log('Please ensure test-template.png exists in the test-images directory');
      return;
    }

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
    
    // Step 2: Send template message with image upload
    console.log('\n📤 Step 2: Sending image template message with image upload...');
    console.log(`Using template: ${TEMPLATE_NAME}`);
    
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('phone_number_id', '711843948681844');
    formData.append('template_name', TEMPLATE_NAME);
    formData.append('language', 'en_US');
    formData.append('variables', JSON.stringify({ '1': 'Test User' }));
    formData.append('recipients_text', '919398424270'); // Test phone number
    formData.append('campaign_name', 'Test Image Template Send with Upload');
    
    // Add the image file
    formData.append('headerImage', fs.createReadStream(TEST_IMAGE_PATH));
    
    console.log('📋 Sending template message with image...');
    
    const sendResponse = await axios.post(`${API_URL}/api/whatsapp/quick-send`, formData, {
      headers: {
        ...formData.getHeaders(),
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
      console.log('📸 Complete image template flow with upload is working!');
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
        console.error('\n📝 This might be due to:');
        console.error('   - Template not found or not approved');
        console.error('   - Invalid phone number format');
        console.error('   - Missing or incorrect variables');
        console.error('   - Image upload or media handling issues');
        console.error('   - WhatsApp API issues');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testSendImageTemplateWithUpload();