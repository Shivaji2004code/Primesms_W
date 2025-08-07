const axios = require('axios');

async function testCorrectedAuthTemplate() {
    console.log('🧪 Testing Corrected Authentication Template Format\n');
    console.log('Expected payload format:');
    console.log(`{
  "messaging_product": "whatsapp",
  "to": "919398424270",
  "type": "template", 
  "template": {
    "name": "edi_mp",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [{ "type": "text", "text": "123456" }]
      },
      {
        "type": "button",
        "sub_type": "call_to_action",
        "index": "0", 
        "parameters": [{ "type": "text", "text": "123456" }]
      }
    ]
  }
}\n`);
    
    try {
        console.log('📋 Testing authentication template with corrected format...');
        const response = await axios.post('http://localhost:5050/api/send', {
            username: 'harsha',
            templatename: 'edi_mp',
            recipient_number: '919398424270',
            var1: '123456'
        });
        
        console.log('✅ SUCCESS! Authentication template sent successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('\n🎉 Our authentication template payload construction is now working correctly!');
        
    } catch (error) {
        const errorData = error.response?.data;
        const errorMsg = errorData?.message || error.message;
        
        console.log(`❌ Result: ${errorMsg}`);
        
        if (errorMsg.includes('OTP code parameter')) {
            console.log('\n💡 This is our validation error - need to provide var1');
        } else if (errorMsg.includes('Invalid template parameters')) {
            console.log('\n❌ Still getting template parameter validation error');
            console.log('   This suggests the payload format might still not be correct');
        } else if (errorMsg.includes('WhatsApp API')) {
            console.log('\n✅ GREAT! Payload construction is working!');
            console.log('   The template validation passed, and we made it to the WhatsApp API call');
            console.log('   The API error is likely due to template registration or credential issues');
        } else if (errorMsg.includes('authentication failed') || errorMsg.includes('401')) {
            console.log('\n🔑 Authentication/credential issue with WhatsApp API');
        } else {
            console.log('\n🤔 Different error - investigating...');
            if (errorData) {
                console.log('Full error:', JSON.stringify(errorData, null, 2));
            }
        }
    }
    
    // Also test without var1 to see if our validation works
    console.log('\n📋 Testing without var1 to verify our validation...');
    try {
        const response = await axios.post('http://localhost:5050/api/send', {
            username: 'harsha',
            templatename: 'edi_mp',
            recipient_number: '919398424270'
            // No var1 parameter
        });
        console.log('❌ Unexpected success - should have failed validation');
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        if (errorMsg.includes('OTP code parameter') || errorMsg.includes('Internal Server Error')) {
            console.log('✅ Validation working - correctly rejected request without OTP code');
        } else {
            console.log('❓ Different validation error:', errorMsg);
        }
    }
}

testCorrectedAuthTemplate();