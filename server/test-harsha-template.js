#!/usr/bin/env node

/**
 * Test Script to Create Template for User Harsha
 * This script tests the template creation with image header for user harsha
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

console.log('🧪 TESTING TEMPLATE CREATION FOR USER HARSHA');
console.log('===========================================\n');

const API_URL = 'http://localhost:5050';
const TEST_USER = {
  username: 'harsha',
  password: 'harsha'
};

async function testTemplateCreation() {
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
    
    // Step 2: Create a template with text only first
    console.log('\\n📝 Step 2: Creating text template...');
    
    const textTemplateForm = new FormData();
    textTemplateForm.append('name', 'test_text_template_' + Date.now());
    textTemplateForm.append('category', 'UTILITY');
    textTemplateForm.append('language', 'en_US');
    textTemplateForm.append('bodyText', 'Hello, this is a test template with variable {{1}}');
    textTemplateForm.append('variableExamples', JSON.stringify({ '1': 'John Doe' }));
    textTemplateForm.append('submit_to_whatsapp', 'true');
    
    const textTemplateResponse = await axios.post(`${API_URL}/api/templates`, textTemplateForm, {
      headers: {
        ...textTemplateForm.getHeaders(),
        'Cookie': cookieHeader
      }
    });
    
    if (textTemplateResponse.status === 201) {
      console.log('✅ Text template created successfully!');
      console.log('📋 Template ID:', textTemplateResponse.data.template?.id);
    } else {
      console.log('❌ Text template creation failed');
      console.log('Response:', textTemplateResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🔒 Authentication failed - check username/password');
    } else if (error.response?.status === 400) {
      console.error('📝 Template creation failed - check the error details above');
    }
  }
}

// Run the test
testTemplateCreation();