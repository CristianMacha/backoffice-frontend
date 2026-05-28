import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';
import type { Permission } from '@/lib/permissions';

type Props = {
  children: React.ReactNode;
  permission?: Permission;
};

export function ProtectedRoute({ children, permission }: Props) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (permission && !user.permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
