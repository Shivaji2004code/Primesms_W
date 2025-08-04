import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Send,
  Save,
  Info,
  Variable,
  Smartphone,
  Upload,
  Image,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { 
  TemplateButton,
  TemplateCategory,
  ButtonType,
  TemplateVariable,
  User
} from '@/types';

interface CreateTemplateProps {
  currentUser: User;
}

// Enhanced template state interface for better UX
interface TemplateState {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'none' | 'text' | 'image';
  headerText: string;
  headerImage: File | null;
  bodyText: string;
  footerText: string;
  buttons: TemplateButton[];
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

export default function CreateTemplate({ }: CreateTemplateProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [variableExamples, setVariableExamples] = useState<Record<string, string>>({});
  
  // Enhanced form state using the new unified interface
  const [templateData, setTemplateData] = useState<TemplateState>({
    name: '',
    category: 'UTILITY',
    language: 'en_US',
    headerType: 'none',
    headerText: '',
    headerImage: null,
    bodyText: '',
    footerText: '',
    buttons: []
  });

  // Dialog and UI states
  const [variableDialog, setVariableDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup effect for preview URLs
  useEffect(() => {
    return () => {
      if (headerImagePreview) {
        URL.revokeObjectURL(headerImagePreview);
      }
    };
  }, []);

  // Extract variables from body text for preview
  useEffect(() => {
    const variables: Record<string, string> = {};
    if (templateData.bodyText) {
      // Support both positional {{1}} and named {{variable_name}} variables
      const positionalMatches = templateData.bodyText.match(/\{\{(\d+)\}\}/g);
      const namedMatches = templateData.bodyText.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
      
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
    setPreviewVariables(variables);
  }, [templateData.bodyText, variableExamples]);

  // Simplified state update functions
  const updateTemplateData = (updates: Partial<TemplateState>) => {
    setTemplateData(prev => ({ ...prev, ...updates }));
  };

  // Button management functions
  const addButton = () => {
    const newButton: TemplateButton = {
      type: 'QUICK_REPLY',
      text: ''
    };
    updateTemplateData({
      buttons: [...templateData.buttons, newButton]
    });
  };

  const removeButton = (buttonIndex: number) => {
    updateTemplateData({
      buttons: templateData.buttons.filter((_, i) => i !== buttonIndex)
    });
  };

  const updateButton = (buttonIndex: number, updates: Partial<TemplateButton>) => {
    const updatedButtons = templateData.buttons.map((btn, i) => 
      i === buttonIndex ? { ...btn, ...updates } : btn
    );
    updateTemplateData({ buttons: updatedButtons });
  };

  const insertVariable = (variableName: string) => {
    const currentText = templateData.bodyText;
    const newText = `${currentText}{{${variableName}}}`;
    updateTemplateData({ bodyText: newText });
    setVariableDialog(false);
  };

  const validateTemplate = (): string[] => {
    const errors: string[] = [];

    if (!templateData.name.trim()) {
      errors.push('Template name is required');
    } else if (!/^[a-z0-9_]+$/.test(templateData.name)) {
      errors.push('Template name can only contain lowercase letters, numbers, and underscores');
    }

    if (!templateData.bodyText.trim()) {
      errors.push('Body text is required');
    }

    // Check for header/footer length limits
    if (templateData.headerType === 'text' && templateData.headerText.length > 60) {
      errors.push('Header text cannot exceed 60 characters');
    }

    if (templateData.footerText.length > 60) {
      errors.push('Footer text cannot exceed 60 characters');
    }

    // Check button limits
    if (templateData.buttons.length > 10) {
      errors.push('Cannot have more than 10 buttons');
    }

    templateData.buttons.forEach((btn, btnIndex) => {
      if (!btn.text.trim()) {
        errors.push(`Button ${btnIndex + 1} must have text`);
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

    return errors;
  };

  const handleMediaUpload = async (file: File) => {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setUploadingMedia(true);
    
    // Create preview URL immediately
    const previewUrl = URL.createObjectURL(file);
    setHeaderImagePreview(previewUrl);
    
    // Store the file for later upload with the template
    updateTemplateData({ headerImage: file });
    
    setUploadingMedia(false);
    toast.success('Image ready for upload');
  };

  // Enhanced save function using the new unified backend endpoint
  const handleSave = async (submitToWhatsApp = false) => {
    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add basic template information
      formData.append('name', templateData.name);
      formData.append('category', templateData.category);
      formData.append('language', templateData.language);
      formData.append('bodyText', templateData.bodyText);
      
      // Add header data
      if (templateData.headerType === 'text' && templateData.headerText) {
        formData.append('headerText', templateData.headerText);
      } else if (templateData.headerType === 'image' && templateData.headerImage) {
        formData.append('imageHeader', templateData.headerImage);
      }
      
      // Add footer if present
      if (templateData.footerText) {
        formData.append('footerText', templateData.footerText);
      }
      
      // Add buttons if present
      if (templateData.buttons.length > 0) {
        formData.append('buttons', JSON.stringify(templateData.buttons));
      }
      
      // Add variable examples if present
      if (Object.keys(variableExamples).length > 0) {
        formData.append('variableExamples', JSON.stringify(variableExamples));
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/templates/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        toast.success(
          submitToWhatsApp 
            ? 'Template created and submitted to WhatsApp for review!' 
            : 'Template created successfully!'
        );
        navigate('/user/templates');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || errorData.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Create template error:', error);
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced WhatsApp-style preview component
  const renderPreview = () => {
    const getTextWithVariables = (text: string) => {
      if (!text) return '';
      let processedText = text;
      Object.entries(previewVariables).forEach(([varName, value]) => {
        processedText = processedText.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value);
      });
      return processedText;
    };

    return (
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
        {/* Phone Frame */}
        <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800">
          {/* Phone Status Bar */}
          <div className="bg-black text-white text-xs p-2 flex justify-between items-center">
            <span>9:41</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
            <span>100%</span>
          </div>
          
          {/* WhatsApp Header */}
          <div className="bg-green-600 text-white p-4 flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">Prime SMS</div>
              <div className="text-xs opacity-90">Business Account</div>
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="bg-gray-50 p-4 min-h-[300px] relative" 
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.1'%3E%3Cpath d='M0 0h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
                 backgroundSize: '40px 40px'
               }}>
            
            {/* Message Bubble */}
            <div className="bg-white rounded-lg shadow-sm border max-w-[85%] ml-auto">
              {/* Header Image/Text */}
              {templateData.headerType === 'image' && headerImagePreview && (
                <div className="rounded-t-lg overflow-hidden">
                  <img 
                    src={headerImagePreview} 
                    alt="Header preview"
                    className="w-full h-auto max-h-40 object-cover"
                  />
                </div>
              )}
              
              {templateData.headerType === 'text' && templateData.headerText && (
                <div className="p-3 pb-0">
                  <div className="font-bold text-gray-900 text-sm">
                    {getTextWithVariables(templateData.headerText)}
                  </div>
                </div>
              )}
              
              {/* Body Text */}
              <div className="p-3">
                <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {templateData.bodyText ? getTextWithVariables(templateData.bodyText) : (
                    <span className="text-gray-400 italic">Start typing your message...</span>
                  )}
                </div>
                
                {/* Footer */}
                {templateData.footerText && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {getTextWithVariables(templateData.footerText)}
                    </div>
                  </div>
                )}
                
                {/* Timestamp */}
                <div className="flex justify-end mt-2">
                  <div className="text-xs text-gray-400 flex items-center">
                    <span>Now</span>
                    <CheckCircle className="ml-1 h-3 w-3 text-blue-500" />
                  </div>
                </div>
              </div>
              
              {/* Buttons */}
              {templateData.buttons.length > 0 && (
                <div className="border-t border-gray-100 p-1">
                  {templateData.buttons.map((button, index) => (
                    <div 
                      key={index} 
                      className="mx-2 my-1 py-2 px-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                    >
                      {button.text || `Button ${index + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Variables Display */}
            {Object.keys(previewVariables).length > 0 && (
              <div className="mt-4 text-xs text-gray-500">
                <div className="flex items-center mb-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span>Variables Preview:</span>
                </div>
                {Object.entries(previewVariables).map(([key, value]) => (
                  <div key={key} className="ml-4">
                    <code className="bg-gray-200 px-1 rounded">{`{{${key}}}`}</code> → {value}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user/templates')} 
              className="mr-4 hover:bg-white/60"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Create Template
              </h1>
              <p className="text-gray-600 mt-1">Design your WhatsApp message template with real-time preview</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
              <Button 
                variant="outline" 
                onClick={() => setPreviewDialog(true)}
                className="bg-white/80 hover:bg-white border-gray-200"
              >
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
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
              className="bg-white/80 hover:bg-white border-gray-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Draft'}
            </Button>
            
            <Button 
              onClick={() => handleSave(true)}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create & Submit'}
            </Button>
          </div>
        </div>

        {/* Responsive Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Form (60% on desktop) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Basic Information Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-indigo-600" />
                  Template Information
                </CardTitle>
                <CardDescription>
                  Basic details about your WhatsApp template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Template Name *
                    </Label>
                    <Input
                      id="name"
                      value={templateData.name}
                      onChange={(e) => updateTemplateData({ 
                        name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') 
                      })}
                      placeholder="my_template_name"
                      className="mt-1 font-mono bg-white/80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only lowercase letters, numbers, and underscores
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Category *
                    </Label>
                    <Select 
                      value={templateData.category} 
                      onValueChange={(value: string) => 
                        updateTemplateData({ category: value as TemplateCategory })
                      }
                    >
                      <SelectTrigger className="mt-1 bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div>
                              <div className="font-medium">{cat.label}</div>
                              <div className="text-xs text-gray-500">{cat.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="language" className="text-sm font-medium text-gray-700">
                    Language
                  </Label>
                  <Select 
                    value={templateData.language} 
                    onValueChange={(value) => updateTemplateData({ language: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white/80">
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
              </CardContent>
            </Card>

            {/* Header Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2 text-indigo-600" />
                  Header (Optional)
                </CardTitle>
                <CardDescription>
                  Add a text or image header to your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Header Type</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={templateData.headerType === 'none' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTemplateData({ headerType: 'none', headerText: '', headerImage: null })}
                      className="flex-1"
                    >
                      None
                    </Button>
                    <Button
                      type="button"
                      variant={templateData.headerType === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTemplateData({ headerType: 'text', headerImage: null })}
                      className="flex-1"
                    >
                      Text
                    </Button>
                    <Button
                      type="button"
                      variant={templateData.headerType === 'image' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateTemplateData({ headerType: 'image', headerText: '' })}
                      className="flex-1"
                    >
                      Image
                    </Button>
                  </div>
                </div>

                {templateData.headerType === 'text' && (
                  <div>
                    <Label htmlFor="headerText" className="text-sm font-medium text-gray-700">
                      Header Text
                    </Label>
                    <Input
                      id="headerText"
                      value={templateData.headerText}
                      onChange={(e) => updateTemplateData({ headerText: e.target.value })}
                      placeholder="Header text (60 chars max)"
                      maxLength={60}
                      className="mt-1 bg-white/80"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {templateData.headerText.length}/60 characters
                    </p>
                  </div>
                )}

                {templateData.headerType === 'image' && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Header Image</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50/50">
                      {headerImagePreview ? (
                        <div className="space-y-3">
                          <img 
                            src={headerImagePreview} 
                            alt="Header preview"
                            className="max-w-full max-h-32 rounded-lg mx-auto border shadow-sm"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingMedia}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Change Image
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (headerImagePreview) {
                                  URL.revokeObjectURL(headerImagePreview);
                                }
                                setHeaderImagePreview(null);
                                updateTemplateData({ headerImage: null });
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600">
                            Upload an image for the header
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingMedia}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {uploadingMedia ? 'Processing...' : 'Choose Image'}
                          </Button>
                          <p className="text-xs text-gray-500">
                            Max file size: 5MB • JPG, PNG supported
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleMediaUpload(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Body Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                    Message Body *
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVariableDialog(true)}
                  >
                    <Variable className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </CardTitle>
                <CardDescription>
                  The main content of your message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={templateData.bodyText}
                  onChange={(e) => updateTemplateData({ bodyText: e.target.value })}
                  placeholder="Type your message here... Use variables for dynamic content"
                  rows={6}
                  className="bg-white/80 resize-none"
                />
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Variable Format Notice:</p>
                      <p>• Named variables like <code className="bg-blue-100 px-1 rounded">{`{{customer_name}}`}</code> will be automatically converted to <code className="bg-blue-100 px-1 rounded">{`{{1}}`}</code>, <code className="bg-blue-100 px-1 rounded">{`{{2}}`}</code>, etc.</p>
                      <p>• WhatsApp requires numbered format for template approval</p>
                      <p>• Set example values below for better preview</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2 text-indigo-600" />
                  Footer (Optional)
                </CardTitle>
                <CardDescription>
                  Add a small footer text to your template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={templateData.footerText}
                  onChange={(e) => updateTemplateData({ footerText: e.target.value })}
                  placeholder="Footer text (60 chars max)"
                  maxLength={60}
                  className="bg-white/80"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {templateData.footerText.length}/60 characters
                </p>
              </CardContent>
            </Card>

            {/* Buttons Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                    Action Buttons (Optional)
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addButton}
                    disabled={templateData.buttons.length >= 10}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Button
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add interactive buttons for user actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templateData.buttons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No buttons added yet</p>
                    <p className="text-xs">Click "Add Button" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {templateData.buttons.map((button, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Button {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeButton(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-gray-600">Type</Label>
                            <Select
                              value={button.type}
                              onValueChange={(value: string) => 
                                updateButton(index, { type: value as ButtonType })
                              }
                            >
                              <SelectTrigger className="h-9 bg-white">
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
                            <Label className="text-xs text-gray-600">Text</Label>
                            <Input
                              value={button.text}
                              onChange={(e) => updateButton(index, { text: e.target.value })}
                              placeholder="Button text"
                              className="h-9 bg-white"
                              maxLength={25}
                            />
                          </div>
                        </div>

                        {button.type === 'URL' && (
                          <div className="mt-3">
                            <Label className="text-xs text-gray-600">URL</Label>
                            <Input
                              value={button.url || ''}
                              onChange={(e) => updateButton(index, { url: e.target.value })}
                              placeholder="https://example.com"
                              className="h-9 bg-white"
                            />
                          </div>
                        )}

                        {button.type === 'PHONE_NUMBER' && (
                          <div className="mt-3">
                            <Label className="text-xs text-gray-600">Phone Number</Label>
                            <Input
                              value={button.phone_number || ''}
                              onChange={(e) => updateButton(index, { phone_number: e.target.value })}
                              placeholder="+1234567890"
                              className="h-9 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Preview (40% on desktop) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Smartphone className="h-5 w-5 mr-2 text-green-600" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    Real-time preview updates as you type
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderPreview()}
                </CardContent>
              </Card>

              {/* Variable Examples */}
              {Object.keys(previewVariables).length > 0 && (
                <Card className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Variable className="h-4 w-4 mr-2 text-amber-600" />
                      Variable Examples
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        Important for WhatsApp
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Set example values for each variable. These help with preview and WhatsApp template approval.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(previewVariables).map(([varName, currentExample]) => (
                        <div key={varName} className="bg-white rounded-lg p-3 border border-amber-200">
                          <Label className="text-xs font-medium text-gray-700 mb-2 block">
                            <code className="bg-amber-100 px-2 py-1 rounded mr-2 text-amber-800">
                              {`{{${varName}}}`}
                            </code>
                            {/* Show if this is a named variable that will be converted */}
                            {!/^\d+$/.test(varName) && (
                              <span className="text-xs text-amber-600 ml-1">
                                (→ will become {`{{numbered}}`})
                              </span>
                            )}
                          </Label>
                          <Input
                            value={variableExamples[varName] || ''}
                            onChange={(e) => 
                              setVariableExamples(prev => ({
                                ...prev,
                                [varName]: e.target.value
                              }))
                            }
                            placeholder={currentExample}
                            className="h-8 text-sm bg-white border-amber-200 focus:border-amber-400"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
                      <div className="flex items-start space-x-2">
                        <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800">
                          <p className="font-medium mb-1">Why examples matter:</p>
                          <p>• WhatsApp requires example values for all variables</p>
                          <p>• Good examples improve template approval chances</p>
                          <p>• Examples are automatically generated but you can customize them</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Variable Dialog */}
      <Dialog open={variableDialog} onOpenChange={setVariableDialog}>
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
            <Button variant="outline" onClick={() => setVariableDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
