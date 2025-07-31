import ProtectedRoute from './ProtectedRoute';

interface UserRouteProps {
  children: React.ReactNode;
}

export default function UserRoute({ children }: UserRouteProps) {
  return (
    <ProtectedRoute requireAuth={true} requireRole="user">
      {children}
    </ProtectedRoute>
  );
}