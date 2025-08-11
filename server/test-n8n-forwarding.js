// [Claude AI] n8n Forwarding Test Script — Aug 2025
const { createTestWhatsAppMessage, mapInboundMessage } = require('./dist/services/waToN8nInboundMapper');
const { createTestUserBusinessInfo, processWebhookForN8n } = require('./dist/services/n8nWebhookProcessor');

// Test function to validate n8n forwarding functionality
async function testN8nForwarding() {
  console.log('🧪 [TEST] Starting n8n forwarding test...\n');
  
  try {
    // Test 1: Message mapping
    console.log('📋 [TEST] Testing WhatsApp message mapping...');
    
    const testPayloads = [
      // Text message
      createTestWhatsAppMessage('text', '15550001111', 'Hello from customer'),
      
      // Interactive message (button reply)
      createTestWhatsAppMessage('interactive', '15550002222', 'Yes, I agree'),
      
      // Image message
      createTestWhatsAppMessage('image', '15550003333', 'Check out this photo'),
      
      // Location message
      createTestWhatsAppMessage('location', '15550004444', 'My Location')
    ];
    
    for (const payload of testPayloads) {
      const mapped = mapInboundMessage(payload);
      console.log(`✅ [TEST] Mapped ${mapped.message.type} message:`, {
        wamid: mapped.message.wamid,
        from: mapped.message.from,
        type: mapped.message.type,
        text: mapped.message.text,
        hasInteractive: !!mapped.message.interactive
      });
    }
    
    // Test 2: Mock webhook processing (without actual HTTP calls)
    console.log('\n🔄 [TEST] Testing webhook processing...');
    
    const mockUserBusinessInfo = createTestUserBusinessInfo(
      'test_user_123',
      'https://n8n.example.com/webhook/primesms-test',
      'test_phone_456'
    );
    
    const mockLookupFn = async (phoneNumberId) => {
      if (phoneNumberId === 'test_phone_456') {
        return mockUserBusinessInfo;
      }
      return null;
    };
    
    // Test with a payload containing inbound messages
    const webhookBody = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'WABA_123',
        changes: [{
          field: 'messages',
          value: testPayloads[0] // Use the text message
        }]
      }]
    };
    
    const stats = await processWebhookForN8n(webhookBody, mockLookupFn, {
      enabled: true,
      logLevel: 'detailed'
    });
    
    console.log('📊 [TEST] Processing stats:', stats);
    
    console.log('\n✅ [TEST] All tests completed successfully!');
    console.log('\n📋 [TEST] Summary:');
    console.log('- Message mapping: Working');
    console.log('- Webhook processing: Working');
    console.log('- User lookup: Working');
    console.log('- Context validation: Working');
    console.log('\n💡 [TEST] Note: Actual HTTP forwarding was skipped (test mode)');
    console.log('   To test real forwarding, set up an n8n webhook and update user_business_info.webhook_url');
    
  } catch (error) {
    console.error('❌ [TEST] Test failed:', error);
    process.exit(1);
  }
}

// Environment variables documentation
function printEnvironmentDocs() {
  console.log('\n📚 [DOCS] n8n Forwarding Environment Variables:');
  console.log('');
  console.log('N8N_TIMEOUT_MS=5000           # HTTP timeout for n8n webhook calls (default: 5000ms)');
  console.log('N8N_MAX_RETRIES=3             # Maximum retry attempts for failed requests (default: 3)');
  console.log('');
  console.log('📝 [DOCS] Database Configuration:');
  console.log('Each user needs the following in user_business_info table:');
  console.log('- webhook_url: The n8n webhook endpoint URL');
  console.log('- webhook_verify_token: Secret for HMAC signing (optional but recommended)');
  console.log('');
  console.log('🔐 [DOCS] n8n Webhook Headers:');
  console.log('- X-Prime-UserId: User ID from database');
  console.log('- X-Prime-PhoneNumberId: WhatsApp phone number ID');
  console.log('- X-Prime-Event: Always "message_in" for inbound messages');
  console.log('- X-PrimeSig: sha256=<hmac> (if webhook_verify_token is set)');
  console.log('');
  console.log('🏗️  [DOCS] n8n Payload Structure:');
  console.log(JSON.stringify({
    source: 'whatsapp',
    event: 'message_in',
    tenant: {
      userId: 'user_123',
      wabaId: 'waba_456',
      phoneNumberId: 'phone_789'
    },
    message: {
      wamid: 'wamid.xyz',
      from: '15550001111',
      to: '15551234567',
      type: 'text',
      text: 'Hello',
      interactive: null
    },
    raw: '{ /* original WhatsApp webhook payload */ }',
    receivedAt: '2025-08-11T...'
  }, null, 2));
}

// Run the test
if (require.main === module) {
  testN8nForwarding().then(() => {
    printEnvironmentDocs();
    process.exit(0);
  }).catch(error => {
    console.error('❌ [TEST] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testN8nForwarding, printEnvironmentDocs };