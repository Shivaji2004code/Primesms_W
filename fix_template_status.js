// Quick fix script to debug and sync template status
// Run this with: node fix_template_status.js

const axios = require('axios');

// Configuration - Update these with your production values
const API_BASE = 'https://primesms.app'; // or your domain
const USER_ID = ''; // Get from your database - user who owns the 'terty' template
const TEMPLATE_NAME = 'terty';
const LANGUAGE = 'en_US';

async function debugTemplateStatus() {
  try {
    console.log('🔍 [DEBUG] Starting template status debug...');
    
    // 1. Debug current template status
    console.log(`📊 [DEBUG] Checking template: ${TEMPLATE_NAME} for user: ${USER_ID}`);
    
    const debugResponse = await axios.get(
      `${API_BASE}/api/debug/templates/${USER_ID}/${TEMPLATE_NAME}?language=${LANGUAGE}`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_DEBUG_TOKEN_HERE' // Add your webhook debug token
        }
      }
    );
    
    console.log('📊 [DEBUG] Template comparison:', JSON.stringify(debugResponse.data, null, 2));
    
    // 2. If database status doesn't match Meta status, force sync
    const debugData = debugResponse.data;
    if (debugData.comparison.needsUpdate) {
      console.log('🔄 [DEBUG] Status mismatch detected, forcing sync...');
      
      const syncResponse = await axios.post(
        `${API_BASE}/api/debug/templates/${USER_ID}/${TEMPLATE_NAME}/force-sync`,
        { language: LANGUAGE },
        {
          headers: {
            'Authorization': 'Bearer YOUR_DEBUG_TOKEN_HERE',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ [DEBUG] Force sync result:', JSON.stringify(syncResponse.data, null, 2));
      
    } else {
      console.log('✅ [DEBUG] Template status is in sync');
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error.response?.data || error.message);
  }
}

// Alternative: Use the regular sync endpoint
async function useRegularSync() {
  try {
    console.log('🔄 [SYNC] Using regular sync endpoint...');
    
    const syncResponse = await axios.post(
      `${API_BASE}/api/templates/sync`,
      { 
        userId: USER_ID,
        name: TEMPLATE_NAME,
        language: LANGUAGE
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ [SYNC] Regular sync result:', JSON.stringify(syncResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ [SYNC] Error:', error.response?.data || error.message);
  }
}

// Run the debug
if (USER_ID) {
  debugTemplateStatus().then(() => {
    console.log('🎉 [DEBUG] Debug completed');
  });
} else {
  console.log('⚠️  [CONFIG] Please set USER_ID in the script');
  console.log('💡 [HELP] You can also try the regular sync endpoint without debug token');
  console.log('💡 [HELP] Visit your templates page and note the user ID from browser network requests');
}

// Export functions for manual use
module.exports = { debugTemplateStatus, useRegularSync };