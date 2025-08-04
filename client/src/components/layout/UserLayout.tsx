import { type ReactNode } from 'react';
import Navigation from './Navigation';
import { SessionTimeoutDialog } from '../SessionTimeoutDialog';
import { useAuth } from '../../hooks/useAuth';
import { useSession } from '../../hooks/useSession';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  const { user, logout } = useAuth();
  const { showWarning, warningTimeLeft, dismissWarning } = useSession(logout);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onLogout={logout} />
      
      {/* Main Content Area with fixed sidebar spacing */}
      <div className="lg:ml-64 transition-all duration-200">
        <main className="pt-16 min-h-screen">
          {children}
        </main>
      </div>

      <SessionTimeoutDialog
        open={showWarning}
        timeLeft={warningTimeLeft}
        onExtend={dismissWarning}
        onLogout={logout}
      />
    </div>
  );
}