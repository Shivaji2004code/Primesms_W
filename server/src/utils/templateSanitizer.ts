// Template Data Sanitizer - Prevents frontend crashes from corrupted template data
// Template Data Sanitizer imports

/**
 * Sanitizes template components to prevent frontend crashes
 * Fixes common issues like missing properties that cause "Cannot read properties of undefined"
 */
export function sanitizeTemplateComponents(components: any[]): any[] {
  if (!Array.isArray(components)) {
    console.warn('[SANITIZER] Components is not an array, creating default body component');
    return [{ type: 'BODY', text: 'Default template content' }];
  }

  return components.map((component, index) => {
    try {
      // Ensure component is an object
      if (!component || typeof component !== 'object') {
        console.warn(`[SANITIZER] Component ${index} is not an object, creating default`);
        return { type: 'BODY', text: 'Fixed component content' };
      }

      // Ensure component has required type
      if (!component.type || typeof component.type !== 'string') {
        console.warn(`[SANITIZER] Component ${index} missing type, defaulting to BODY`);
        component.type = 'BODY';
      }

      // Fix HEADER components
      if (component.type === 'HEADER') {
        // Ensure format is set
        if (!component.format) {
          component.format = component.text ? 'TEXT' : 'NONE';
        }

        // Fix IMAGE headers that are missing icon property (the main cause of frontend crashes)
        if (component.format === 'IMAGE') {
          if (component.icon === undefined) {
            console.warn(`[SANITIZER] Header component ${index} missing icon, setting to null`);
            component.icon = null;
          }
          
          // Ensure example structure exists for IMAGE headers
          if (!component.example) {
            component.example = { header_handle: [] };
          }
        }

        // Ensure TEXT headers have text
        if (component.format === 'TEXT' && !component.text) {
          component.text = 'Header text';
        }
      }

      // Fix BODY components
      if (component.type === 'BODY') {
        if (!component.text || typeof component.text !== 'string') {
          console.warn(`[SANITIZER] Body component ${index} missing text`);
          component.text = 'Template content';
        }
      }

      // Fix FOOTER components
      if (component.type === 'FOOTER') {
        if (!component.text || typeof component.text !== 'string') {
          component.text = 'Footer text';
        }
      }

      // Fix BUTTONS components
      if (component.type === 'BUTTONS') {
        if (!Array.isArray(component.buttons)) {
          console.warn(`[SANITIZER] Buttons component ${index} missing buttons array`);
          component.buttons = [];
        }

        // Sanitize each button
        component.buttons = component.buttons.map((button: any, buttonIndex: number) => {
          if (!button || typeof button !== 'object') {
            return { type: 'QUICK_REPLY', text: `Button ${buttonIndex + 1}` };
          }

          if (!button.type) {
            button.type = 'QUICK_REPLY';
          }

          if (!button.text || typeof button.text !== 'string') {
            button.text = `Button ${buttonIndex + 1}`;
          }

          return button;
        });
      }

      return component;

    } catch (error) {
      console.error(`[SANITIZER] Error sanitizing component ${index}:`, error);
      return { type: 'BODY', text: 'Error: Component sanitization failed' };
    }
  }).filter(Boolean); // Remove any null/undefined components
}

/**
 * Sanitizes a complete template object for safe frontend consumption
 */
export function sanitizeTemplate(template: any): any {
  if (!template || typeof template !== 'object') {
    throw new Error('Template is not a valid object');
  }

  return {
    ...template,
    components: sanitizeTemplateComponents(template.components),
    // Ensure required fields exist
    name: template.name || 'Unnamed Template',
    category: template.category || 'UTILITY',
    language: template.language || 'en_US',
    status: template.status || 'DRAFT'
  };
}

/**
 * Sanitizes an array of templates for safe frontend consumption
 */
export function sanitizeTemplates(templates: any[]): any[] {
  if (!Array.isArray(templates)) {
    console.warn('[SANITIZER] Templates is not an array, returning empty array');
    return [];
  }

  return templates.map((template, index) => {
    try {
      return sanitizeTemplate(template);
    } catch (error) {
      console.error(`[SANITIZER] Error sanitizing template ${index}:`, error);
      return null;
    }
  }).filter(Boolean); // Remove failed sanitizations
}

/**
 * Middleware to sanitize template responses
 */
export function sanitizeTemplateResponse(req: any, res: any, next: any) {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    try {
      // Only sanitize responses that contain template data
      if (data && data.data && Array.isArray(data.data)) {
        // This looks like a templates list response
        data.data = sanitizeTemplates(data.data);
      } else if (data && data.id && data.components) {
        // This looks like a single template response
        data = sanitizeTemplate(data);
      }
    } catch (error) {
      console.error('[SANITIZER] Error in response sanitization:', error);
      // Don't break the response if sanitization fails
    }
    
    return originalJson.call(this, data);
  };
  
  next();
}