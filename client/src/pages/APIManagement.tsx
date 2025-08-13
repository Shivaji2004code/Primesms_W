import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Copy, 
  RefreshCw, 
  Book, 
  Send,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Smartphone,
  MessageSquare,
  Settings,
  Zap,
  FileText,
  Eye,
  PlayCircle,
  ExternalLink,
  Shield,
  Clock,
  Users,
  Activity,
  Terminal,
  Layers,
  MousePointer
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import DashboardLayout from '../components/layout/DashboardLayout';
import type { User, Template } from '../types';

interface TemplateAnalysis {
  required_params: string[];
  optional_params: Array<{
    name: string;
    description: string;
    required: boolean;
    example: string;
  }>;
  variable_count: number;
  has_header: boolean;
  header_type: string | null;
  has_buttons: boolean;
  button_types: Array<{
    type: string;
    text: string;
    index: number;
  }>;
  example_request: {
    method: string;
    url: string;
    body: any;
  };
}

interface MessagePreview {
  header?: string;
  body: string;
  buttons?: Array<{
    type: string;
    text: string;
  }>;
  recipient: string;
}

export default function APIManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateAnalysis, setTemplateAnalysis] = useState<TemplateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState({
    recipient_number: '1234567890',
    variables: {} as any,
    buttons: {} as any
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [messagePreview, setMessagePreview] = useState<MessagePreview | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const user: User = JSON.parse(userData);
    setCurrentUser(user);
    fetchTemplates();
  }, [navigate]);

  useEffect(() => {
    if (selectedTemplate && templateAnalysis) {
      generatePreview();
    }
  }, [testData, selectedTemplate, templateAnalysis]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/templates', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.filter((t: Template) => t.status === 'APPROVED' || t.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTemplate = async (templateName: string) => {
    if (!currentUser || !templateName) return;

    try {
      const response = await fetch(`/api/send/template-info/${currentUser.username}/${templateName}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTemplateAnalysis(data.requirements);
        
        // Initialize test data variables
        const variables: any = {};
        const buttons: any = {};
        
        data.requirements.optional_params.forEach((param: any) => {
          if (param.name.startsWith('var')) {
            variables[param.name] = param.example;
          }
        });

        // Initialize button data if template has buttons
        if (data.requirements.has_buttons) {
          data.requirements.button_types.forEach((button: any) => {
            if (button.type === 'URL') {
              buttons[`button_${button.index}_url`] = 'https://example.com';
            }
          });
        }
        
        setTestData(prev => ({ 
          ...prev, 
          variables, 
          buttons,
          recipient_number: prev.recipient_number.startsWith('+') ? prev.recipient_number.slice(1) : prev.recipient_number
        }));
      }
    } catch (error) {
      console.error('Error analyzing template:', error);
    }
  };

  const generatePreview = () => {
    if (!templateAnalysis || !selectedTemplate) return;

    const template = templates.find(t => t.name === selectedTemplate);
    if (!template) return;

    let preview: MessagePreview = {
      recipient: testData.recipient_number,
      body: '',
      buttons: []
    };

    // Process template components
    template.components?.forEach((component: any) => {
      if (component.type === 'HEADER') {
        if (component.format === 'TEXT') {
          let headerText = component.text || '';
          // Replace variables in header
          Object.keys(testData.variables).forEach(varKey => {
            const varPattern = new RegExp(`{{${varKey.replace('var', '')}}}`, 'g');
            headerText = headerText.replace(varPattern, testData.variables[varKey] || `[${varKey}]`);
          });
          preview.header = headerText;
        }
      } else if (component.type === 'BODY') {
        let bodyText = component.text || '';
        // Replace variables in body
        Object.keys(testData.variables).forEach(varKey => {
          const varPattern = new RegExp(`{{${varKey.replace('var', '')}}}`, 'g');
          bodyText = bodyText.replace(varPattern, testData.variables[varKey] || `[${varKey}]`);
        });
        preview.body = bodyText;
      } else if (component.type === 'BUTTONS') {
        preview.buttons = component.buttons?.map((btn: any) => ({
          type: btn.type,
          text: btn.text
        })) || [];
      }
    });

    setMessagePreview(preview);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const testAPI = async () => {
    if (!currentUser || !selectedTemplate) return;

    setTestLoading(true);
    try {
      const payload: any = {
        username: currentUser.username,
        templatename: selectedTemplate,
        recipient_number: testData.recipient_number,
        ...testData.variables,
        ...testData.buttons
      };

      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setTestResponse({ status: response.status, data: result });
    } catch (error) {
      setTestResponse({ 
        status: 500, 
        data: { error: 'Network Error', message: error instanceof Error ? error.message : 'Unknown error' }
      });
    } finally {
      setTestLoading(false);
    }
  };

  const generateCurlCommand = () => {
    if (!currentUser || !selectedTemplate || !templateAnalysis) return '';

    const payload: any = {
      username: currentUser.username,
      templatename: selectedTemplate,
      recipient_number: testData.recipient_number,
      ...testData.variables,
      ...testData.buttons
    };

    return `curl -X POST "https://primesms.app/api/send" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
  };

  const generateJavaScriptCode = () => {
    if (!currentUser || !selectedTemplate || !templateAnalysis) return '';

    const payload: any = {
      username: currentUser.username,
      templatename: selectedTemplate,
      recipient_number: "RECIPIENT_PHONE_NUMBER",
      ...Object.keys(testData.variables).reduce((acc, key) => {
        acc[key] = `YOUR_${key.toUpperCase()}_VALUE`;
        return acc;
      }, {} as any),
      ...Object.keys(testData.buttons).reduce((acc, key) => {
        acc[key] = "YOUR_URL_HERE";
        return acc;
      }, {} as any)
    };

    return `// JavaScript/Node.js Example
const axios = require('axios');

async function sendWhatsAppMessage() {
  try {
    const response = await axios.post('https://primesms.app/api/send', ${JSON.stringify(payload, null, 4)});
    
    console.log('Message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
sendWhatsAppMessage()
  .then(result => console.log('Success:', result.message_id))
  .catch(error => console.error('Error:', error));`;
  };

  const generatePythonCode = () => {
    if (!currentUser || !selectedTemplate || !templateAnalysis) return '';

    const payload: any = {
      username: currentUser.username,
      templatename: selectedTemplate,
      recipient_number: "RECIPIENT_PHONE_NUMBER",
      ...Object.keys(testData.variables).reduce((acc, key) => {
        acc[key] = `YOUR_${key.toUpperCase()}_VALUE`;
        return acc;
      }, {} as any),
      ...Object.keys(testData.buttons).reduce((acc, key) => {
        acc[key] = "YOUR_URL_HERE";
        return acc;
      }, {} as any)
    };

    return `# Python Example
import requests
import json

def send_whatsapp_message():
    url = "https://primesms.app/api/send"
    
    payload = ${JSON.stringify(payload, null, 4).replace(/"/g, '"')}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        print(f"Message sent successfully: {result['message_id']}")
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"Failed to send message: {e}")
        raise

# Usage
try:
    result = send_whatsapp_message()
    print(f"Success: {result['message_id']}")
except Exception as e:
    print(f"Error: {e}")`;
  };

  if (loading) {
    return (
      <DashboardLayout title="API Management" subtitle="Professional WhatsApp Business API Documentation">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="API Management" 
      subtitle="Professional WhatsApp Business API - Send messages programmatically with enterprise-grade reliability"
    >
      <div className="space-y-8">
        {/* API Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Status</p>
                  <p className="text-lg font-semibold text-gray-900">Online</p>
                  <p className="text-xs text-gray-500">99.9% uptime</p>
                </div>
                <Activity className="h-5 w-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-lg font-semibold text-gray-900">{templates.length}</p>
                  <p className="text-xs text-gray-500">Active & Approved</p>
                </div>
                <Layers className="h-5 w-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rate Limit</p>
                  <p className="text-lg font-semibold text-gray-900">100/15min</p>
                  <p className="text-xs text-gray-500">Per IP address</p>
                </div>
                <Shield className="h-5 w-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Username</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{currentUser?.username}</p>
                  <p className="text-xs text-gray-500">API Credentials</p>
                </div>
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - API Testing */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-200 bg-white">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Terminal className="h-5 w-5 text-gray-600" />
                  API Testing Console
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Test your API endpoints with real templates and see live responses
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Template Selection */}
                <div className="space-y-3">
                  <Label htmlFor="template-select" className="text-sm font-semibold text-gray-700">
                    Select Template *
                  </Label>
                  <Select
                    className="h-10 border border-gray-300"
                    value={selectedTemplate}
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      analyzeTemplate(value);
                    }}
                  >
                    <SelectValue placeholder="Choose a template to test" />
                    {templates.map((template) => {
                      const formattedName = template.name
                        .replace(/_(UTILITY|MARKETING|AUTHENTICATION)$/,'')
                        .replace(/_/g,' ');
                      return (
                        <SelectItem key={template.id} value={template.name}>
                          {`${formattedName} — ${template.category}`}
                        </SelectItem>
                      );
                    })}
                  </Select>
                </div>

                {/* Template Analysis */}
                {templateAnalysis && (
                  <Alert className="bg-gray-50 border border-gray-200">
                    <Info className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-gray-700">
                      <div className="space-y-2">
                        <p className="font-medium">Template Requirements:</p>
                        <div className="flex flex-wrap gap-2">
                          {templateAnalysis.has_header && (
                            <Badge variant="outline" className="text-gray-700 border-gray-300">
                              Header: {templateAnalysis.header_type}
                            </Badge>
                          )}
                          {templateAnalysis.variable_count > 0 && (
                            <Badge variant="outline" className="text-gray-700 border-gray-300">
                              Variables: {templateAnalysis.variable_count}
                            </Badge>
                          )}
                          {templateAnalysis.has_buttons && (
                            <Badge variant="outline" className="text-gray-700 border-gray-300">
                              Buttons: {templateAnalysis.button_types.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test Form */}
                {selectedTemplate && templateAnalysis && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Test Parameters
                    </h3>
                    
                    {/* Recipient Number */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient" className="text-sm font-semibold text-gray-700">
                        Recipient Phone Number *
                      </Label>
                      <div className="relative">
                        <Input
                          id="recipient"
                          placeholder="1234567890"
                          value={testData.recipient_number}
                          onChange={(e) => {
                            // Remove + if present
                            const cleaned = e.target.value.replace(/\+/g, '');
                            setTestData(prev => ({ ...prev, recipient_number: cleaned }));
                          }}
                          className="h-10 border border-gray-300 pl-4"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <Smartphone className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">Enter phone number without + symbol (e.g. 919398424270)</p>
                    </div>

                    {/* Variables */}
                    {templateAnalysis.optional_params.filter(p => p.name.startsWith('var')).map((param) => (
                      <div key={param.name} className="space-y-2">
                        <Label htmlFor={param.name} className="text-sm font-semibold text-gray-700">
                          {param.name}
                          {param.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={param.name}
                          placeholder={param.example}
                          value={testData.variables[param.name] || ''}
                          onChange={(e) => setTestData(prev => ({
                            ...prev,
                            variables: { ...prev.variables, [param.name]: e.target.value }
                          }))}
                          className="h-10 border border-gray-300"
                        />
                        <p className="text-xs text-gray-500">{param.description}</p>
                      </div>
                    ))}

                    {/* Button Parameters */}
                    {templateAnalysis.has_buttons && templateAnalysis.button_types.map((button) => (
                      button.type === 'URL' && (
                        <div key={`button_${button.index}`} className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MousePointer className="h-4 w-4" />
                            Button URL for "{button.text}" *
                          </Label>
                          <Input
                            placeholder="https://example.com"
                            value={testData.buttons[`button_${button.index}_url`] || ''}
                            onChange={(e) => setTestData(prev => ({
                              ...prev,
                              buttons: { ...prev.buttons, [`button_${button.index}_url`]: e.target.value }
                            }))}
                            className="h-10 border border-gray-300"
                          />
                          <p className="text-xs text-gray-500">Dynamic URL for the "{button.text}" button</p>
                        </div>
                      )
                    ))}

                    <Button 
                      onClick={testAPI} 
                      disabled={testLoading || !testData.recipient_number}
                      className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white"
                    >
                      {testLoading ? (
                        <>
                          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                          Testing API...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-5 w-5 mr-2" />
                          Test API Call
                        </>
                      )}
                    </Button>

                    {/* Response */}
                    {testResponse && (
                      <div className="mt-6 space-y-3">
                        <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          API Response
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            variant={testResponse.status === 200 ? 'default' : 'destructive'}
                            className={testResponse.status === 200 ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}
                          >
                            HTTP {testResponse.status}
                          </Badge>
                          {testResponse.status === 200 && (
                            <CheckCircle className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        
                        <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded text-sm overflow-x-auto">
                          {JSON.stringify(testResponse.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="space-y-6">
            <Card className="border border-gray-200 sticky top-6">
              <CardHeader className="border-b border-gray-200 bg-white">
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                  <Eye className="h-5 w-5 text-gray-600" />
                  Message Preview
                </CardTitle>
                <CardDescription className="text-gray-600">
                  See how your message will appear
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {messagePreview ? (
                  <div className="space-y-4">
                    {/* WhatsApp-style Message Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">Prime SMS</p>
                          <p className="text-xs text-gray-600">to {messagePreview.recipient}</p>
                        </div>
                      </div>
                      
                      {messagePreview.header && (
                        <div className="mb-3">
                          <div className="bg-white rounded p-3 border border-gray-200">
                            <p className="font-medium text-gray-800 text-sm">{messagePreview.header}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-white rounded p-3 border border-gray-200 mb-3">
                        <p className="text-gray-800 text-sm whitespace-pre-wrap">{messagePreview.body}</p>
                      </div>
                      
                      {messagePreview.buttons && messagePreview.buttons.length > 0 && (
                        <div className="space-y-2">
                          {messagePreview.buttons.map((button, index) => (
                            <div key={index} className="bg-white border border-gray-300 rounded p-2 text-center">
                              <span className="text-gray-700 font-medium text-sm">{button.text}</span>
                              {button.type === 'URL' && (
                                <ExternalLink className="h-3 w-3 inline ml-1 text-gray-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Select a template to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Code Examples */}
            {selectedTemplate && templateAnalysis && (
              <Card className="border border-gray-200">
                <CardHeader className="border-b border-gray-200 bg-white">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                    <Code2 className="h-5 w-5 text-gray-600" />
                    Code Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <Tabs defaultValue="curl" className="space-y-3">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="js">JS</TabsTrigger>
                      <TabsTrigger value="py">Python</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl">
                      <div className="relative">
                        <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded text-xs overflow-x-auto max-h-40">
                          {generateCurlCommand()}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generateCurlCommand(), 'curl')}
                        >
                          {copySuccess === 'curl' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="js">
                      <div className="relative">
                        <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded text-xs overflow-x-auto max-h-40">
                          {generateJavaScriptCode().split('\n').slice(0, 10).join('\n')}...
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generateJavaScriptCode(), 'js')}
                        >
                          {copySuccess === 'js' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="py">
                      <div className="relative">
                        <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-3 rounded text-xs overflow-x-auto max-h-40">
                          {generatePythonCode().split('\n').slice(0, 10).join('\n')}...
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generatePythonCode(), 'py')}
                        >
                          {copySuccess === 'py' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* API Documentation */}
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
              <Book className="h-6 w-6 text-gray-600" />
              API Documentation
            </CardTitle>
            <CardDescription className="text-gray-600">
              Complete WhatsApp Business API reference and examples
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <TabsTrigger value="errors">Error Codes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Start Guide</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Get Your Credentials</p>
                          <p className="text-sm text-gray-600">Username: <code className="bg-gray-100 px-2 py-1 rounded">{currentUser?.username}</code></p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Choose Template</p>
                          <p className="text-sm text-gray-600">Select from your approved WhatsApp templates</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-600">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Send Request</p>
                          <p className="text-sm text-gray-600">POST to /api/send with your data</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Key Features</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Dynamic button URL support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Template variable substitution</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Real-time delivery tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">99.9% uptime guarantee</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Rate limiting protection</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <Send className="h-5 w-5 text-gray-600" />
                        Send Message
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                        <code className="text-gray-800 font-mono">POST /api/send</code>
                      </div>
                      <p className="text-sm text-gray-600">
                        Send templated WhatsApp messages with dynamic content and button URLs.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium">Required Parameters:</h4>
                        <ul className="text-sm space-y-1 text-gray-600 pl-4">
                          <li>• <code>username</code> - Your Prime SMS username</li>
                          <li>• <code>templatename</code> - Active template name</li>
                          <li>• <code>recipient_number</code> - Phone without + (e.g. 919398424270)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                        <FileText className="h-5 w-5 text-gray-600" />
                        Template Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded">
                        <code className="text-gray-800 font-mono">GET /api/send/template-info/:username/:templatename</code>
                      </div>
                      <p className="text-sm text-gray-600">
                        Analyze template requirements including variables, buttons, and parameters.
                      </p>
                      <div className="space-y-2">
                        <h4 className="font-medium">Example:</h4>
                        <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                          GET https://primesms.app/api/send/template-info/{currentUser?.username}/welcome_message
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="examples" className="space-y-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Complete Code Examples</h3>
                  
                  <Tabs defaultValue="curl-full" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="curl-full">cURL</TabsTrigger>
                      <TabsTrigger value="javascript-full">JavaScript</TabsTrigger>
                      <TabsTrigger value="python-full">Python</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl-full">
                      {selectedTemplate && templateAnalysis ? (
                        <div className="relative">
                          <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded overflow-x-auto text-sm">
                            {generateCurlCommand()}
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(generateCurlCommand(), 'curl-full')}
                          >
                            {copySuccess === 'curl-full' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Select a template above to generate customized code examples.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="javascript-full">
                      {selectedTemplate && templateAnalysis ? (
                        <div className="relative">
                          <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded overflow-x-auto text-sm">
                            {generateJavaScriptCode()}
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(generateJavaScriptCode(), 'js-full')}
                          >
                            {copySuccess === 'js-full' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Select a template above to generate customized code examples.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>

                    <TabsContent value="python-full">
                      {selectedTemplate && templateAnalysis ? (
                        <div className="relative">
                          <pre className="bg-gray-50 border border-gray-200 text-gray-800 p-4 rounded overflow-x-auto text-sm">
                            {generatePythonCode()}
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(generatePythonCode(), 'py-full')}
                          >
                            {copySuccess === 'py-full' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Select a template above to generate customized code examples.
                          </AlertDescription>
                        </Alert>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="errors" className="space-y-6">
                <h3 className="text-lg font-semibold">HTTP Response Codes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gray-100 text-gray-800">200 Success</Badge>
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600">Message sent successfully to WhatsApp</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-red-100 text-red-800">400 Bad Request</Badge>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      </div>
                      <p className="text-sm text-gray-600">Missing or invalid parameters</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gray-100 text-gray-800">401 Unauthorized</Badge>
                        <Shield className="h-4 w-4 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600">Invalid username credentials</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gray-100 text-gray-800">429 Rate Limited</Badge>
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-600">Too many requests (100/15min limit exceeded)</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}