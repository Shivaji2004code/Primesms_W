import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  FileText, 
  MessageSquare,
  LifeBuoy,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Settings,
  BarChart3,
  Users,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MetricCard } from '../components/ui/metric-card';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const metrics = [
    {
      title: 'Available Credits',
      value: user?.creditBalance?.toLocaleString() || '0',
      description: 'Ready to use for messaging',
      icon: CreditCard,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+0%',
      changeType: 'positive'
    },
    {
      title: 'Messages Sent',
      value: '149',
      description: 'This month',
      icon: Send,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Templates',
      value: '5',
      description: 'Ready to use',
      icon: FileText,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Success Rate',
      value: '94.6%',
      description: 'Message delivery',
      icon: CheckCircle2,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      change: '+2.1%',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    {
      title: 'Send Bulk Messages',
      description: 'Start a new campaign',
      icon: Send,
      path: '/user/whatsapp-bulk',
      color: 'from-green-600 to-green-700',
      hoverColor: 'from-green-700 to-green-800'
    },
    {
      title: 'Customize Message',
      description: 'Personalized bulk messaging',
      icon: Settings,
      path: '/user/customize-message',
      color: 'from-orange-600 to-orange-700',
      hoverColor: 'from-orange-700 to-orange-800'
    },
    {
      title: 'Create Template',
      description: 'Design a new message',
      icon: FileText,
      path: '/user/templates',
      color: 'from-blue-600 to-blue-700',
      hoverColor: 'from-blue-700 to-blue-800'
    },
    {
      title: 'View Reports',
      description: 'Campaign analytics',
      icon: BarChart3,
      path: '/user/manage-reports',
      color: 'from-indigo-600 to-indigo-700',
      hoverColor: 'from-indigo-700 to-indigo-800'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'message_sent',
      title: 'Bulk campaign completed',
      description: '149 messages sent successfully',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'template_created',
      title: 'New template approved',
      description: 'simple_offer template is now active',
      time: '1 day ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'campaign_started',
      title: 'Campaign launched',
      description: 'Custom campaign with 50 recipients',
      time: '2 days ago',
      status: 'success'
    }
  ];

  return (
    <DashboardLayout 
      title="Dashboard"
      subtitle="Here's what's happening with your WhatsApp campaigns today."
    >
      {/* Welcome Message */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600">
                Your WhatsApp Business platform is ready to help you reach your customers effectively.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">149</div>
                <div className="text-sm text-gray-500">Messages Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">94.6%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-600">
                Jump into the most common tasks to save time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button 
                      key={action.path}
                      size="lg"
                      className={`justify-start bg-gradient-to-r ${action.color} hover:${action.hoverColor} text-white h-16 group`}
                      onClick={() => navigate(action.path)}
                    >
                      <Icon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-xs opacity-90">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-gray-600">
                Latest updates from your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="mt-8">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Performance Overview
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your messaging performance this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-3xl font-bold text-indigo-600 mb-2">149</div>
                <div className="text-sm text-gray-600">Total Messages</div>
                <div className="text-xs text-green-600 mt-1">+12% from last month</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-3xl font-bold text-green-600 mb-2">94.6%</div>
                <div className="text-sm text-gray-600">Delivery Rate</div>
                <div className="text-xs text-green-600 mt-1">+2.1% improvement</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-indigo-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
                <div className="text-sm text-gray-600">Active Templates</div>
                <div className="text-xs text-green-600 mt-1">+2 new templates</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}