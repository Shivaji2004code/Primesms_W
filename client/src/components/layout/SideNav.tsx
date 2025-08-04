import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Send, 
  LifeBuoy,
  MessageSquare,
  Settings,
  BarChart3,
  Code
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

export default function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  
  const userNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/user/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'WhatsApp Bulk',
      path: '/user/whatsapp-bulk',
      icon: Send
    },
    {
      name: 'API Management',
      path: '/user/api-management',
      icon: Code
    },
    {
      name: 'Customize Message',
      path: '/user/customize-message',
      icon: Settings
    },
    {
      name: 'Templates',
      path: '/user/templates',
      icon: FileText
    },
    {
      name: 'Manage Reports',
      path: '/user/manage-reports',
      icon: BarChart3
    },
    {
      name: 'Support',
      path: '/user/support',
      icon: LifeBuoy
    }
  ];

  const adminNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: FileText
    },
    {
      name: 'Support',
      path: '/admin/support',
      icon: LifeBuoy
    }
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  return (
    <div className="hidden md:flex md:w-64 bg-white border-r border-gray-200 min-h-screen flex-col fixed left-0 top-0 z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Prime SMS</h1>
            <p className="text-xs text-gray-500 -mt-1">WhatsApp Business</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group",
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-colors flex-shrink-0",
                  active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  active ? "text-blue-700" : "text-gray-900 group-hover:text-gray-900"
                )}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Signed in as {user?.name}</p>
            <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}