import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code, 
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
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectItem, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
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

export default function APIManagement() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateAnalysis, setTemplateAnalysis] = useState<TemplateAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState({
    recipient_number: '+1234567890',
    variables: {} as any
  });
  const [testResponse, setTestResponse] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

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
        data.requirements.optional_params.forEach((param: any) => {
          if (param.name.startsWith('var')) {
            variables[param.name] = param.example;
          }
        });
        setTestData(prev => ({ ...prev, variables }));
      }
    } catch (error) {
      console.error('Error analyzing template:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testAPI = async () => {
    if (!currentUser || !selectedTemplate) return;

    setTestLoading(true);
    try {
      const payload: any = {
        username: currentUser.username,
        templatename: selectedTemplate,
        recipient_number: testData.recipient_number,
        ...testData.variables
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
      ...testData.variables
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
      <DashboardLayout title="API Management" subtitle="Manage your WhatsApp API integration">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="API Management" 
      subtitle="Send WhatsApp messages programmatically with our simple API"
    >
      <div className="space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Status</p>
                  <p className="text-lg font-bold text-green-600">Active</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Templates</p>
                  <p className="text-lg font-bold text-gray-900">{templates.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rate Limit</p>
                  <p className="text-lg font-bold text-gray-900">100/15min</p>
                </div>
                <Zap className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Username</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{currentUser?.username}</p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="test-api" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="test-api" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Test API
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="code-examples" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code Examples
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Endpoints
            </TabsTrigger>
          </TabsList>

          {/* Test API Tab */}
          <TabsContent value="test-api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Test Your API
                </CardTitle>
                <CardDescription>
                  Test your WhatsApp message API with real templates and see the response
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-2">
                  <Label htmlFor="template-select">Select Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={(value) => {
                      setSelectedTemplate(value);
                      analyzeTemplate(value);
                    }}
                  >
                    <SelectValue placeholder="Choose a template to test" />
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.name}>
                        {template.name} ({template.category})
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Template Analysis */}
                {templateAnalysis && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>Template Requirements:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {templateAnalysis.has_header && (
                            <li>Header: {templateAnalysis.header_type} type</li>
                          )}
                          {templateAnalysis.variable_count > 0 && (
                            <li>Variables: {templateAnalysis.variable_count} required</li>
                          )}
                          {templateAnalysis.has_buttons && (
                            <li>Buttons: {templateAnalysis.button_types.map(b => b.type).join(', ')}</li>
                          )}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test Form */}
                {selectedTemplate && templateAnalysis && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Form */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Test Parameters</h3>
                      
                      <div>
                        <Label htmlFor="recipient">Recipient Phone Number</Label>
                        <Input
                          id="recipient"
                          placeholder="+1234567890"
                          value={testData.recipient_number}
                          onChange={(e) => setTestData(prev => ({ ...prev, recipient_number: e.target.value }))}
                        />
                      </div>

                      {templateAnalysis.optional_params.map((param) => (
                        <div key={param.name}>
                          <Label htmlFor={param.name}>
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
                          />
                          <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                        </div>
                      ))}

                      <Button 
                        onClick={testAPI} 
                        disabled={testLoading}
                        className="w-full"
                      >
                        {testLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Test API
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Response */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">API Response</h3>
                      
                      {testResponse ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={testResponse.status === 200 ? 'default' : 'destructive'}
                              className={testResponse.status === 200 ? 'bg-green-100 text-green-800' : ''}
                            >
                              HTTP {testResponse.status}
                            </Badge>
                            {testResponse.status === 200 && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          
                          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                            {JSON.stringify(testResponse.data, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
                          <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Click "Test API" to see the response</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>
                  Everything you need to know to integrate with our WhatsApp API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none">
                  <h3>Quick Start</h3>
                  <p>Our WhatsApp API allows you to send templated messages programmatically. Here's what you need:</p>
                  
                  <ol>
                    <li><strong>Your Username:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{currentUser?.username}</code></li>
                    <li><strong>Template Name:</strong> Choose from your active templates</li>
                    <li><strong>Recipient Number:</strong> In international format (+1234567890)</li>
                    <li><strong>Variables:</strong> Any dynamic content for your template</li>
                  </ol>

                  <h3>API Endpoint</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p><strong>URL:</strong> <code>https://primesms.app/api/send</code></p>
                    <p><strong>Method:</strong> <code>POST</code> or <code>GET</code></p>
                    <p><strong>Content-Type:</strong> <code>application/json</code> (for POST)</p>
                  </div>

                  <h3>GET Request Examples</h3>
                  <div className="space-y-3">
                    <h4 className="font-medium">Basic Template Message</h4>
                    <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                      GET https://primesms.app/api/send?username=YOUR_USERNAME&templatename=YOUR_TEMPLATE&recipient_number=919398424270
                    </code>
                    
                    <h4 className="font-medium">With Variables</h4>
                    <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                      GET https://primesms.app/api/send?username=YOUR_USERNAME&templatename=YOUR_TEMPLATE&recipient_number=919398424270&var1=John&var2=12345
                    </code>
                    
                    <h4 className="font-medium">With Header Text</h4>
                    <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                      GET https://primesms.app/api/send?username=YOUR_USERNAME&templatename=YOUR_TEMPLATE&recipient_number=919398424270&header_text=Welcome%20John&var1=OrderID123
                    </code>
                  </div>

                  <h3>Rate Limits</h3>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>100 requests per 15 minutes</strong> per IP address. 
                      Exceeded requests will return HTTP 429.
                    </AlertDescription>
                  </Alert>

                  <h3>Response Codes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge className="bg-green-100 text-green-800">200 Success</Badge>
                      <p className="text-sm">Message sent successfully</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="destructive">400 Bad Request</Badge>
                      <p className="text-sm">Invalid parameters</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="destructive">401 Unauthorized</Badge>
                      <p className="text-sm">Invalid username</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="destructive">404 Not Found</Badge>
                      <p className="text-sm">Template not found</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="code-examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Ready-to-Use Code Examples
                </CardTitle>
                <CardDescription>
                  Copy and paste these examples into your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedTemplate && templateAnalysis ? (
                  <Tabs defaultValue="curl" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                          {generateCurlCommand()}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generateCurlCommand())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="javascript" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
                          {generateJavaScriptCode()}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generateJavaScriptCode())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="python" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-gray-900 text-yellow-400 p-4 rounded-lg overflow-x-auto text-sm">
                          {generatePythonCode()}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(generatePythonCode())}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Select a template in the "Test API" tab to generate customized code examples.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <code className="text-blue-800">POST /api/send</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Send a templated WhatsApp message to a recipient using your active templates.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Required Parameters:</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• <code>username</code> - Your Prime SMS username</li>
                      <li>• <code>templatename</code> - Name of active template</li>
                      <li>• <code>recipient_number</code> - Phone in +1234567890 format</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Template Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <code className="text-green-800">GET /api/send/template-info/:username/:templatename</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analyze a template and get information about required parameters, variables, and buttons.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Example:</h4>
                    <code className="text-xs bg-gray-100 p-2 rounded block">
                      GET https://primesms.app/api/send/template-info/{currentUser?.username}/welcome_message
                    </code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}