const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5431'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function analyzeTemplateVariables() {
  try {
    console.log('🔍 Analyzing template variable requirements...\n');
    
    const result = await pool.query(`
      SELECT name, header_type, components 
      FROM templates 
      WHERE user_id = (SELECT id FROM users WHERE username = 'harsha')
      ORDER BY name
    `);
    
    result.rows.forEach(template => {
      console.log(`📋 Template: "${template.name}"`);
      console.log(`   Header Type: ${template.header_type}`);
      
      if (template.components && Array.isArray(template.components)) {
        let totalVariables = 0;
        let headerVariables = 0;
        let bodyVariables = 0;
        let footerVariables = 0;
        
        template.components.forEach(component => {
          if (component.type === 'HEADER' && component.text) {
            const matches = component.text.match(/\{\{(\d+)\}\}/g);
            if (matches) {
              headerVariables = matches.length;
              console.log(`   📝 HEADER: "${component.text}" (${headerVariables} variables: ${matches.join(', ')})`);
            }
          }
          
          if (component.type === 'BODY' && component.text) {
            const matches = component.text.match(/\{\{(\d+)\}\}/g);
            if (matches) {
              bodyVariables = matches.length;
              console.log(`   📝 BODY: "${component.text}" (${bodyVariables} variables: ${matches.join(', ')})`);
            } else {
              console.log(`   📝 BODY: "${component.text}" (0 variables - static text)`);
            }
          }
          
          if (component.type === 'FOOTER' && component.text) {
            const matches = component.text.match(/\{\{(\d+)\}\}/g);
            if (matches) {
              footerVariables = matches.length;
              console.log(`   📝 FOOTER: "${component.text}" (${footerVariables} variables: ${matches.join(', ')})`);
            }
          }
          
          if (component.type === 'BUTTONS' && component.buttons) {
            component.buttons.forEach((button, idx) => {
              if (button.url && button.url.includes('{{')) {
                const matches = button.url.match(/\{\{(\d+)\}\}/g);
                if (matches) {
                  console.log(`   🔘 BUTTON ${idx + 1}: URL with ${matches.length} variables: ${matches.join(', ')}`);
                }
              }
            });
          }
        });
        
        totalVariables = headerVariables + bodyVariables + footerVariables;
        console.log(`   🎯 TOTAL VARIABLES REQUIRED: ${totalVariables}`);
        
        if (totalVariables === 0) {
          console.log(`   ✅ This template needs NO variables (all static)`);
        } else {
          console.log(`   ⚠️ This template REQUIRES ${totalVariables} variables to work`);
        }
      }
      
      console.log(''); // Empty line between templates
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await pool.end();
  }
}

analyzeTemplateVariables();