/**
 * WhatsApp Template Message Sender Module
 * 
 * Sends template messages with image headers using WhatsApp Cloud API.
 * Designed for approved templates with static image components.
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Sends a WhatsApp template message with image header
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.phoneNumberId - WhatsApp phone number ID  
 * @param {string} config.accessToken - WhatsApp Cloud API access token
 * @param {string} config.templateName - Approved template name
 * @param {string} config.recipientNumber - Recipient phone number (international format)
 * @param {string} config.mediaId - Uploaded media ID for header image
 * @returns {Promise<Object>} WhatsApp API response
 */
export async function sendTemplateMessage(config) {
  const {
    phoneNumberId = process.env.WH_PHONE_NUMBER_ID,
    accessToken = process.env.WH_ACCESS_TOKEN,
    templateName = process.env.WH_TEMPLATE_NAME,
    recipientNumber = process.env.WH_RECIPIENT_NUMBER,
    mediaId = process.env.WH_MEDIA_ID
  } = config || {};

  // Validate required parameters
  if (!phoneNumberId) throw new Error('Phone Number ID is required');
  if (!accessToken) throw new Error('Access Token is required');
  if (!templateName) throw new Error('Template Name is required');
  if (!recipientNumber) throw new Error('Recipient Number is required');
  if (!mediaId) throw new Error('Media ID is required');

  // Log configuration (without sensitive data)
  console.log('📤 Sending WhatsApp Template Message:');
  console.log(`   - Phone Number ID: ${phoneNumberId}`);
  console.log(`   - Template: ${templateName}`);
  console.log(`   - Recipient: ${recipientNumber}`);
  console.log(`   - Media ID: ${mediaId.substring(0, 20)}...`);

  // Construct the API endpoint
  const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  
  // Build the message payload
  const messagePayload = {
    messaging_product: "whatsapp",
    to: recipientNumber,
    type: "template",
    template: {
      name: templateName,
      language: { 
        code: "en_US" 
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: { 
                id: mediaId 
              }
            }
          ]
        }
      ]
    }
  };

  // Set up request headers
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  console.log('📋 Message Payload:', JSON.stringify(messagePayload, null, 2));

  try {
    // Send the request to WhatsApp Cloud API
    const response = await axios.post(apiUrl, messagePayload, { headers });
    
    // Log successful response
    console.log('✅ Message sent successfully!');
    console.log('📥 WhatsApp Response:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      data: response.data,
      messageId: response.data.messages?.[0]?.id
    };

  } catch (error) {
    // Log error details
    console.error('❌ Failed to send message:');
    console.error('📥 Error Response:', JSON.stringify(error.response?.data || error.message, null, 2));
    
    return {
      success: false,
      error: error.response?.data || { message: error.message },
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText
      }
    };
  }
}

/**
 * Default export for CommonJS compatibility
 */
export default sendTemplateMessage;

// Usage example - Self-invoking async function for testing
(async () => {
  // Only run if this file is executed directly
  if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🧪 Running WhatsApp Template Message Test...\n');
    
    // Test configuration
    const testConfig = {
      phoneNumberId: '711843948681844',
      templateName: 'logoshiworking',
      recipientNumber: '919398424270',
      mediaId: '1140421944578993', // Use simple media ID for messaging
      // accessToken will be loaded from environment
    };
    
    try {
      const result = await sendTemplateMessage(testConfig);
      
      if (result.success) {
        console.log('\n🎉 Test completed successfully!');
        console.log(`📧 Message ID: ${result.messageId}`);
      } else {
        console.log('\n❌ Test failed!');
        console.log('Error details:', result.error);
      }
    } catch (error) {
      console.error('\n💥 Test error:', error.message);
    }
  }
})();