import { useNavigate } from 'react-router-dom';
import { 
  User, 
  LogOut, 
  ChevronDown,
  CreditCard
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  // Get page title from current path if not provided
  const getPageTitle = () => {
    if (title) return title;
    
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/templates')) return 'Templates';
    if (path.includes('/whatsapp-bulk')) return 'WhatsApp Bulk Messaging';
    if (path.includes('/support')) return 'Support';
    if (path.includes('/users')) return 'User Management';
    return 'Dashboard';
  };

  // Get page subtitle
  const getPageSubtitle = () => {
    if (subtitle) return subtitle;
    
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'Here\'s what\'s happening with your WhatsApp campaigns today.';
    if (path.includes('/templates')) return 'Create, edit, and manage your message templates.';
    if (path.includes('/whatsapp-bulk')) return 'Send bulk messages to multiple recipients.';
    if (path.includes('/support')) return 'Get help and support for your account.';
    if (path.includes('/users')) return 'Manage user accounts and permissions.';
    return isAdmin ? 'Admin Panel' : 'WhatsApp Business Platform';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-6">
        <div className="flex justify-between items-start">
          {/* Left side - Page Title and Subtitle */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{getPageTitle()}</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {getPageSubtitle()}
            </p>
          </div>

          {/* Right side - User Actions */}
          <div className="flex items-center space-x-4 ml-8">
            {/* User Credits (for users only) */}
            {!isAdmin && (
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  Credits: {user?.creditBalance?.toLocaleString() || '0'}
                </span>
              </div>
            )}


            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 p-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 capitalize font-medium">{user?.role}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/user/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/billing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}