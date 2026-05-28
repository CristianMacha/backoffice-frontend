import { useAuthStore } from '@/stores/auth.store';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold">Welcome back!</h1>
      <p className="text-muted-foreground">
        Logged in as <span className="text-foreground font-medium">{user?.email}</span>
        {' '}with role <span className="text-foreground font-medium capitalize">{user?.role}</span>.
      </p>
    </div>
  );
}
