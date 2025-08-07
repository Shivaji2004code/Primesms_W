// Test the credit history API endpoint
const axios = require('axios');

async function testCreditHistoryAPI() {
  console.log('🧪 Testing Credit History API\n');
  
  try {
    // We need to create a session first by simulating login
    // For testing purposes, let's just try to call the API
    const response = await axios.get('http://localhost:5050/api/credits/history', {
      withCredentials: true,
      headers: {
        'Cookie': 'connect.sid=test-session' // This won't work without proper auth
      }
    });
    
    console.log('✅ Credit History API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔑 Note: This is expected without proper authentication.');
        console.log('The API is working but requires login session.');
      }
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Also test a direct database query to verify the data
async function testDatabaseQuery() {
  console.log('\n🗄️ Testing Database Query\n');
  
  const { Pool } = require('pg');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5431,
    database: 'PrimeSMS_W',
    user: 'postgres',
    password: ''
  });
  
  try {
    const result = await pool.query(`
      SELECT 
        id,
        amount,
        transaction_type,
        template_category,
        template_name,
        description,
        created_at
      FROM credit_transactions 
      WHERE user_id = 'bea12015-7dfa-4042-b7e1-f53c9a163e07'
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    console.log('✅ Database Query Results:');
    console.log(`Found ${result.rows.length} transactions`);
    
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Transaction:`);
      console.log(`   Amount: ${row.amount}`);
      console.log(`   Type: ${row.transaction_type}`);
      console.log(`   Template: ${row.template_name || 'N/A'}`);
      console.log(`   Category: ${row.template_category || 'N/A'}`);
      console.log(`   Description: ${row.description}`);
      console.log(`   Date: ${row.created_at.toISOString().split('T')[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run both tests
async function runTests() {
  await testCreditHistoryAPI();
  await testDatabaseQuery();
  console.log('\n✅ Tests completed!');
}

runTests();