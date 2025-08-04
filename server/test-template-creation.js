#!/usr/bin/env node

// Test script to verify template creation with numerical variables
const axios = require('axios');

async function testTemplateCreation() {
  try {
    // Test template data with numerical variables
    const formData = new FormData();
    formData.append('name', 'test_numerical_template');
    formData.append('category', 'UTILITY');
    formData.append('language', 'en_US');
    formData.append('bodyText', 'Hello {{1}}, your order {{2}} is ready for pickup on {{3}}.');
    formData.append('variableExamples', JSON.stringify({
      '1': 'John',
      '2': '#12345',
      '3': 'January 15th'
    }));
    formData.append('submit_to_whatsapp', 'false'); // Don't submit to WhatsApp for testing

    console.log('🧪 Testing template creation with numerical variables...');
    console.log('📝 Template name: test_numerical_template');
    console.log('📋 Body text: Hello {{1}}, your order {{2}} is ready for pickup on {{3}}.');
    console.log('🏷️ Variable examples: {"1": "John", "2": "#12345", "3": "January 15th"}');

    const response = await fetch('http://localhost:5050/api/templates', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Template creation successful!');
      console.log('📄 Result:', JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Template creation failed:');
      console.log('🔍 Error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🎯 Starting template creation test...');
testTemplateCreation();