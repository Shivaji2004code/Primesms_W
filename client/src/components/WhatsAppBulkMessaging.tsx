import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus,
  Trash2,
  FileText,
  Phone,
  Globe,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Sparkles,
  Target,
  MessageSquare,
  Settings,
  Info,
  RefreshCw,
  Copy
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { useStore } from '../store/useStore';

interface WhatsAppNumber {
  id: string;
  phone_number_id: string;
  phone_number: string;
  display_name: string;
  label: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: any[];
  hasVariables: boolean;
  hasButtons: boolean;
}

interface TemplateVariable {
  index: number;
  component: string;
  placeholder: string;
  required: boolean;
  type?: string;
}

interface TemplateButton {
  index: number;
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
  copy_code?: string;
}

interface Language {
  code: string;
  name: string;
}

interface ImportResult {
  valid_numbers: string[];
  invalid_numbers: string[];
  total_processed: number;
  valid_count: number;
  invalid_count: number;
}

interface ExcelPreview {
  columns: string[];
  sample_data: any[][];
  total_rows: number;
}

export default function WhatsAppBulkMessaging() {
  const { addNotification } = useStore();
  
  // Form state
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en_US');
  const [campaignName, setCampaignName] = useState<string>('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualRecipients, setManualRecipients] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templatePreview, setTemplatePreview] = useState<string>('');
  const [campaignPreview, setCampaignPreview] = useState<any>(null);
  
  // Excel import state
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  
  // Data state
  const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppNumber[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [templateDetails, setTemplateDetails] = useState<{
    variables: TemplateVariable[];
    buttons: TemplateButton[];
    hasVariables: boolean;
    hasButtons: boolean;
    templateTypeInfo?: {
      hasStaticImage: boolean;
      hasDynamicImage: boolean;
      hasVideo: boolean;
      hasDocument: boolean;
    };
  }>({
    variables: [],
    buttons: [],
    hasVariables: false,
    hasButtons: false
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    numbers: false,
    templates: false,
    languages: false,
    preview: false,
    sending: false,
    columnImport: false
  });
  
  // Alert state
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } | null>(null);

  // Form progress tracking
  const totalSteps = 4;

  // Load initial data
  useEffect(() => {
    fetchWhatsAppNumbers();
    fetchLanguages();
  }, []);

  // Load templates when language changes
  useEffect(() => {
    if (selectedLanguage) {
      fetchTemplates();
    }
  }, [selectedLanguage]);

  // Load template details when template or language changes
  useEffect(() => {
    if (selectedTemplate && selectedLanguage) {
      fetchTemplateDetails();
    }
  }, [selectedTemplate, selectedLanguage]);

  // Calculate form completion percentage
  const getFormProgress = () => {
    let completed = 0;
    if (selectedNumber) completed++;
    if (selectedTemplate) completed++;
    if (recipients && recipients.length > 0) completed++;
    if (templateDetails.hasVariables ? Object.keys(templateVariables).length === templateDetails.variables.length : true) completed++;
    return (completed / totalSteps) * 100;
  };

  const getStepStatus = (step: number) => {
    if (step === 1) return selectedNumber ? 'completed' : 'current';
    if (step === 2) return selectedTemplate ? 'completed' : selectedNumber ? 'current' : 'pending';
    if (step === 3) return recipients && recipients.length > 0 ? 'completed' : selectedTemplate ? 'current' : 'pending';
    if (step === 4) return templateDetails.hasVariables ? Object.keys(templateVariables).length === templateDetails.variables.length : true ? 'completed' : recipients && recipients.length > 0 ? 'current' : 'pending';
    return 'pending';
  };

  const fetchWhatsAppNumbers = async () => {
    setLoading(prev => ({ ...prev, numbers: true }));
    try {
      const response = await fetch('/api/whatsapp/numbers', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setWhatsappNumbers(data.data || []);
      } else if (response.status === 401) {
        addNotification({
          type: 'error',
          title: 'Authentication required',
          description: 'Please log in first to access WhatsApp functionality'
        });
      } else {
        console.error('Failed to load WhatsApp numbers:', response.status);
        addNotification({
          type: 'error',
          title: 'Error loading WhatsApp numbers',
          description: 'Please try again'
        });
      }
    } catch (error) {
      console.error('Error fetching WhatsApp numbers:', error);
      addNotification({
        type: 'error',
        title: 'Connection error',
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(prev => ({ ...prev, numbers: false }));
    }
  };

  const fetchLanguages = async () => {
    setLoading(prev => ({ ...prev, languages: true }));
    try {
      const response = await fetch('/api/whatsapp/languages', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    } finally {
      setLoading(prev => ({ ...prev, languages: false }));
    }
  };

  const fetchTemplates = async () => {
    setLoading(prev => ({ ...prev, templates: true }));
    try {
      const response = await fetch(`/api/whatsapp/templates?language=${selectedLanguage}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(prev => ({ ...prev, templates: false }));
    }
  };

  const fetchTemplateDetails = async () => {
    if (!selectedTemplate) return;
    
    try {
      console.log('Fetching template details for:', selectedTemplate);
      
      // Use the correct endpoint
      const response = await fetch(`/api/whatsapp/template-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          template_name: selectedTemplate,
          language: selectedLanguage || 'en_US'
        })
      });
      
      console.log('Template details response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Template details data:', data);
        setTemplateDetails(data.data);
        setTemplatePreview(data.data.preview || '');
      } else {
        console.error('Failed to fetch template details:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedExtensions = ['.txt', '.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Invalid file type',
        message: `Please upload a supported file type: ${allowedExtensions.join(', ')}`
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'File too large',
        message: 'File size must be less than 10MB'
      });
      return;
    }

    // For Excel files, first preview the columns
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      try {
        console.log('Previewing Excel file:', file.name);
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/whatsapp/preview-excel', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setExcelPreview(data.data);
          setUploadedFile(file);
          setSelectedColumn(''); // Reset column selection
          
          setAlertState({
            show: true,
            type: 'success',
            title: 'Excel file loaded',
            message: `Found ${data.data.columns.length} columns. Please select the column containing phone numbers.`
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to preview Excel file');
        }
      } catch (error) {
        console.error('Error previewing Excel file:', error);
        setAlertState({
          show: true,
          type: 'error',
          title: 'Preview failed',
          message: error instanceof Error ? error.message : 'Please check your Excel file format'
        });
      }
    } else {
      // For CSV/TXT files, use simple client-side import
      handleSimpleFileImport(file);
    }
    
    // Reset the file input
    event.target.value = '';
  };

  const importRecipientsFromFile = async (file: File) => {
    try {
      console.log('Importing recipients from file:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/whatsapp/import-recipients', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('Import response status:', response.status);

      if (response.ok) {
        const data: ImportResult = await response.json();
        console.log('Import response data:', data);
        
        if (data.valid_numbers && data.valid_numbers.length > 0) {
          // Put numbers in manual entry field line by line
          const numbersText = data.valid_numbers.join('\n');
          setManualRecipients(numbersText);
          
          setAlertState({
            show: true,
            type: 'success',
            title: 'Numbers imported to manual entry',
            message: `Imported ${data.valid_count} numbers to manual entry field${data.invalid_count > 0 ? `. ${data.invalid_count} invalid numbers skipped` : ''}`
          });
        } else {
          setAlertState({
            show: true,
            type: 'warning',
            title: 'No valid numbers found',
            message: 'Please check your file format. For Excel files, ensure phone numbers are in the selected column.'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Import failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error importing recipients:', error);
      setAlertState({
        show: true,
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Please check your file format and try again'
      });
    }
  };

  const handleColumnSelection = async () => {
    console.log('handleColumnSelection called');
    console.log('selectedColumn:', selectedColumn);
    console.log('uploadedFile:', uploadedFile);
    
    if (!selectedColumn || !uploadedFile) {
      console.log('Missing selectedColumn or uploadedFile');
      return;
    }

    setLoading(prev => ({ ...prev, columnImport: true }));

    try {
      console.log('Importing from selected column:', selectedColumn);
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('column', selectedColumn);

      console.log('Sending request to /api/whatsapp/import-excel-column');
      const response = await fetch('/api/whatsapp/import-excel-column', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data: ImportResult = await response.json();
        console.log('Column import response data:', data);
        
        if (data.valid_numbers && data.valid_numbers.length > 0) {
          console.log('Setting manual recipients:', data.valid_numbers);
          // Put numbers in manual entry field line by line
          const numbersText = data.valid_numbers.join('\n');
          setManualRecipients(numbersText);
          
          setAlertState({
            show: true,
            type: 'success',
            title: 'Numbers imported to manual entry',
            message: `Imported ${data.valid_count} numbers from column "${selectedColumn}" to manual entry field${data.invalid_count > 0 ? `. ${data.invalid_count} invalid numbers skipped` : ''}`
          });
          
          // Clear Excel preview state
          setExcelPreview(null);
          setSelectedColumn('');
          setUploadedFile(null);
        } else {
          setAlertState({
            show: true,
            type: 'warning',
            title: 'No data found',
            message: `No data found in column "${selectedColumn}". Please select a different column.`
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response data:', errorData);
        throw new Error(errorData.error || 'Failed to import from selected column');
      }
    } catch (error) {
      console.error('Error importing from column:', error);
      setAlertState({
        show: true,
        type: 'error',
        title: 'Import failed',
        message: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setLoading(prev => ({ ...prev, columnImport: false }));
    }
  };

  const handleCopyColumnData = () => {
    if (!selectedColumn || !excelPreview) return;
    
    const columnIndex = excelPreview.columns.findIndex(col => col === selectedColumn);
    if (columnIndex === -1) return;
    
    // Extract data from selected column only (for quick-send with static variables)
    const columnData = excelPreview.sample_data
      .map(row => row[columnIndex])
      .filter(cell => cell && cell.toString().trim() !== '')
      .map(cell => cell.toString().trim());
    
    if (columnData.length === 0) {
      setAlertState({
        show: true,
        type: 'warning',
        title: 'No data to copy',
        message: `No data found in column "${selectedColumn}"`
      });
      return;
    }
    
    // Copy to clipboard
    const textToCopy = columnData.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setAlertState({
        show: true,
        type: 'success',
        title: 'Data copied!',
        message: `Copied ${columnData.length} entries from column "${selectedColumn}". Paste them in the manual entry field below.`
      });
    }).catch(() => {
      // Fallback: put data directly in manual entry field
      setManualRecipients(textToCopy);
      setAlertState({
        show: true,
        type: 'success',
        title: 'Data added to manual entry',
        message: `Added ${columnData.length} entries from column "${selectedColumn}" to manual entry field.`
      });
    });
  };

  // Simple CSV file reader for client-side processing
  const handleSimpleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      // Simple parsing for CSV/TXT files
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length === 0) {
        setAlertState({
          show: true,
          type: 'warning',
          title: 'Empty file',
          message: 'The file appears to be empty or contains no valid data.'
        });
        return;
      }
      
      // Join all lines and put in manual entry field
      setManualRecipients(lines.join('\n'));
      
      setAlertState({
        show: true,
        type: 'success',
        title: 'File imported successfully',
        message: `Imported ${lines.length} entries to manual entry field. Review and edit as needed.`
      });
    };
    
    reader.onerror = () => {
      setAlertState({
        show: true,
        type: 'error',
        title: 'File read error',
        message: 'Failed to read the file. Please try again.'
      });
    };
    
    reader.readAsText(file);
  };

  const handleManualRecipientsAdd = () => {
    if (!manualRecipients.trim()) return;
    
    const numbers = manualRecipients
      .split(/[,\n]/)
      .map(num => num.trim())
      .filter(num => num.length > 0);
    
    const newRecipients = [...new Set([...recipients, ...numbers])];
    setRecipients(newRecipients);
    setManualRecipients('');
    
    setAlertState({
      show: true,
      type: 'success',
      title: 'Recipients added',
      message: `Added ${numbers.length} new recipients. Total: ${newRecipients.length}`
    });
  };

  const handleVariableChange = (index: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handlePreviewCampaign = async () => {
    if (!selectedTemplate || recipients.length === 0) return;
    
    setLoading(prev => ({ ...prev, preview: true }));
    try {
      // Use the recipients data which now preserves CSV format
      const recipientsText = recipients.slice(0, 3).join('\n');
      
      const payload = {
        templateName: selectedTemplate,
        language: selectedLanguage,
        recipients_text: recipientsText, // Send CSV data for processing
        variables: templateVariables
      };

      const response = await fetch('/api/whatsapp/preview-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // Handle the new recipient_previews format from server
        const previewData = data.data.recipient_previews || data.data;
        setCampaignPreview(previewData);
        
        setAlertState({
          show: true,
          type: 'success',
          title: 'Preview generated',
          message: `Showing preview for ${Math.min(3, recipients.length)} recipients`
        });
      } else {
        throw new Error('Preview failed');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setAlertState({
        show: true,
        type: 'error',
        title: 'Preview failed',
        message: 'Please check your template and variables'
      });
    } finally {
      setLoading(prev => ({ ...prev, preview: false }));
    }
  };

  const handleQuickSend = async () => {
    if (!selectedNumber || !selectedTemplate || recipients.length === 0) {
      setAlertState({
        show: true,
        type: 'error',
        title: 'Missing information',
        message: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(prev => ({ ...prev, sending: true }));
    try {
      const payload = {
        phone_number_id: selectedNumber,
        template_name: selectedTemplate,
        language: selectedLanguage,
        recipients_text: recipients.join('\n'),
        variables: templateVariables,
        campaign_name: campaignName || `Quick Send - ${selectedTemplate} - ${new Date().toISOString()}`
      };

      const response = await fetch('/api/whatsapp/quick-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await response.json();
        
        setAlertState({
          show: true,
          type: 'success',
          title: 'Campaign started successfully',
          message: `Sending ${recipients.length} messages. You can track progress in the reports section.`
        });
        
        // Reset form
        resetForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Send failed');
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      setAlertState({
        show: true,
        type: 'error',
        title: 'Send failed',
        message: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };


  const resetForm = () => {
    setSelectedNumber('');
    setSelectedTemplate('');
    setCampaignName('');
    setRecipients([]);
    setManualRecipients('');
    setTemplateVariables({});
    setCampaignPreview(null);
    setTemplateDetails({
      variables: [],
      buttons: [],
      hasVariables: false,
      hasButtons: false
    });
  };

  const removeRecipient = (index: number) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
  };

  const generateLivePreview = () => {
    if (!templatePreview) return templatePreview;
    
    // If no variables have been filled, use the original preview
    if (Object.keys(templateVariables).length === 0 || Object.values(templateVariables).every(v => !v)) {
      return templatePreview;
    }
    
    // Replace variables in the original preview
    let livePreview = templatePreview;
    Object.keys(templateVariables).forEach(index => {
      const value = templateVariables[index];
      if (value) {
        livePreview = livePreview.replace(new RegExp(`\\{\\{${index}\\}\\}`, 'g'), value);
      }
    });
    
    return livePreview;
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Setup Progress</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {Math.round(getFormProgress())}% Complete
            </Badge>
          </div>
          <Progress value={getFormProgress()} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>WhatsApp Number</span>
            <span>Template</span>
            <span>Recipients</span>
            <span>Variables</span>
          </div>
        </CardContent>
      </Card>

      {/* Alert Display */}
      {alertState?.show && (
        <Alert
          variant={
            alertState.type === 'success' 
              ? 'default' 
              : alertState.type === 'warning' 
              ? 'default' 
              : 'destructive'
          }
          className="border-l-4 shadow-lg"
        >
          {alertState.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {alertState.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {alertState.type === 'warning' && <AlertCircle className="h-4 w-4" />}
          <AlertTitle className="text-base font-semibold mb-2">
            {alertState.title}
          </AlertTitle>
          <AlertDescription className="whitespace-pre-line text-sm leading-relaxed">
            {alertState.message}
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAlertState(null)}
            className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-gray-100"
          >
            ×
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: WhatsApp Configuration */}
          <Card className={`border-2 ${getStepStatus(1) === 'completed' ? 'border-green-200 bg-green-50' : getStepStatus(1) === 'current' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus(1) === 'completed' ? 'bg-green-500' : getStepStatus(1) === 'current' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {getStepStatus(1) === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white font-semibold">1</span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Phone className="h-5 w-5 mr-2 text-blue-600" />
                      WhatsApp Configuration
                    </CardTitle>
                    <CardDescription>Select your WhatsApp Business number and template</CardDescription>
                  </div>
                </div>
                {getStepStatus(1) === 'completed' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp-number" className="text-sm font-medium">WhatsApp Business Number *</Label>
                  <Select 
                    value={selectedNumber} 
                    onValueChange={setSelectedNumber}
                    disabled={loading.numbers}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loading.numbers ? "Loading numbers..." : "Select WhatsApp number"} />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappNumbers.map((number) => (
                        <SelectItem key={number.id} value={number.phone_number_id}>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-green-600" />
                            {number.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language" className="text-sm font-medium">Language *</Label>
                  <Select 
                    value={selectedLanguage} 
                    onValueChange={(value) => {
                      setSelectedLanguage(value);
                      setSelectedTemplate(''); // Reset template when language changes
                    }}
                    disabled={loading.languages}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={loading.languages ? "Loading languages..." : "Select language"} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2 text-blue-600" />
                            {language.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

                              <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="template" className="text-sm font-medium flex items-center">
                      Template *
                      {loading.templates && <Loader2 className="h-4 w-4 ml-2 animate-spin text-blue-600" />}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchTemplates}
                      disabled={loading.templates || !selectedLanguage}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                  </div>
                  <Select 
                    value={selectedTemplate || ''} 
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                    }}
                    disabled={loading.templates}
                  >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loading.templates ? "Loading templates..." : "Select template"} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.name}>
                        <div className="flex items-center justify-between w-full py-1">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 mr-3 text-purple-600" />
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-500">{template.language}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {template.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Campaign Details */}
          <Card className={`border-2 ${getStepStatus(2) === 'completed' ? 'border-green-200 bg-green-50' : getStepStatus(2) === 'current' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus(2) === 'completed' ? 'bg-green-500' : getStepStatus(2) === 'current' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    {getStepStatus(2) === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-white font-semibold">2</span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2 text-orange-600" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription>Set campaign name and recipient list</CardDescription>
                  </div>
                </div>
                {getStepStatus(2) === 'completed' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-name" className="text-sm font-medium">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name (optional)"
                  className="mt-1"
                />
              </div>

              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="file">File Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4">
                  <div>
                    <Label htmlFor="manual-recipients" className="text-sm font-medium">Phone Numbers *</Label>
                    <Textarea
                      id="manual-recipients"
                      value={manualRecipients}
                      onChange={(e) => setManualRecipients(e.target.value)}
                      placeholder="Enter phone numbers separated by commas or new lines (e.g., +1234567890, +0987654321)"
                      className="mt-1"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include country code (e.g., +1 for US, +91 for India)
                    </p>
                  </div>
                  <Button 
                    onClick={handleManualRecipientsAdd}
                    disabled={!manualRecipients.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipients
                  </Button>
                </TabsContent>
                
                <TabsContent value="file" className="space-y-4">
                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".txt,.csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="text-lg font-medium text-gray-900 mb-2">Upload Phone Numbers</div>
                      <div className="text-sm text-gray-500 mb-4">
                        Upload .txt, .csv, .xlsx, or .xls file with phone numbers
                      </div>
                      <div className="text-xs text-gray-400 mb-4">
                        • Excel files: Preview columns → select data → copy to manual entry<br/>
                        • CSV/TXT files: Direct import to manual entry field<br/>
                        • Include country code (e.g., 919394567890, 1234567890)
                      </div>
                      <Button variant="outline" className="bg-white">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </label>
                  </div>

                  {/* Excel Column Selection */}
                  {excelPreview && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-green-900">Select Phone Number Column</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {excelPreview.total_rows} rows found
                          </Badge>
                        </div>
                        
                        <div>
                          <Label htmlFor="column-select" className="text-sm font-medium text-green-800">
                            Choose the column containing phone numbers:
                          </Label>
                          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select a column" />
                            </SelectTrigger>
                            <SelectContent>
                              {excelPreview.columns.map((column, index) => (
                                <SelectItem key={index} value={column}>
                                  <div className="flex items-center">
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded mr-2">
                                      {String.fromCharCode(65 + index)}
                                    </span>
                                    {column}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Sample Data Preview */}
                        {excelPreview.sample_data.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-green-800 mb-2 block">
                              Sample data from selected columns:
                            </Label>
                            <div className="bg-white border border-green-200 rounded-lg overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-green-100">
                                    <tr>
                                      {excelPreview.columns.map((column, index) => (
                                        <th key={index} className="px-3 py-2 text-left font-medium text-green-800">
                                          {String.fromCharCode(65 + index)}: {column}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {excelPreview.sample_data.slice(0, 5).map((row, rowIndex) => (
                                      <tr key={rowIndex} className="border-t border-green-100">
                                        {row.map((cell, cellIndex) => (
                                          <td key={cellIndex} className="px-3 py-2 text-gray-700">
                                            {cell || '-'}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={handleColumnSelection}
                            disabled={!selectedColumn || loading.columnImport}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {loading.columnImport ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Import from {selectedColumn}
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCopyColumnData}
                            disabled={!selectedColumn}
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy All Data (CSV)
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setExcelPreview(null);
                              setSelectedColumn('');
                              setUploadedFile(null);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* File Upload Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <div className="font-medium mb-2">📊 Excel Variable Import:</div>
                        <ul className="space-y-1 text-xs">
                          <li>• Excel: Select phone number column → Copy data copies ALL columns</li>
                          <li>• Format: Phone number + template variables in CSV format</li>
                          <li>• Example: 919398424270,John,123456 (phone,name,code)</li>
                          <li>• Template variables will be automatically filled from Excel columns</li>
                          <li>• Review data in manual entry field before sending</li>
                          <li>• Maximum file size: 10MB</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Recipients List */}
              {recipients.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Recipients ({recipients.length})</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecipients([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <span className="text-sm font-mono">{recipient}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipient(index)}
                          className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Template Variables */}
          {templateDetails.hasVariables && templateDetails.variables.length > 0 && (
            <Card className={`border-2 ${getStepStatus(4) === 'completed' ? 'border-green-200 bg-green-50' : getStepStatus(4) === 'current' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStepStatus(4) === 'completed' ? 'bg-green-500' : getStepStatus(4) === 'current' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      {getStepStatus(4) === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-white font-semibold">3</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <Settings className="h-5 w-5 mr-2 text-purple-600" />
                        Template Variables
                      </CardTitle>
                      <CardDescription>Fill in the template variables for your message</CardDescription>
                    </div>
                  </div>
                  {getStepStatus(4) === 'completed' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {templateDetails.variables.map((variable) => (
                  <div key={variable.index} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {variable.placeholder} {variable.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={templateVariables[variable.index.toString()] || ''}
                      onChange={(e) => handleVariableChange(variable.index.toString(), e.target.value)}
                      placeholder={`Enter ${variable.placeholder.toLowerCase()}`}
                      required={variable.required}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handlePreviewCampaign}
              disabled={!selectedTemplate || recipients.length === 0 || loading.preview}
              className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {loading.preview ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Eye className="h-5 w-5 mr-2" />
              )}
              Preview Campaign
            </Button>
            
            <Button
              onClick={handleQuickSend}
              disabled={!selectedNumber || !selectedTemplate || recipients.length === 0 || loading.sending}
              className="flex-1 h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {loading.sending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              Quick Send ({recipients.length})
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Preview & Info */}
        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{recipients.length}</div>
                  <div className="text-sm text-gray-600">Recipients</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-green-600">{templateDetails.variables.length}</div>
                  <div className="text-sm text-gray-600">Variables</div>
                </div>
              </div>
              
              {selectedTemplate && (
                <div className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">Selected Template</div>
                  <div className="text-sm text-gray-600">{selectedTemplate}</div>
                  <Badge variant="outline" className="mt-1">
                    {templates.find(t => t.name === selectedTemplate)?.category || 'Unknown'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Preview */}
          {templatePreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Template Preview
                </CardTitle>
                <CardDescription>Live preview of your message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-gray-50 rounded-lg border text-sm whitespace-pre-wrap">
                  {generateLivePreview()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Preview */}
          {campaignPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Eye className="h-5 w-5 mr-2 text-green-600" />
                  Campaign Preview
                </CardTitle>
                <CardDescription>Preview of your campaign messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {campaignPreview.map((preview: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      To: {preview.phone || preview.recipient}
                    </div>
                    {preview.variables && Object.keys(preview.variables).length > 0 && (
                      <div className="text-xs text-blue-600 mb-2">
                        Variables: {JSON.stringify(preview.variables)}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {preview.preview || preview.message}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Help & Tips */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Tips & Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">📱 Phone Numbers:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Include country code (+1, +91, etc.)</li>
                  <li>• One number per line in files</li>
                  <li>• Separate with commas manually</li>
                </ul>
              </div>
              
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-2">⚡ Quick Send vs Campaign:</div>
                <ul className="space-y-1 text-xs">
                  <li>• Quick Send: Immediate delivery</li>
                  <li>• Campaign: Scheduled & tracked</li>
                  <li>• Both support variables</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}