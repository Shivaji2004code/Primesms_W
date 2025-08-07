const axios = require('axios');

async function testWelcomeMessage() {
    console.log('🧪 Testing Welcome Message Template (APPROVED)\n');
    
    const testCases = [
        {
            description: 'Using var1 for {{customer_name}}',
            params: {
                username: 'harsha',
                templatename: 'welcome_message', 
                recipient_number: '919398424270',
                var1: 'Harsha Kumar'
            }
        },
        {
            description: 'Using customer_name parameter directly',
            params: {
                username: 'harsha',
                templatename: 'welcome_message',
                recipient_number: '919398424270',
                customer_name: 'Harsha Kumar'
            }
        },
        {
            description: 'No variables (see what happens)',
            params: {
                username: 'harsha',
                templatename: 'welcome_message',
                recipient_number: '919398424270'
            }
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`📋 ${testCase.description}`);
            const response = await axios.post('http://localhost:5050/api/send', testCase.params);
            
            console.log('✅ SUCCESS!');
            console.log(JSON.stringify(response.data, null, 2));
            console.log('\n' + '='.repeat(50) + '\n');
            break; // If one works, we found the pattern
            
        } catch (error) {
            console.log(`❌ FAILED: ${error.response?.data?.message || error.message}`);
            if (error.response?.data?.details) {
                console.log('Details:', error.response.data.details);
            }
            console.log('');
        }
    }
}

testWelcomeMessage();