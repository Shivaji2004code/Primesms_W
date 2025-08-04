import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PrivateRoute } from './PrivateRoute';

interface UserRouteProps {
  children: ReactNode;
}

export function UserRoute({ children }: UserRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <PrivateRoute>
      {(() => {
        if (isLoading) return null;
        
        if (!isAuthenticated || !user) {
          return <Navigate to="/login" replace />;
        }

        // Redirect admin users to admin dashboard
        if (user.role === 'admin') {
          return <Navigate to="/admin/dashboard" replace />;
        }

        // Return children directly since they already use DashboardLayout
        return children;
      })()}
    </PrivateRoute>
  );
}