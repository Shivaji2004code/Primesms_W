const axios = require('axios');

async function testTemplateDetails() {
    try {
        console.log('🧪 Testing Template Details Endpoint for Authentication Template...\n');
        
        // Test the internal template details logic directly
        const response = await axios.post('http://localhost:5050/api/whatsapp/template-details', {
            username: 'harsha',
            templateName: 'edi_mp'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Template Details Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if our authentication template variable detection worked
        if (response.data.variables && response.data.variables.length > 0) {
            console.log('\n📋 Variables detected:');
            response.data.variables.forEach((variable, index) => {
                console.log(`  ${index + 1}. Index: ${variable.index}, Type: ${variable.type || 'text'}, Placeholder: ${variable.placeholder}`);
            });
            
            const hasOtpVariable = response.data.variables.some(v => 
                v.type === 'otp_code' || v.placeholder?.toLowerCase().includes('otp')
            );
            
            if (hasOtpVariable) {
                console.log('\n✅ SUCCESS: OTP variable detected correctly!');
            } else {
                console.log('\n⚠️  WARNING: No OTP-specific variable detected');
            }
        } else {
            console.log('\n❌ ISSUE: No variables detected for authentication template');
        }
        
        console.log(`\n📊 Template Category: ${response.data.category}`);
        console.log(`📊 Template Type Info: ${response.data.templateTypeInfo?.description || 'N/A'}`);
        
    } catch (error) {
        console.error('❌ Error testing template details:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n⚠️  Authentication required. The endpoint might need session auth.');
        }
    }
}

testTemplateDetails();