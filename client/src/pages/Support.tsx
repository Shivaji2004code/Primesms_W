import React from 'react';
import { 
  LifeBuoy, 
  MessageSquare, 
  FileText, 
  Mail, 
  Phone, 
  Globe,
  BookOpen,
  Video,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Support() {
  const supportCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using Prime SMS WhatsApp Business',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      items: [
        'How to create your first template',
        'Setting up WhatsApp Business API',
        'Understanding message limits',
        'Best practices for messaging'
      ]
    },
    {
      title: 'Templates & Messaging',
      description: 'Everything about creating and managing templates',
      icon: FileText,
      color: 'from-green-500 to-green-600',
      items: [
        'Template approval process',
        'Dynamic variables usage',
        'Media templates guide',
        'Template optimization tips'
      ]
    },
    {
      title: 'Bulk Messaging',
      description: 'Master bulk messaging campaigns',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      items: [
        'Uploading recipient lists',
        'Campaign scheduling',
        'Delivery tracking',
        'Performance analytics'
      ]
    },
    {
      title: 'Troubleshooting',
      description: 'Common issues and their solutions',
      icon: HelpCircle,
      color: 'from-orange-500 to-orange-600',
      items: [
        'Message delivery issues',
        'Template rejection reasons',
        'API connection problems',
        'Account verification'
      ]
    }
  ];

  const contactMethods = [
    {
      title: 'Email Support',
      description: 'Get detailed help via email',
      icon: Mail,
      contact: 'support@primesms.com',
      response: 'Within 24 hours',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: Phone,
      contact: '+1 (555) 123-4567',
      response: 'Mon-Fri, 9AM-6PM EST',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Live Chat',
      description: 'Instant help when you need it',
      icon: MessageSquare,
      contact: 'Available on dashboard',
      response: 'Real-time support',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const quickLinks = [
    {
      title: 'Documentation',
      description: 'Complete API documentation',
      icon: FileText,
      link: '#',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      link: '#',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions',
      icon: HelpCircle,
      link: '#',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Status Page',
      description: 'Service status and updates',
      icon: CheckCircle2,
      link: '#',
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <DashboardLayout
      title="Support Center"
      subtitle="Get help, documentation, and support for your Prime SMS account"
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <LifeBuoy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</h1>
              <p className="text-gray-600">
                Find answers to common questions, learn best practices, and get in touch with our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Card 
                  key={index}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${link.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support Categories */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Help Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="mt-4 w-full"
                      onClick={() => window.open('#', '_blank')}
                    >
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Contact Methods */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${method.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{method.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">{method.contact}</p>
                      <p className="text-xs text-gray-500">{method.response}</p>
                    </div>
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => {
                        if (method.title === 'Email Support') {
                          window.location.href = 'mailto:support@primesms.com';
                        } else if (method.title === 'Phone Support') {
                          window.location.href = 'tel:+15551234567';
                        }
                      }}
                    >
                      Contact Now
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How do I create my first WhatsApp template?
                  </h3>
                  <p className="text-gray-600">
                    Navigate to Templates in the sidebar, click "Create Template", and follow the step-by-step guide. 
                    Make sure your template follows WhatsApp's guidelines for approval.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What are the message sending limits?
                  </h3>
                  <p className="text-gray-600">
                    WhatsApp Business API has a limit of 1,000 messages per day per phone number. 
                    Premium accounts can send up to 10,000 messages per day.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    How long does template approval take?
                  </h3>
                  <p className="text-gray-600">
                    Template approval typically takes 24-48 hours. Marketing templates may take longer 
                    due to additional review requirements.
                  </p>
                </div>
                
                <div className="pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Can I use dynamic variables in my templates?
                  </h3>
                  <p className="text-gray-600">
                    Yes! You can use variables like {'{'}{'{{1}}'}{'},'} {'{'}{'{{2}}'}{'},'} etc. in your templates. 
                    These will be replaced with actual values when sending messages.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 