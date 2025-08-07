const axios = require('axios');

async function testAuthTemplateSimple() {
    try {
        console.log('🧪 Testing Authentication Template via Send API...\n');
        
        // Test the send API which has internal authentication - using real auth template
        const response = await axios.post('http://localhost:5050/api/send', {
            username: 'harsha',
            templatename: 'edi_mp', // Real authentication template
            recipient_number: '919398424270',
            var1: '123456' // OTP code
        });
        
        console.log('✅ Send API Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        // Let's try to see what templates exist by direct database query if possible
        console.log('\n🔍 Let me check what we can do...');
        
        // Test with a different approach - check if harsha user exists
        try {
            const testResponse = await axios.post('http://localhost:5050/api/send', {
                username: 'harsha',
                templatename: 'nonexistent_template',
                recipient_number: '919398424270'
            });
        } catch (testError) {
            console.log('Test error response:', testError.response?.data || testError.message);
        }
    }
}

testAuthTemplateSimple();