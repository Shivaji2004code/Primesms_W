const axios = require('axios');

async function debugSendProcess() {
    console.log('🧪 Debug Send Process Step by Step\n');
    
    try {
        // Test different scenarios to isolate where the error occurs
        const testCases = [
            {
                name: 'Authentication template WITH var1',
                params: {
                    username: 'harsha',
                    templatename: 'edi_mp',
                    recipient_number: '919398424270',
                    var1: '123456'
                }
            },
            {
                name: 'Authentication template WITHOUT var1',
                params: {
                    username: 'harsha',
                    templatename: 'edi_mp',
                    recipient_number: '919398424270'
                }
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`📋 Testing: ${testCase.name}`);
            try {
                const response = await axios.post('http://localhost:5050/api/send', testCase.params);
                console.log('✅ SUCCESS');
                console.log(JSON.stringify(response.data, null, 2));
            } catch (error) {
                const errorData = error.response?.data;
                console.log('❌ ERROR:', errorData?.message || error.message);
                
                // Try to identify the specific error
                if (errorData?.message?.includes('OTP code parameter')) {
                    console.log('💡 This is our custom authentication template error - the fix is working!');
                } else if (errorData?.message?.includes('Invalid template parameters')) {
                    console.log('🤔 Generic template validation error - fix might not be reached');
                } else {
                    console.log('❓ Different error type');
                }
                
                if (errorData?.details) {
                    console.log('Details:', errorData.details);
                }
            }
            console.log('');
        }
        
    } catch (error) {
        console.error('Major error:', error);
    }
}

debugSendProcess();