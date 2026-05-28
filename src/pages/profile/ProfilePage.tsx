import { useAuthStore } from '@/stores/auth.store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="grid gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm">Your account information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <Separator />
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs">Role</p>
            <p className="text-sm font-medium capitalize">{user.role}</p>
          </div>
          <Separator />
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs">Status</p>
            <Badge
              variant={
                user.status === 'active'
                  ? 'default'
                  : user.status === 'banned'
                    ? 'destructive'
                    : 'secondary'
              }
              className="w-fit"
            >
              {user.status}
            </Badge>
          </div>
          <Separator />
          <div className="grid gap-1">
            <p className="text-muted-foreground text-xs">
              Permissions ({user.permissions.length})
            </p>
            <div className="flex flex-wrap gap-1 pt-1">
              {user.permissions.map((p) => (
                <Badge key={p} variant="secondary" className="font-mono text-xs">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
