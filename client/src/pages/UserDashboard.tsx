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
  Zap,
  Target,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { EnhancedMetricCard } from '../components/ui/enhanced-metric-card';
import { GlassCard } from '../components/ui/glass-card';
import { FadeIn, SlideUp, HoverScale, StaggerContainer } from '../components/ui/motion-components';
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
      gradient: {
        from: 'from-blue-500',
        to: 'to-cyan-600'
      },
      change: {
        value: '+0%',
        type: 'neutral' as const
      }
    },
    {
      title: 'Messages Sent',
      value: '149',
      description: 'This month',
      icon: Send,
      gradient: {
        from: 'from-emerald-500',
        to: 'to-teal-600'
      },
      change: {
        value: '+12%',
        type: 'positive' as const
      }
    },
    {
      title: 'Active Templates',
      value: '5',
      description: 'Ready to use',
      icon: FileText,
      gradient: {
        from: 'from-purple-500',
        to: 'to-indigo-600'
      },
      change: {
        value: '+2',
        type: 'positive' as const
      }
    },
    {
      title: 'Success Rate',
      value: '94.6%',
      description: 'Message delivery',
      icon: CheckCircle2,
      gradient: {
        from: 'from-emerald-500',
        to: 'to-green-600'
      },
      change: {
        value: '+2.1%',
        type: 'positive' as const
      }
    }
  ];

  const quickActions = [
    {
      title: 'Send Bulk Messages',
      description: 'Start a new campaign',
      icon: Send,
      path: '/user/whatsapp-bulk',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Customize Message',
      description: 'Personalized bulk messaging',
      icon: Settings,
      path: '/user/customize-message',
      gradient: 'from-orange-500 to-red-600',
      iconBg: 'from-orange-400 to-red-500'
    },
    {
      title: 'Create Template',
      description: 'Design a new message',
      icon: FileText,
      path: '/user/templates',
      gradient: 'from-blue-500 to-indigo-600',
      iconBg: 'from-blue-400 to-indigo-500'
    },
    {
      title: 'View Reports',
      description: 'Campaign analytics',
      icon: BarChart3,
      path: '/user/manage-reports',
      gradient: 'from-purple-500 to-pink-600',
      iconBg: 'from-purple-400 to-pink-500'
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
      {/* Welcome Band */}
      <FadeIn className="mb-8">
        <GlassCard variant="gradient-border" className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50" />
          
          {/* Content */}
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/50">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-emerald-600 font-medium">Ready to grow your business</p>
                  </div>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
                  Your WhatsApp Business platform is ready to help you reach your customers effectively.
                </p>
              </div>
              
              {/* Inline Stats */}
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="text-center">
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Today</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-600 tracking-tight">149</div>
                  <div className="text-sm text-gray-600 font-medium">Messages Sent</div>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div className="text-center">
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-teal-600" />
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-teal-600 tracking-tight">94.6%</div>
                  <div className="text-sm text-gray-600 font-medium">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </FadeIn>

      {/* KPI Cards */}
      <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metrics.map((metric, index) => (
          <EnhancedMetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            gradient={metric.gradient}
            change={metric.change}
            delay={index * 0.1}
          />
        ))}
      </StaggerContainer>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <SlideUp delay={0.2} className="lg:col-span-2">
          <GlassCard variant="glass" className="relative overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Quick Actions</h2>
                  <p className="text-sm text-gray-600">Jump into the most common tasks</p>
                </div>
              </div>
            </div>
            
            {/* Actions Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <FadeIn key={action.path} delay={0.3 + (index * 0.1)}>
                      <HoverScale scale={1.02}>
                        <button
                          onClick={() => navigate(action.path)}
                          className={`w-full p-6 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden bg-gradient-to-br ${action.gradient} hover:shadow-2xl hover:shadow-emerald-500/20 ring-1 ring-white/20`}
                        >
                          {/* Background glow */}
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Content */}
                          <div className="relative flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${action.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white text-lg tracking-tight">{action.title}</h3>
                              <p className="text-white/80 text-sm font-medium mt-1">{action.description}</p>
                            </div>
                          </div>
                        </button>
                      </HoverScale>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </SlideUp>

        {/* Recent Activity */}
        <SlideUp delay={0.4} className="lg:col-span-1">
          <GlassCard variant="glass" className="relative overflow-hidden h-fit">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recent Activity</h2>
                  <p className="text-sm text-gray-600">Latest campaign updates</p>
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="p-6">
              <div className="relative">
                {/* Timeline rail */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-200 via-emerald-300 to-transparent" />
                
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <FadeIn key={activity.id} delay={0.5 + (index * 0.1)}>
                      <div className="relative flex items-start space-x-4">
                        {/* Timeline dot */}
                        <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 ${
                          index === 0 
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse' 
                            : 'bg-gradient-to-br from-gray-300 to-gray-400'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white/70 transition-all duration-300">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{activity.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed mb-2">{activity.description}</p>
                          <p className="text-xs text-emerald-600 font-medium">{activity.time}</p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </SlideUp>
      </div>

      {/* Performance Overview */}
      <SlideUp delay={0.6} className="mt-8">
        <GlassCard variant="glass" className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-white to-indigo-50/50" />
          
          {/* Content */}
          <div className="relative">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Performance Overview</h2>
                  <p className="text-sm text-gray-600">Your messaging performance this month</p>
                </div>
              </div>
            </div>
            
            {/* Performance Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FadeIn delay={0.7}>
                  <HoverScale scale={1.02}>
                    <GlassCard variant="gradient-border" className="relative overflow-hidden group">
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 group-hover:from-blue-500/10 group-hover:to-indigo-600/10 transition-all duration-300" />
                      
                      <div className="relative p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2 tracking-tight">149</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Total Messages</div>
                        <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                          +12% from last month
                        </div>
                      </div>
                    </GlassCard>
                  </HoverScale>
                </FadeIn>
                
                <FadeIn delay={0.8}>
                  <HoverScale scale={1.02}>
                    <GlassCard variant="gradient-border" className="relative overflow-hidden group">
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-600/5 group-hover:from-emerald-500/10 group-hover:to-green-600/10 transition-all duration-300" />
                      
                      <div className="relative p-6 text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2 tracking-tight">94.6%</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Delivery Rate</div>
                        <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                          +2.1% improvement
                        </div>
                      </div>
                    </GlassCard>
                  </HoverScale>
                </FadeIn>
                
                <FadeIn delay={0.9}>
                  <HoverScale scale={1.02}>
                    <GlassCard variant="gradient-border" className="relative overflow-hidden group">
                      {/* Background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 group-hover:from-purple-500/10 group-hover:to-pink-600/10 transition-all duration-300" />
                      
                      <div className="relative p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2 tracking-tight">5</div>
                        <div className="text-sm font-medium text-gray-600 mb-2">Active Templates</div>
                        <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg">
                          +2 new templates
                        </div>
                      </div>
                    </GlassCard>
                  </HoverScale>
                </FadeIn>
              </div>
            </div>
          </div>
        </GlassCard>
      </SlideUp>
    </DashboardLayout>
  );
}