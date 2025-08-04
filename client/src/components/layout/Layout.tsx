import { type ReactNode } from 'react';
import Header from './Header';
import { NotificationSystem } from '../ui/notification-system';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Prime SMS...</p>
        </div>
      </div>
    );
  }

  // Don't show header for non-authenticated users or on auth pages
  const showHeader = user && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup') && window.location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main className={showHeader ? "pt-0" : ""}>
        {children}
      </main>
      
      {/* Global Notification System */}
      <NotificationSystem />
      
      {/* Footer */}
      {showHeader && (
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Prime SMS</p>
                  <p className="text-xs text-gray-500">WhatsApp Business Platform</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  © 2025 Prime SMS. All rights reserved.
                </p>
                <p className="text-xs text-gray-400">
                  Powered by WhatsApp Business API
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}