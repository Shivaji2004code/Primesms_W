import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Target, 
  FileText, 
  BarChart3, 
  Code, 
  Bot, 
  LogOut, 
  CreditCard,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'coming_soon' | 'access';
  gradient: string;
  iconBg: string;
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const user: User = JSON.parse(userData);
    setCurrentUser(user);
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('user');
    navigate('/login');
  };

  const features: FeatureCard[] = [
    {
      id: 'quick-send',
      title: 'Quick Send Campaign',
      description: 'Send bulk messages to multiple contacts instantly with our easy-to-use interface',
      icon: <Send className="h-8 w-8" />,
      status: 'coming_soon',
      gradient: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'customize-campaign',
      title: 'Customize Campaign',
      description: 'Create personalized campaigns with spreadsheet data and custom variables',
      icon: <Target className="h-8 w-8" />,
      status: 'coming_soon',
      gradient: 'from-purple-500 to-pink-500',
      iconBg: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'manage-templates',
      title: 'Manage Templates',
      description: 'Create and manage WhatsApp message templates for consistent messaging',
      icon: <FileText className="h-8 w-8" />,
      status: 'access',
      gradient: 'from-green-500 to-teal-500',
      iconBg: 'bg-green-100 text-green-600'
    },
    {
      id: 'manage-reports',
      title: 'Manage Reports',
      description: 'View detailed analytics and delivery reports for all your campaigns',
      icon: <BarChart3 className="h-8 w-8" />,
      status: 'coming_soon',
      gradient: 'from-orange-500 to-red-500',
      iconBg: 'bg-orange-100 text-orange-600'
    },
    {
      id: 'manage-api',
      title: 'Manage API',
      description: 'Generate API keys and view comprehensive documentation for developers',
      icon: <Code className="h-8 w-8" />,
      status: 'coming_soon',
      gradient: 'from-indigo-500 to-blue-600',
      iconBg: 'bg-indigo-100 text-indigo-600'
    },
    {
      id: 'chatbot',
      title: 'Chatbot',
      description: 'AI assistant for feature requests, support, and answering your questions',
      icon: <Bot className="h-8 w-8" />,
      status: 'coming_soon',
      gradient: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-100 text-pink-600'
    }
  ];

  const handleFeatureClick = (feature: FeatureCard) => {
    if (feature.status === 'coming_soon') {
      alert(`${feature.title} is coming soon! We're working hard to bring you this feature.`);
    } else {
      // Handle access to available features
      switch (feature.id) {
        case 'manage-templates':
          navigate('/user/templates');
          break;
        default:
          console.log(`Accessing ${feature.title}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Primes SMS</span>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Credits: {currentUser?.creditBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {currentUser?.name}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser?.name}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Choose from the powerful features below to manage your WhatsApp campaigns
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card 
              key={feature.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-0 shadow-lg overflow-hidden"
              onClick={() => handleFeatureClick(feature)}
            >
              <div className={`h-2 bg-gradient-to-r ${feature.gradient}`} />
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  {feature.status === 'coming_soon' && (
                    <div className="flex items-center space-x-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                      <Sparkles className="h-3 w-3" />
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
                
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-gray-600 text-base leading-relaxed mb-4">
                  {feature.description}
                </CardDescription>
                
                <div className="flex items-center justify-between">
                  <Button 
                    variant={feature.status === 'coming_soon' ? 'outline' : 'default'}
                    className="group-hover:shadow-md transition-shadow"
                    size="sm"
                  >
                    {feature.status === 'coming_soon' ? 'Notify Me' : 'Access'}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info Section */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">🚀 Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-4">
                New to Primes SMS? Check out our quick start guide to begin sending your first WhatsApp campaigns.
              </p>
              <Button variant="secondary" size="sm">
                View Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">💡 Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-100 mb-4">
                Our support team is here to help you succeed. Get assistance with setup, campaigns, and more.
              </p>
              <Button variant="secondary" size="sm">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{currentUser?.creditBalance.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Available Credits</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Messages Sent</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Active Campaigns</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-600">Templates Created</div>
          </div>
        </div>
      </div>
    </div>
  );
}