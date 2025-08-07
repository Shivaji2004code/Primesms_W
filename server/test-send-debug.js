const axios = require('axios');

async function debugSendAPI() {
    console.log('🧪 Debug Send API Issues\n');
    
    try {
        console.log('📋 Testing different phone number formats...');
        
        const formats = [
            '919398424270',  // Original format
            '+919398424270', // With + prefix
            '9398424270',    // Without country code
            '91-939-842-4270' // With dashes
        ];
        
        for (const phoneNumber of formats) {
            try {
                console.log(`\n📞 Testing phone: ${phoneNumber}`);
                const response = await axios.post('http://localhost:5050/api/send', {
                    username: 'harsha',
                    templatename: 'simple_test',
                    recipient_number: phoneNumber,
                    var1: 'test'
                });
                
                console.log(`✅ Success with ${phoneNumber}`);
                console.log(JSON.stringify(response.data, null, 2));
                break; // If one works, stop testing
                
            } catch (error) {
                console.log(`❌ Failed with ${phoneNumber}: ${error.response?.data?.message || error.message}`);
                if (error.response?.data?.details) {
                    console.log('Details:', error.response.data.details);
                }
            }
        }
        
    } catch (error) {
        console.error('Major error:', error);
    }
    
    // Also test credit balance check
    console.log('\n💰 Checking credit balance...');
    try {
        const response = await axios.post('http://localhost:5050/api/send', {
            username: 'harsha',
            templatename: 'simple_test',
            recipient_number: '919398424270'
            // No variables to see if that's the issue
        });
        console.log('✅ Success with no variables');
    } catch (error) {
        console.log('❌ Failed with no variables:', error.response?.data?.message || error.message);
        
        // Check if error mentions credits, templates, phone numbers, etc.
        const errorDetails = error.response?.data;
        if (errorDetails) {
            console.log('\n📊 Full error response:');
            console.log(JSON.stringify(errorDetails, null, 2));
            
            if (errorDetails.message?.includes('credit')) {
                console.log('💸 Issue appears to be credit-related');
            } else if (errorDetails.message?.includes('template')) {
                console.log('📄 Issue appears to be template-related');  
            } else if (errorDetails.message?.includes('number')) {
                console.log('📞 Issue appears to be phone number-related');
            }
        }
    }
}

debugSendAPI();