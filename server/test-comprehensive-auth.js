const axios = require('axios');

async function testAuthFlow() {
    console.log('🧪 Comprehensive Authentication Template Flow Test\n');
    
    try {
        console.log('📋 Step 1: Test with minimal required parameters (just OTP code)');
        const response1 = await axios.post('http://localhost:5050/api/send', {
            username: 'harsha',
            templatename: 'edi_mp',
            recipient_number: '919398424270',
            var1: '123456'
        });
        console.log('✅ Success with var1 (OTP code):');
        console.log(JSON.stringify(response1.data, null, 2));
        
    } catch (error1) {
        console.log('❌ Failed with var1:', error1.response?.data?.message || error1.message);
        
        try {
            console.log('\n📋 Step 2: Test with no variables (empty params)');
            const response2 = await axios.post('http://localhost:5050/api/send', {
                username: 'harsha',
                templatename: 'edi_mp',
                recipient_number: '919398424270'
            });
            console.log('✅ Success with no variables:');
            console.log(JSON.stringify(response2.data, null, 2));
            
        } catch (error2) {
            console.log('❌ Failed with no variables:', error2.response?.data?.message || error2.message);
            
            try {
                console.log('\n📋 Step 3: Test with otp_code parameter directly');
                const response3 = await axios.post('http://localhost:5050/api/send', {
                    username: 'harsha',
                    templatename: 'edi_mp',
                    recipient_number: '919398424270',
                    otp_code: '123456'
                });
                console.log('✅ Success with otp_code:');
                console.log(JSON.stringify(response3.data, null, 2));
                
            } catch (error3) {
                console.log('❌ Failed with otp_code:', error3.response?.data?.message || error3.message);
                
                // Let's examine the detailed error to understand what's expected
                if (error3.response?.data?.details) {
                    console.log('\n📊 Error Details:');
                    console.log(JSON.stringify(error3.response.data.details, null, 2));
                }
                
                // Let's try a different template to see if our authentication detection works
                try {
                    console.log('\n📋 Step 4: Test with a utility template for comparison');
                    const response4 = await axios.post('http://localhost:5050/api/send', {
                        username: 'harsha',
                        templatename: 'simple_test',
                        recipient_number: '919398424270'
                    });
                    console.log('✅ Utility template success:');
                    console.log(JSON.stringify(response4.data, null, 2));
                    
                } catch (error4) {
                    console.log('❌ Utility template also failed:', error4.response?.data?.message || error4.message);
                    
                    // Final analysis
                    console.log('\n📊 Analysis:');
                    console.log('- Authentication template (edi_mp) requires parameters but format is unclear');
                    console.log('- Standard templates may also have validation issues');
                    console.log('- Need to check if templates have proper components or are placeholders');
                }
            }
        }
    }
    
    // Let's also check what would happen if we look at the raw database data
    console.log('\n🔍 Additional Information:');
    console.log('- Authentication template found: edi_mp (APPROVED)');
    console.log('- Template has empty components array - this suggests new 2025 format');
    console.log('- Our fix should add OTP variable detection for AUTHENTICATION category');
}

testAuthFlow();