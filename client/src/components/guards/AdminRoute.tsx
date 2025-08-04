import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PrivateRoute } from './PrivateRoute';
import { Button } from '@/components/ui/button';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <PrivateRoute>
      {(() => {
        if (isLoading) return null;
        
        if (!isAuthenticated || !user) {
          return <Navigate to="/login" replace />;
        }

        if (user.role !== 'admin') {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6 max-w-md"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto"
                >
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </motion.div>
                
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Access Denied
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    You don't have permission to access this admin area. Please contact your administrator if you believe this is an error.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Navigate to="/user/dashboard" replace />
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Redirecting to user dashboard...
                  </p>
                </div>
              </motion.div>
            </div>
          );
        }

        // Return children directly since they already use DashboardLayout
        return children;
      })()}
    </PrivateRoute>
  );
}