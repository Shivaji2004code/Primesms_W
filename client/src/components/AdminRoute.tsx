import ProtectedRoute from './ProtectedRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  return (
    <ProtectedRoute requireAuth={true} requireRole="admin">
      {children}
    </ProtectedRoute>
  );
}