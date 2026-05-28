import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Outlet />
    </div>
  );
}
