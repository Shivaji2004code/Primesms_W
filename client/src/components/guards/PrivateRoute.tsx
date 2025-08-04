import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function PrivateRoute({ children, requireAuth = true }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </motion.div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
        </motion.div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authentication is not required but user is authenticated, redirect to dashboard
  if (!requireAuth && isAuthenticated && user) {
    const dashboardPath = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}