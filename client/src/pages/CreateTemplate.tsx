import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Send,
  Save,
  AlertCircle,
  Info,
  Variable,
  Smartphone,
  Upload,
  Image,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import type { 
  CreateTemplateRequest,
  TemplateComponent,
  TemplateButton,
  TemplateCategory,
  ComponentType,
  ButtonType,
  TemplateVariable,
  User,
  MediaUploadResponse,
  HeaderFormat
} from '@/types';

interface CreateTemplateProps {
  currentUser: User;
}

const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  {
    value: 'UTILITY',
    label: 'Utility',
    description: 'Transactional messages like order confirmations, shipping updates, appointment reminders'
  },
  {
    value: 'MARKETING',
    label: 'Marketing',
    description: 'Promotional messages, offers, product announcements, and sales content'
  },
  {
    value: 'AUTHENTICATION',
    label: 'Authentication',
    description: 'One-time passwords (OTP) and verification codes for user authentication'
  }
];

const COMPONENT_TYPES: { value: ComponentType; label: string; description: string }[] = [
  { value: 'HEADER', label: 'Header', description: 'Optional title or media at the top (60 chars max)' },
  { value: 'BODY', label: 'Body', description: 'Main message content (required)' },
  { value: 'FOOTER', label: 'Footer', description: 'Optional footer text (60 chars max)' },
  { value: 'BUTTONS', label: 'Buttons', description: 'Interactive buttons for user actions' }
];

const HEADER_FORMATS: { value: HeaderFormat; label: string; description: string }[] = [
  { value: 'TEXT', label: 'Text', description: 'Simple text header (60 chars max)' },
  { value: 'IMAGE', label: 'Image', description: 'Upload an image for the header' }
];

const BUTTON_TYPES: { value: ButtonType; label: string; description: string }[] = [
  { value: 'QUICK_REPLY', label: 'Quick Reply', description: 'Send predefined text back to business' },
  { value: 'URL', label: 'Website', description: 'Open a website URL' },
  { value: 'PHONE_NUMBER', label: 'Phone Call', description: 'Make a phone call' },
  { value: 'OTP', label: 'Copy Code', description: 'Copy OTP code (Authentication only)' }
];

const COMMON_VARIABLES: TemplateVariable[] = [
  { name: 'customer_name', example: 'John Doe', description: 'Customer full name' },
  { name: 'first_name', example: 'John', description: 'Customer first name' },
  { name: 'order_id', example: '12345', description: 'Order number' },
  { name: 'amount', example: '99.99', description: 'Price or amount' },
  { name: 'date', example: 'Dec 25, 2025', description: 'Date' },
  { name: 'time', example: '2:30 PM', description: 'Time' },
  { name: 'company_name', example: 'Your Business', description: 'Business name' },
  { name: 'phone_number', example: '+1234567890', description: 'Phone number' },
  { name: 'email', example: 'user@example.com', description: 'Email address' },
  { name: 'otp_code', example: '123456', description: 'Verification code' }
];

export default function CreateTemplate({ currentUser }: CreateTemplateProps) {
  // Use currentUser for potential future features like user-specific settings
  console.log('Current user:', currentUser.name);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [variableExamples, setVariableExamples] = useState<Record<string, string>>({});
  
  // Form state
  const [templateData, setTemplateData] = useState<CreateTemplateRequest>({
    name: '',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: ''
      }
    ],
    allow_category_change: true,
    submit_to_whatsapp: false
  });

  // Dialog states
  const [variableDialog, setVariableDialog] = useState<{
    open: boolean;
    componentIndex: number;
    cursorPosition: number;
  }>({ open: false, componentIndex: -1, cursorPosition: 0 });

  const [previewDialog, setPreviewDialog] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Record<number, {
    headerHandle: string;
    fileName: string;
    mimeType: string;
  }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Extract variables from BODY components only (not headers/footers) and set example values
    const variables: Record<string, string> = {};
    const bodyComponents = templateData.components.filter(c => c.type === 'BODY');
    
    bodyComponents.forEach(component => {
      if (component.text) {
        // Support both positional {{1}} and named {{variable_name}} variables
        const positionalMatches = component.text.match(/\{\{(\d+)\}\}/g);
        const namedMatches = component.text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
        
        if (positionalMatches) {
          positionalMatches.forEach(match => {
            const varNum = match.slice(2, -2);
            const commonVar = COMMON_VARIABLES[parseInt(varNum) - 1];
            variables[varNum] = variableExamples[varNum] || commonVar?.example || `Example ${varNum}`;
          });
        }
        
        if (namedMatches) {
          namedMatches.forEach(match => {
            const varName = match.slice(2, -2);
            if (!varName.match(/^\d+$/)) { // Skip if it's just numbers (positional)
              const commonVar = COMMON_VARIABLES.find(v => v.name === varName);
              variables[varName] = variableExamples[varName] || commonVar?.example || `[${varName}]`;
            }
          });
        }
      }
    });
    setPreviewVariables(variables);
  }, [templateData.components, variableExamples]);

  const addComponent = (type: ComponentType) => {
    const newComponent: TemplateComponent = {
      type,
      text: type === 'BUTTONS' ? undefined : ''
    };

    if (type === 'HEADER') {
      newComponent.format = 'TEXT';
    }

    if (type === 'BUTTONS') {
      newComponent.buttons = [
        {
          type: 'QUICK_REPLY',
          text: ''
        }
      ];
    }

    setTemplateData(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
  };

  const removeComponent = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const updateComponent = (index: number, updates: Partial<TemplateComponent>) => {
    setTemplateData(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => {
        if (i === index) {
          const updatedComp = { ...comp, ...updates };
          // Clear media data when switching from IMAGE to TEXT format
          if (comp.format === 'IMAGE' && updates.format === 'TEXT') {
            delete updatedComp.example;
            // Remove from uploaded media tracking
            const newUploadedMedia = { ...uploadedMedia };
            delete newUploadedMedia[index];
            setUploadedMedia(newUploadedMedia);
          }
          return updatedComp;
        }
        return comp;
      })
    }));
  };

  const addButton = (componentIndex: number) => {
    const component = templateData.components[componentIndex];
    if (component.type === 'BUTTONS') {
      const newButton: TemplateButton = {
        type: 'QUICK_REPLY',
        text: ''
      };

      updateComponent(componentIndex, {
        buttons: [...(component.buttons || []), newButton]
      });
    }
  };

  const removeButton = (componentIndex: number, buttonIndex: number) => {
    const component = templateData.components[componentIndex];
    if (component.type === 'BUTTONS' && component.buttons) {
      updateComponent(componentIndex, {
        buttons: component.buttons.filter((_, i) => i !== buttonIndex)
      });
    }
  };

  const updateButton = (componentIndex: number, buttonIndex: number, updates: Partial<TemplateButton>) => {
    const component = templateData.components[componentIndex];
    if (component.type === 'BUTTONS' && component.buttons) {
      const updatedButtons = component.buttons.map((btn, i) => 
        i === buttonIndex ? { ...btn, ...updates } : btn
      );
      updateComponent(componentIndex, { buttons: updatedButtons });
    }
  };

  const insertVariable = (variableName: string) => {
    const { componentIndex, cursorPosition } = variableDialog;
    const component = templateData.components[componentIndex];
    
    // Only allow variables in BODY components
    if (component && component.text !== undefined && component.type === 'BODY') {
      const text = component.text || '';
      const beforeCursor = text.substring(0, cursorPosition);
      const afterCursor = text.substring(cursorPosition);
      const newText = `${beforeCursor}{{${variableName}}}${afterCursor}`;
      
      updateComponent(componentIndex, { text: newText });
    }
    
    setVariableDialog({ open: false, componentIndex: -1, cursorPosition: 0 });
  };

  const validateTemplate = (): string[] => {
    const errors: string[] = [];

    if (!templateData.name.trim()) {
      errors.push('Template name is required');
    } else if (!/^[a-z0-9_]+$/.test(templateData.name)) {
      errors.push('Template name can only contain lowercase letters, numbers, and underscores');
    }

    const hasBody = templateData.components.some(c => c.type === 'BODY');
    if (!hasBody) {
      errors.push('Template must have at least one BODY component');
    }

    const bodyComponents = templateData.components.filter(c => c.type === 'BODY');
    if (bodyComponents.some(c => !c.text?.trim())) {
      errors.push('Body components cannot be empty');
    }

    // Check for header/footer length limits
    const headerComponents = templateData.components.filter(c => c.type === 'HEADER');
    if (headerComponents.some(c => c.text && c.text.length > 60)) {
      errors.push('Header text cannot exceed 60 characters');
    }

    const footerComponents = templateData.components.filter(c => c.type === 'FOOTER');
    if (footerComponents.some(c => c.text && c.text.length > 60)) {
      errors.push('Footer text cannot exceed 60 characters');
    }

    // Check button limits
    const buttonComponents = templateData.components.filter(c => c.type === 'BUTTONS');
    buttonComponents.forEach((comp, index) => {
      if (comp.buttons) {
        if (comp.buttons.length > 10) {
          errors.push(`Button component ${index + 1} cannot have more than 10 buttons`);
        }
        comp.buttons.forEach((btn, btnIndex) => {
          if (!btn.text.trim()) {
            errors.push(`Button ${btnIndex + 1} in component ${index + 1} must have text`);
          }
          if (btn.text.length > 25) {
            errors.push(`Button text cannot exceed 25 characters`);
          }
          if (btn.type === 'URL' && btn.url && !/^https?:\/\/.+/.test(btn.url)) {
            errors.push(`Invalid URL format in button ${btnIndex + 1}`);
          }
          if (btn.type === 'PHONE_NUMBER' && btn.phone_number && !/^\+?[\d\s-()]+$/.test(btn.phone_number)) {
            errors.push(`Invalid phone number format in button ${btnIndex + 1}`);
          }
        });
      }
    });

    return errors;
  };

  const handleMediaUpload = async (componentIndex: number, file: File) => {
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/upload-media`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data: MediaUploadResponse = await response.json();
        
        // Store uploaded media info
        setUploadedMedia(prev => ({
          ...prev,
          [componentIndex]: {
            headerHandle: data.headerHandle,
            fileName: data.fileName,
            mimeType: data.mimeType
          }
        }));

        // Update component with header handle
        updateComponent(componentIndex, {
          example: {
            header_handle: [data.headerHandle]
          }
        });

        console.log('Media uploaded successfully:', data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload media');
      }
    } catch (error) {
      console.error('Media upload error:', error);
      setError('Network error occurred during upload');
    } finally {
      setUploadingMedia(false);
    }
  };

  const generateExamples = () => {
    return templateData.components.map((component, index) => {
      if (component.type === 'BODY' && component.text) {
        // Extract both positional {{1}} and named {{variable_name}} variables
        const positionalMatches = component.text.match(/\{\{(\d+)\}\}/g);
        const namedMatches = component.text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
        
        let examples: string[] = [];
        
        if (positionalMatches) {
          examples = positionalMatches.map(match => {
            const varNum = match.slice(2, -2);
            return variableExamples[varNum] || previewVariables[varNum] || `Example ${varNum}`;
          });
        } else if (namedMatches) {
          examples = namedMatches.map(match => {
            const varName = match.slice(2, -2);
            if (!varName.match(/^\d+$/)) { // Skip if it's just numbers (positional)
              return variableExamples[varName] || previewVariables[varName] || `[${varName}]`;
            }
            return varName;
          }).filter(Boolean);
        }
        
        if (examples.length > 0) {
          return {
            ...component,
            example: {
              body_text: [examples]
            }
          };
        }
      }
      
      // For IMAGE headers, ensure we have the header_handle
      if (component.type === 'HEADER' && component.format === 'IMAGE') {
        const mediaData = uploadedMedia[index];
        if (mediaData) {
          return {
            ...component,
            example: {
              header_handle: [mediaData.headerHandle]
            }
          };
        }
      }
      
      return component;
    });
  };

  const handleSave = async (submitToWhatsApp = false) => {
    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        ...templateData,
        components: generateExamples(),
        submit_to_whatsapp: submitToWhatsApp
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        navigate('/user/templates');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create template');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Create template error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPreview = () => {
    const headerComponent = templateData.components.find(c => c.type === 'HEADER');
    const bodyComponents = templateData.components.filter(c => c.type === 'BODY');
    const footerComponent = templateData.components.find(c => c.type === 'FOOTER');
    const buttonComponents = templateData.components.filter(c => c.type === 'BUTTONS');
    const buttons = buttonComponents.flatMap(c => c.buttons || []);

    const getTextWithVariables = (text?: string) => {
      if (!text) return '';
      let processedText = text;
      Object.entries(previewVariables).forEach(([varName, value]) => {
        processedText = processedText.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
      });
      return processedText;
    };

    return (
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="bg-white rounded-lg shadow-sm border max-w-sm mx-auto">
          {/* Phone Header */}
          <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">WhatsApp Preview</span>
          </div>
          
          {/* Message Content */}
          <div className="p-4 space-y-3">
            {/* Header */}
            {headerComponent && (
              <div className="space-y-2">
                {headerComponent.format === 'IMAGE' && uploadedMedia[templateData.components.indexOf(headerComponent)] && (
                  <div className="bg-gray-200 rounded-lg p-3 text-center">
                    <Image className="h-8 w-8 mx-auto text-gray-500" />
                    <p className="text-xs text-gray-600 mt-1">
                      {uploadedMedia[templateData.components.indexOf(headerComponent)].fileName}
                    </p>
                  </div>
                )}
                {headerComponent.format === 'TEXT' && headerComponent.text && (
                  <div className="font-semibold text-sm">
                    {getTextWithVariables(headerComponent.text)}
                  </div>
                )}
              </div>
            )}
            
            {/* Body */}
            <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
              <div className="whitespace-pre-wrap text-sm">
                {bodyComponents.map(comp => getTextWithVariables(comp.text)).join('\n\n') || 'Your message will appear here...'}
              </div>
            </div>
            
            {/* Footer */}
            {footerComponent?.text && (
              <div className="text-xs text-gray-500">
                {getTextWithVariables(footerComponent.text)}
              </div>
            )}
            
            {/* Buttons */}
            {buttons.length > 0 && (
              <div className="space-y-2">
                {buttons.map((button, index) => (
                  <div key={index} className="border border-blue-200 bg-blue-50 text-blue-700 px-3 py-2 rounded text-center text-sm font-medium">
                    {button.text || 'Button'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/user/templates')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
            <p className="text-gray-600">Design your WhatsApp message template</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
            <Button variant="outline" onClick={() => setPreviewDialog(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Template Preview</DialogTitle>
                <DialogDescription>
                  See how your template will look on WhatsApp
                </DialogDescription>
              </DialogHeader>
              {renderPreview()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          
          <Button 
            onClick={() => handleSave(true)}
            disabled={isLoading}
          >
            <Send className="h-4 w-4 mr-2" />
            Save & Submit
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Basic details about your template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={templateData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setTemplateData(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))
                  }
                  placeholder="my_template_name"
                  className="font-mono"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Only lowercase letters, numbers, and underscores allowed
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={templateData.category} 
                  onValueChange={(value: TemplateCategory) => 
                    setTemplateData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-sm text-gray-500">{cat.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select 
                  value={templateData.language} 
                  onValueChange={(value: string) => 
                    setTemplateData(prev => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="en_GB">English (UK)</SelectItem>
                    <SelectItem value="es_ES">Spanish</SelectItem>
                    <SelectItem value="fr_FR">French</SelectItem>
                    <SelectItem value="de_DE">German</SelectItem>
                    <SelectItem value="pt_BR">Portuguese (Brazil)</SelectItem>
                    <SelectItem value="hi_IN">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-category-change"
                  checked={templateData.allow_category_change}
                  onCheckedChange={(checked) => 
                    setTemplateData(prev => ({ ...prev, allow_category_change: checked }))
                  }
                />
                <Label htmlFor="allow-category-change">
                  Allow WhatsApp to change category if needed
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card>
            <CardHeader>
              <CardTitle>Template Components</CardTitle>
              <CardDescription>
                Build your message structure with different components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templateData.components.map((component, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{component.type}</Badge>
                    {component.type !== 'BODY' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComponent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {component.type === 'HEADER' && (
                    <div className="space-y-3">
                      <div>
                        <Label>Header Format</Label>
                        <Select
                          value={component.format || 'TEXT'}
                          onValueChange={(value: HeaderFormat) => 
                            updateComponent(index, { format: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {HEADER_FORMATS.map(format => (
                              <SelectItem key={format.value} value={format.value}>
                                <div>
                                  <div className="font-medium">{format.label}</div>
                                  <div className="text-sm text-gray-500">{format.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {component.format === 'TEXT' && (
                        <div>
                          <Label>Header Text</Label>
                          <Input
                            value={component.text || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              updateComponent(index, { text: e.target.value })
                            }
                            placeholder="Header text (60 chars max)"
                            maxLength={60}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {component.text?.length || 0}/60 characters
                          </p>
                        </div>
                      )}

                      {component.format === 'IMAGE' && (
                        <div>
                          <Label>Header Image</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {uploadedMedia[index] ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                  <Image className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-sm font-medium text-green-600">
                                  {uploadedMedia[index].fileName}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newUploadedMedia = { ...uploadedMedia };
                                    delete newUploadedMedia[index];
                                    setUploadedMedia(newUploadedMedia);
                                    updateComponent(index, { example: undefined });
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center">
                                  <Upload className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600">
                                  Upload an image for the header
                                </p>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleMediaUpload(index, file);
                                    }
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={uploadingMedia}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  {uploadingMedia ? 'Uploading...' : 'Choose Image'}
                                </Button>
                                <p className="text-xs text-gray-500">
                                  Max file size: 5MB
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {component.type !== 'BUTTONS' && component.type !== 'HEADER' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Text Content</Label>
                        {component.type === 'BODY' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVariableDialog({ 
                              open: true, 
                              componentIndex: index, 
                              cursorPosition: component.text?.length || 0 
                            })}
                          >
                            <Variable className="h-4 w-4 mr-1" />
                            Add Variable
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={component.text || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          updateComponent(index, { text: e.target.value })
                        }
                        placeholder={
                          component.type === 'BODY' ? 'Your message content with {{variables}}...' :
                          'Footer text (60 chars max)'
                        }
                        rows={component.type === 'BODY' ? 4 : 2}
                      />
                      {component.type === 'FOOTER' && (
                        <p className="text-sm text-gray-500 mt-1">
                          {component.text?.length || 0}/60 characters
                        </p>
                      )}
                    </div>
                  )}

                  {component.type === 'BUTTONS' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Buttons</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addButton(index)}
                          disabled={(component.buttons?.length || 0) >= 10}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Button
                        </Button>
                      </div>

                      {component.buttons?.map((button, buttonIndex) => (
                        <div key={buttonIndex} className="border rounded p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Button {buttonIndex + 1}</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeButton(index, buttonIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={button.type}
                                onValueChange={(value: ButtonType) => 
                                  updateButton(index, buttonIndex, { type: value })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {BUTTON_TYPES
                                    .filter(btnType => 
                                      templateData.category === 'AUTHENTICATION' ? 
                                      btnType.value === 'OTP' : 
                                      btnType.value !== 'OTP'
                                    )
                                    .map(btnType => (
                                    <SelectItem key={btnType.value} value={btnType.value}>
                                      {btnType.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Text</Label>
                              <Input
                                value={button.text}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  updateButton(index, buttonIndex, { text: e.target.value })
                                }
                                placeholder="Button text"
                                className="h-8"
                                maxLength={25}
                              />
                            </div>
                          </div>

                          {button.type === 'URL' && (
                            <div>
                              <Label className="text-xs">URL</Label>
                              <Input
                                value={button.url || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  updateButton(index, buttonIndex, { url: e.target.value })
                                }
                                placeholder="https://example.com"
                                className="h-8"
                              />
                            </div>
                          )}

                          {button.type === 'PHONE_NUMBER' && (
                            <div>
                              <Label className="text-xs">Phone Number</Label>
                              <Input
                                value={button.phone_number || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  updateButton(index, buttonIndex, { phone_number: e.target.value })
                                }
                                placeholder="+1234567890"
                                className="h-8"
                              />
                            </div>
                          )}

                          {button.type === 'OTP' && (
                            <div>
                              <Label className="text-xs">OTP Type</Label>
                              <Select
                                value={button.otp_type || 'COPY_CODE'}
                                onValueChange={(value: 'COPY_CODE' | 'ONE_TAP') => 
                                  updateButton(index, buttonIndex, { otp_type: value })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="COPY_CODE">Copy Code</SelectItem>
                                  <SelectItem value="ONE_TAP">One Tap</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                {COMPONENT_TYPES
                  .filter(type => 
                    !templateData.components.some(c => 
                      c.type === type.value && ['HEADER', 'FOOTER'].includes(type.value)
                    )
                  )
                  .map(type => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    onClick={() => addComponent(type.value)}
                    disabled={type.value === 'BODY' && templateData.components.some(c => c.type === 'BODY')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add {type.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Real-time preview of your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderPreview()}
            </CardContent>
          </Card>

          {/* Variable Examples */}
          {Object.keys(previewVariables).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Variable className="h-5 w-5 mr-2" />
                  Variable Examples
                </CardTitle>
                <CardDescription>
                  Provide example values for template variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(previewVariables).map(([varName, currentExample]) => (
                    <div key={varName} className="space-y-1">
                      <Label htmlFor={`var-${varName}`} className="text-sm font-medium">
                        <code className="bg-gray-100 px-2 py-1 rounded mr-2">
                          {`{{${varName}}}`}
                        </code>
                      </Label>
                      <Input
                        id={`var-${varName}`}
                        value={variableExamples[varName] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setVariableExamples(prev => ({
                            ...prev,
                            [varName]: e.target.value
                          }))
                        }
                        placeholder={currentExample}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Current: {currentExample}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Template Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Template name: lowercase, numbers, underscores only</li>
                <li>Header/Footer: 60 characters maximum</li>
                <li>Button text: 25 characters maximum</li>
                <li>Variables: Use format {`{{variable_name}}`} (only in BODY)</li>
                <li>At least one BODY component required</li>
                <li>Maximum 10 buttons per template</li>
                <li>Image headers: Upload sample image required</li>
                <li>Provide clear, realistic examples</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Variable Dialog */}
      <Dialog 
        open={variableDialog.open} 
        onOpenChange={(open) => !open && setVariableDialog({ open: false, componentIndex: -1, cursorPosition: 0 })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insert Variable</DialogTitle>
            <DialogDescription>
              Choose a variable to insert into your template
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {COMMON_VARIABLES.map(variable => (
              <div
                key={variable.name}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => insertVariable(variable.name)}
              >
                <div className="font-medium text-sm">{`{{${variable.name}}}`}</div>
                <div className="text-xs text-gray-500 mt-1">{variable.description}</div>
                <div className="text-xs text-blue-600 mt-1">Example: {variable.example}</div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="custom-variable">Custom Variable</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="custom-variable"
                placeholder="variable_name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const varName = input.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                    if (varName) {
                      insertVariable(varName);
                      input.value = '';
                    }
                  }
                }}
              />
              <Button
                onClick={() => {
                  const input = document.getElementById('custom-variable') as HTMLInputElement;
                  const varName = input.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
                  if (varName) {
                    insertVariable(varName);
                    input.value = '';
                  }
                }}
              >
                Insert
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setVariableDialog({ open: false, componentIndex: -1, cursorPosition: 0 })}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}