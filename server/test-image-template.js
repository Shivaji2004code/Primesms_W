#!/usr/bin/env node

/**
 * Test Script to Create Image Template for User Harsha
 * This script tests the image template creation with our fixes
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING IMAGE TEMPLATE CREATION FOR USER HARSHA');
console.log('===============================================\n');

const API_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

const TEST_IMAGE_PATH = path.join(__dirname, 'test-images', 'test-template.png');

async function testImageTemplateCreation() {
  try {
    // Verify test image exists
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.error('❌ Test image not found:', TEST_IMAGE_PATH);
      console.log('Please run: node create-test-image.js first');
      return;
    }
    
    const imageStats = fs.statSync(TEST_IMAGE_PATH);
    console.log(`📁 Test image: ${TEST_IMAGE_PATH}`);
    console.log(`📊 Image size: ${imageStats.size} bytes`);
    
    // Step 1: Login as harsha
    console.log('\\n🔑 Step 1: Logging in as harsha...');
    
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
    
    // Step 2: Create image template
    console.log('\\n📷 Step 2: Creating image template...');
    console.log('This will test our media upload and template creation fixes!');
    
    const imageTemplateForm = new FormData();
    imageTemplateForm.append('name', 'test_img_template_' + Date.now());
    imageTemplateForm.append('category', 'UTILITY');
    imageTemplateForm.append('language', 'en_US');
    imageTemplateForm.append('bodyText', 'Hello, this is a test template with image header and variable {{1}}');
    imageTemplateForm.append('variableExamples', JSON.stringify({ '1': 'John Doe' }));
    imageTemplateForm.append('headerMedia', fs.createReadStream(TEST_IMAGE_PATH));
    imageTemplateForm.append('submit_to_whatsapp', 'true');
    
    console.log('📤 Uploading image and creating template...');
    
    const imageTemplateResponse = await axios.post(`${API_URL}/api/templates`, imageTemplateForm, {
      headers: {
        ...imageTemplateForm.getHeaders(),
        'Cookie': cookieHeader
      },
      timeout: 30000 // 30 second timeout for upload
    });
    
    if (imageTemplateResponse.status === 201) {
      console.log('🎉 IMAGE TEMPLATE CREATED SUCCESSFULLY!');
      console.log('📋 Template ID:', imageTemplateResponse.data.template?.id);
      console.log('📊 Template Name:', imageTemplateResponse.data.template?.name);
      console.log('📸 This confirms our media upload fix is working!');
    } else {
      console.log('❌ Image template creation failed');
      console.log('Response:', imageTemplateResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 400) {
        console.error('\\n📝 This might be due to:');
        console.error('   - Media upload failing (our fix should resolve this)');
        console.error('   - Template creation parameters');
        console.error('   - WhatsApp API issues');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testImageTemplateCreation();