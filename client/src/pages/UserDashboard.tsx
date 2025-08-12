import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  FileText, 
  MessageSquare,
  LifeBuoy,
  CreditCard,
  TrendingUp,
  Settings,
  BarChart3,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Mock data - in real app this would come from API
  const stats = {
    totalMessages: 0, // Will show 0 initially, should be fetched from API
    activeTemplates: 0, // Will show 0 initially, should be fetched from API
    credits: user?.creditBalance || 0
  };

  const quickActions = [
    {
      id: 'send-bulk',
      title: 'Send Bulk Messages',
      description: 'Broadcast messages to multiple contacts',
      icon: Send,
      path: '/user/whatsapp-bulk',
      color: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-500'
    },
    {
      id: 'create-template',
      title: 'Create Template',
      description: 'Design reusable message templates',
      icon: FileText,
      path: '/user/templates',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      iconBg: 'bg-emerald-500'
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Analyze your campaign performance',
      icon: BarChart3,
      path: '/user/manage-reports',
      color: 'bg-purple-600 hover:bg-purple-700',
      iconBg: 'bg-purple-500'
    },
    {
      id: 'customize',
      title: 'Customize Messages',
      description: 'Personalize your messaging campaigns',
      icon: Settings,
      path: '/user/customize-message',
      color: 'bg-orange-600 hover:bg-orange-700',
      iconBg: 'bg-orange-500'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Dashboard accessed',
      time: 'Just now',
      status: 'success'
    },
    {
      id: 2,
      action: 'Account created',
      time: 'Recently',
      status: 'success'
    }
  ];

  return (
    <DashboardLayout 
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name}! Here's your WhatsApp Business overview.`}
    >
      {/* Header Stats Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left side - Welcome */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name}!
                </h1>
                <p className="text-gray-600">{formatDate(currentTime)} • {formatTime(currentTime)}</p>
              </div>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Ready to connect with your customers through WhatsApp Business messaging.
            </p>
          </div>

          {/* Right side - Key metrics */}
          <div className="flex gap-6">
            <div className="text-center px-6 py-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.credits.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Available Credits</div>
            </div>
            <div className="text-center px-6 py-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalMessages}</div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
            <div className="text-center px-6 py-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeTemplates}</div>
              <div className="text-sm text-gray-600">Active Templates</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content - Quick Actions */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                  <p className="text-gray-600 mt-1">Get started with common tasks</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/user/whatsapp-bulk')}
                  className="hidden sm:flex"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => navigate(action.path)}
                      className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left bg-white hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${action.iconBg} rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {action.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Account Overview</h2>
                  <p className="text-gray-600 mt-1">Your account status and key metrics</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/user/manage-reports')}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  View Details
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mb-2">{stats.credits.toLocaleString()}</div>
                  <div className="text-blue-700 font-medium mb-1">Available Credits</div>
                  <div className="text-blue-600 text-xs">Ready to use</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-900 mb-2">{stats.totalMessages}</div>
                  <div className="text-emerald-700 font-medium mb-1">Messages Sent</div>
                  <div className="text-emerald-600 text-xs">All time</div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900 mb-2">{stats.activeTemplates}</div>
                  <div className="text-purple-700 font-medium mb-1">Active Templates</div>
                  <div className="text-purple-600 text-xs">Ready to use</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Recent Activity & Support */}
        <div className="xl:col-span-1 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <p className="text-xs text-gray-600">Latest updates</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {activity.status === 'success' ? (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-gray-600 hover:text-gray-900"
                    onClick={() => navigate('/user/manage-reports')}
                  >
                    View All Activity
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-sm text-white">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <LifeBuoy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Need Help?</h3>
                  <p className="text-white/80 text-sm">Get support from our team</p>
                </div>
              </div>
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                Our support team is here to help you get the most out of Prime SMS.
              </p>
              <Button 
                onClick={() => navigate('/user/support')}
                className="w-full bg-white text-gray-900 hover:bg-white/90 font-medium"
              >
                Contact Support
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Credit Balance</span>
                <span className="text-sm font-bold text-gray-900">{stats.credits.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Messages Today</span>
                <span className="text-sm font-bold text-gray-900">0</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/user/profile')}
                >
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}