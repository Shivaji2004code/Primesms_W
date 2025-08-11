/**
 * IMMEDIATE TEMPLATE STATUS FIX SCRIPT
 * Run this in your browser console on the Templates page to force sync
 * This bypasses webhooks and directly fetches from Meta Graph API
 */

async function immediateTemplateFix() {
  console.log('🚨 [IMMEDIATE_FIX] Starting emergency template status sync...');
  
  try {
    // Step 1: Get current user ID from the page
    // Look for user data in various places
    let userId = null;
    
    // Try to find user ID from local storage, session storage, or page context
    if (window.localStorage) {
      const userData = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          userId = parsed.id || parsed.userId;
        } catch (e) {}
      }
    }
    
    // Alternative: try to find from any API calls in network tab
    if (!userId) {
      console.log('⚠️  [IMMEDIATE_FIX] Could not automatically detect user ID');
      console.log('🔍 [IMMEDIATE_FIX] Please check browser Network tab for any API calls with userId parameter');
      console.log('💡 [IMMEDIATE_FIX] Or check Application > Local Storage for user data');
      
      // Prompt user to enter manually
      userId = prompt('Enter your User ID (check Network tab or Local Storage):');
      if (!userId) {
        console.error('❌ [IMMEDIATE_FIX] User ID required. Aborting.');
        return;
      }
    }
    
    console.log(`✅ [IMMEDIATE_FIX] Using User ID: ${userId}`);
    
    // Step 2: Compare current database vs Meta status
    console.log('🔍 [IMMEDIATE_FIX] Step 1: Comparing database vs Meta status...');
    
    const compareResponse = await fetch(`/api/templates/compare/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!compareResponse.ok) {
      throw new Error(`Compare API failed: ${compareResponse.status} ${compareResponse.statusText}`);
    }
    
    const compareResult = await compareResponse.json();
    console.log('📊 [IMMEDIATE_FIX] Comparison result:', compareResult);
    
    if (compareResult.success) {
      console.log(`📋 [IMMEDIATE_FIX] Found ${compareResult.summary.needingUpdate} templates needing sync`);
      
      if (compareResult.summary.needingUpdate > 0) {
        console.log('📝 [IMMEDIATE_FIX] Templates that need syncing:');
        compareResult.comparisons
          .filter(c => c.needsUpdate)
          .forEach(c => {
            console.log(`   • ${c.name} (${c.language}): DB=${c.database?.status || 'missing'} → Meta=${c.meta?.status}`);
          });
      }
    }
    
    // Step 3: Force sync all templates from Meta
    console.log('🚨 [IMMEDIATE_FIX] Step 2: Force syncing all templates from Meta...');
    
    const syncResponse = await fetch(`/api/templates/sync-direct/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    if (!syncResponse.ok) {
      throw new Error(`Sync API failed: ${syncResponse.status} ${syncResponse.statusText}`);
    }
    
    const syncResult = await syncResponse.json();
    console.log('🔄 [IMMEDIATE_FIX] Sync result:', syncResult);
    
    if (syncResult.success) {
      console.log(`✅ [IMMEDIATE_FIX] Successfully updated ${syncResult.updated} templates!`);
      console.log('📋 [IMMEDIATE_FIX] Updated templates:');
      
      syncResult.items.forEach(item => {
        console.log(`   • ${item.name} (${item.language}): ${item.status} [${item.category}]`);
      });
      
      // Step 4: Refresh the page to see updates
      console.log('🔄 [IMMEDIATE_FIX] Refreshing page to show updated statuses...');
      
      // Wait a moment for SSE to update, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      alert(`✅ TEMPLATE STATUS FIX COMPLETE!\n\nUpdated ${syncResult.updated} templates.\nPage will refresh in 2 seconds to show changes.`);
      
    } else {
      throw new Error(syncResult.message || 'Sync failed');
    }
    
  } catch (error) {
    console.error('❌ [IMMEDIATE_FIX] Error:', error);
    
    let errorMessage = error.message || String(error);
    
    // Provide specific help based on error type
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      errorMessage += '\n\n💡 SOLUTION: The direct sync endpoints are not deployed yet. Please wait for deployment or contact support.';
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      errorMessage += '\n\n💡 SOLUTION: Please ensure you are logged in to Prime SMS and try again.';
    } else if (errorMessage.includes('Missing WABA credentials')) {
      errorMessage += '\n\n💡 SOLUTION: Your WhatsApp Business API credentials are not configured. Please check your API Management settings.';
    }
    
    alert(`❌ TEMPLATE STATUS FIX FAILED\n\n${errorMessage}`);
  }
}

// Instructions
console.log(`
🚨 IMMEDIATE TEMPLATE STATUS FIX 🚨

To fix your template status sync issue immediately:

1. Make sure you are on the Templates page of Prime SMS
2. Open browser Developer Console (F12)
3. Run this command:
   
   immediateTemplateFix()

This will:
✅ Compare your database vs Meta status
✅ Force sync all templates from Meta Graph API
✅ Update your UI with correct statuses
✅ Refresh the page to show changes

The fix bypasses webhooks entirely and pulls directly from Meta.
`);

// Auto-run if on templates page
if (window.location.pathname.includes('template') || document.title.includes('Template')) {
  console.log('🔍 [IMMEDIATE_FIX] Detected Templates page. You can run immediateTemplateFix() now.');
}

// Make function available globally
window.immediateTemplateFix = immediateTemplateFix;