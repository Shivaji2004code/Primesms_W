import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, LogOut, Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentUser: User;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function AdminLayout({ children, currentUser }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

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

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin/dashboard' }
    ];

    if (path.includes('/users/') && path.includes('/details')) {
      breadcrumbs.push(
        { label: 'Users', href: '/admin/dashboard' },
        { label: 'User Details' }
      );
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/admin/dashboard" 
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Primes SMS</span>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">Admin Panel</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 1 && (
            <nav className="mt-4 flex items-center space-x-2 text-sm">
              <Home className="h-4 w-4 text-gray-400" />
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  {crumb.href ? (
                    <Link 
                      to={crumb.href}
                      className="text-blue-600 hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}