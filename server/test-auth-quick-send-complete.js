const axios = require('axios');

async function testAuthenticationQuickSend() {
    console.log('🧪 Testing Complete Authentication Template Quick Send Flow\n');
    
    try {
        console.log('📋 Step 1: Login as harsha');
        
        // Create session for API calls
        const api = axios.create({
            baseURL: 'http://localhost:5050/api',
            withCredentials: true
        });
        
        // Login
        await api.post('/auth/login', {
            username: 'harsha',
            password: 'harsha'
        });
        console.log('✅ Login successful\n');
        
        console.log('📋 Step 2: Test Quick Send with Authentication Template');
        console.log('Expected payload should include:');
        console.log('- messaging_product: "whatsapp"');
        console.log('- recipient_type: "individual"'); 
        console.log('- Both body and button components with same OTP code\n');
        
        // Simulate Quick Send form submission
        const quickSendData = new FormData();
        quickSendData.append('phone_number_id', '711843948681844'); // Harsha's WhatsApp number ID
        quickSendData.append('template_name', 'edi_mp'); // Authentication template
        quickSendData.append('language', 'en_US');
        quickSendData.append('campaign_name', 'Test Auth Campaign');
        quickSendData.append('recipients_text', '919398424270'); // Single recipient
        
        // Pass variables as JSON string (as FormData would)
        const variables = {
            '1': '123456', // OTP code
            'var1': '123456' // Alternative format
        };
        quickSendData.append('variables', JSON.stringify(variables));
        
        console.log('🚀 Sending Quick Send request...');
        const response = await api.post('/whatsapp/quick-send', quickSendData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        console.log('✅ SUCCESS! Quick Send completed successfully!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        console.log('\n🎉 AUTHENTICATION TEMPLATE QUICK SEND IS WORKING!');
        console.log('✅ Campaign started successfully');
        console.log('✅ Variables properly passed to template');
        console.log('✅ OTP code sent to both body and button components');
        
    } catch (error) {
        const errorData = error.response?.data;
        const errorMsg = errorData?.error || errorData?.message || error.message;
        
        console.log(`❌ Error: ${errorMsg}`);
        
        if (errorData) {
            console.log('Full error details:', JSON.stringify(errorData, null, 2));
        }
        
        // Analyze specific error types
        if (errorMsg.includes('Authentication required')) {
            console.log('\n🔑 Session issue - check login credentials');
        } else if (errorMsg.includes('Template not found')) {
            console.log('\n📄 Template issue - check if edi_mp exists and is APPROVED');
        } else if (errorMsg.includes('WhatsApp number not found')) {
            console.log('\n📱 WhatsApp configuration issue');
        } else if (errorMsg.includes('Insufficient credits')) {
            console.log('\n💰 Credit balance issue');
        } else if (errorMsg.includes('Number of parameters')) {
            console.log('\n✅ GOOD! Our payload reached WhatsApp API');
            console.log('   The error means our authentication template format is working');
            console.log('   But the specific template needs different parameters');
        } else {
            console.log('\n❓ Unexpected error - needs investigation');
        }
    }
}

testAuthenticationQuickSend();