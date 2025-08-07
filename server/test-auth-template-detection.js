const axios = require('axios');

// Create an axios instance to maintain session cookies
const api = axios.create({
    baseURL: 'http://localhost:5050/api',
    withCredentials: true
});

async function testAuthTemplateDetection() {
    try {
        console.log('🧪 Testing Authentication Template Variable Detection...\n');
        
        // First, login to get session
        console.log('🔐 Logging in as harsha...');
        const loginResponse = await api.post('/auth/login', {
            username: 'harsha',
            password: 'harsha'
        });
        
        console.log('✅ Login successful');
        
        // Test with Harsha user credentials
        const response = await api.post('/whatsapp/template-details', {
            username: 'harsha',
            templateName: 'authentication_template_otp' // Assuming this exists
        });
        
        console.log('✅ Template Details Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Check if OTP variable is detected
        if (response.data.variables && response.data.variables.length > 0) {
            const hasOtpVariable = response.data.variables.some(v => 
                v.type === 'otp_code' || v.placeholder?.toLowerCase().includes('otp')
            );
            
            if (hasOtpVariable) {
                console.log('\n✅ SUCCESS: OTP variable detected correctly!');
            } else {
                console.log('\n❌ ISSUE: No OTP variable detected');
            }
        } else {
            console.log('\n❌ ISSUE: No variables detected at all');
        }
        
    } catch (error) {
        console.error('❌ Error testing template detection:', error.response?.data || error.message);
        
        // If template doesn't exist, let's list available templates
        try {
            console.log('\n🔍 Checking available templates for harsha...');
            const templatesResponse = await api.get('/templates/harsha');
            
            console.log('Available templates:');
            templatesResponse.data.forEach(template => {
                console.log(`- ${template.name} (Category: ${template.category})`);
            });
            
            // Find authentication templates
            const authTemplates = templatesResponse.data.filter(t => 
                t.category === 'AUTHENTICATION' || t.name.toLowerCase().includes('auth')
            );
            
            if (authTemplates.length > 0) {
                console.log(`\n🎯 Found ${authTemplates.length} authentication template(s):`);
                authTemplates.forEach(template => {
                    console.log(`- ${template.name}`);
                });
                
                // Test with the first auth template
                const authTemplate = authTemplates[0];
                console.log(`\n🧪 Testing with: ${authTemplate.name}`);
                
                const authResponse = await api.post('/whatsapp/template-details', {
                    username: 'harsha',
                    templateName: authTemplate.name
                });
                
                console.log('Auth Template Details:');
                console.log(JSON.stringify(authResponse.data, null, 2));
            }
            
        } catch (listError) {
            console.error('Error listing templates:', listError.response?.data || listError.message);
        }
    }
}

testAuthTemplateDetection();