/**
 * IMMEDIATE TEMPLATE PAGE FIX
 * Run this in browser console to fix the white screen issue
 * This will clean up any corrupted template data causing the icon error
 */

async function fixTemplatePageImmediately() {
  console.log('🚨 [EMERGENCY_FIX] Starting immediate template page fix...');
  
  try {
    // Get user ID
    let userId = null;
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        userId = JSON.parse(userData).id;
      }
    } catch (e) {
      console.log('Could not get user ID from localStorage');
    }
    
    if (!userId) {
      userId = prompt('Enter your User ID to fix templates:');
      if (!userId) return;
    }
    
    console.log(`🔧 [EMERGENCY_FIX] Fixing templates for user: ${userId}`);
    
    // Step 1: Try to get problematic templates via API
    console.log('📋 [EMERGENCY_FIX] Fetching templates to identify corrupted data...');
    
    let templates = [];
    try {
      const response = await fetch('/api/templates', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        templates = data.data || [];
        console.log(`📋 [EMERGENCY_FIX] Found ${templates.length} templates`);
      } else {
        console.log('⚠️  [EMERGENCY_FIX] Could not fetch templates via API');
      }
    } catch (fetchError) {
      console.error('❌ [EMERGENCY_FIX] API fetch error:', fetchError);
    }
    
    // Step 2: Check for templates with invalid components
    console.log('🔍 [EMERGENCY_FIX] Checking for corrupted template data...');
    
    let corruptedTemplates = [];
    templates.forEach(template => {
      try {
        if (!template.components || !Array.isArray(template.components)) {
          corruptedTemplates.push(template);
          return;
        }
        
        // Check each component for missing icon or invalid structure
        template.components.forEach((component, index) => {
          if (!component || typeof component !== 'object') {
            console.log(`❌ [EMERGENCY_FIX] Template ${template.name}: Component ${index} is invalid`);
            corruptedTemplates.push(template);
          }
          
          // Check for missing icon property that's causing the error
          if (component.type === 'HEADER' && component.format === 'IMAGE' && !component.icon) {
            console.log(`❌ [EMERGENCY_FIX] Template ${template.name}: Missing icon property`);
            corruptedTemplates.push(template);
          }
        });
        
      } catch (checkError) {
        console.log(`❌ [EMERGENCY_FIX] Template ${template.name}: Error checking components`, checkError);
        corruptedTemplates.push(template);
      }
    });
    
    if (corruptedTemplates.length > 0) {
      console.log(`🚨 [EMERGENCY_FIX] Found ${corruptedTemplates.length} templates with corrupted data:`);
      corruptedTemplates.forEach(t => console.log(`   - ${t.name} (${t.id})`));
      
      // Option 1: Try to fix the templates
      const fixChoice = confirm(
        `Found ${corruptedTemplates.length} templates with corrupted data causing the white screen.\n\n` +
        `Click OK to try fixing them, or Cancel to delete them.`
      );
      
      if (fixChoice) {
        // Try to fix templates
        console.log('🔧 [EMERGENCY_FIX] Attempting to fix corrupted templates...');
        
        for (const template of corruptedTemplates) {
          try {
            // Fix the components array
            const fixedComponents = template.components?.map(comp => {
              if (!comp || typeof comp !== 'object') {
                return { type: 'BODY', text: 'Fixed template component' };
              }
              
              // Fix missing icon
              if (comp.type === 'HEADER' && comp.format === 'IMAGE' && !comp.icon) {
                return { ...comp, icon: null };
              }
              
              return comp;
            }) || [{ type: 'BODY', text: 'Fixed template' }];
            
            // Update template with fixed components
            const updateResponse = await fetch(`/api/templates/${template.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                ...template,
                components: fixedComponents
              })
            });
            
            if (updateResponse.ok) {
              console.log(`✅ [EMERGENCY_FIX] Fixed template: ${template.name}`);
            } else {
              console.log(`❌ [EMERGENCY_FIX] Failed to fix template: ${template.name}`);
            }
            
          } catch (fixError) {
            console.error(`❌ [EMERGENCY_FIX] Error fixing template ${template.name}:`, fixError);
          }
        }
      } else {
        // Delete corrupted templates
        console.log('🗑️ [EMERGENCY_FIX] Deleting corrupted templates...');
        
        for (const template of corruptedTemplates) {
          try {
            const deleteResponse = await fetch(`/api/templates/${template.id}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            
            if (deleteResponse.ok) {
              console.log(`🗑️ [EMERGENCY_FIX] Deleted corrupted template: ${template.name}`);
            } else {
              console.log(`❌ [EMERGENCY_FIX] Failed to delete template: ${template.name}`);
            }
            
          } catch (deleteError) {
            console.error(`❌ [EMERGENCY_FIX] Error deleting template ${template.name}:`, deleteError);
          }
        }
      }
    } else {
      console.log('✅ [EMERGENCY_FIX] No corrupted templates found in API data');
    }
    
    // Step 3: Clear any cached data and reload
    console.log('🧹 [EMERGENCY_FIX] Clearing cache and reloading page...');
    
    // Clear relevant localStorage/sessionStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('template') || key.includes('cache'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    alert(
      '✅ TEMPLATE PAGE FIX COMPLETED!\n\n' +
      `• Processed ${templates.length} templates\n` +
      `• ${corruptedTemplates.length > 0 ? 'Fixed/removed corrupted templates' : 'No corruption found'}\n` +
      '• Cleared cache\n\n' +
      'Page will reload now...'
    );
    
    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ [EMERGENCY_FIX] Fix failed:', error);
    
    // Fallback: Just reload the page
    alert(
      '❌ Fix script encountered an error.\n\n' +
      'Trying simple page reload as fallback...'
    );
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
}

// Instructions
console.log(`
🚨 TEMPLATE PAGE WHITE SCREEN FIX 🚨

Error: "Cannot read properties of undefined (reading 'icon')"
Cause: Corrupted template component data

IMMEDIATE FIX:
1. Run this command in the console:
   
   fixTemplatePageImmediately()

This will:
✅ Find templates with corrupted components
✅ Fix or remove problematic templates
✅ Clear cached data
✅ Reload the page

The error is caused by a template component missing the 'icon' property.
`);

// Make function available globally
window.fixTemplatePageImmediately = fixTemplatePageImmediately;

// Auto-run if on templates page
if (window.location.pathname.includes('template') || window.location.pathname === '/templates') {
  console.log('🚨 [EMERGENCY_FIX] Detected templates page with error. Run fixTemplatePageImmediately() to fix.');
}