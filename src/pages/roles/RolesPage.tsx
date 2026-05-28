import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { api } from '@/lib/axios';
import type { ApiResponse, PermissionResponseDto, RoleResponseDto } from '@/lib/api.types';
import { Permissions } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';
import { EditPermissionsDialog } from './EditPermissionsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PREVIEW_COUNT = 2;

function PermissionsPreview({ permissions }: { permissions: string[] }) {
  const visible = permissions.slice(0, PREVIEW_COUNT);
  const remaining = permissions.length - PREVIEW_COUNT;

  if (permissions.length === 0) {
    return <span className="text-muted-foreground text-sm">No permissions</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((p) => (
        <Badge key={p} variant="secondary" className="font-mono text-xs">
          {p}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-muted-foreground text-xs">+{remaining} more</span>
      )}
    </div>
  );
}

export function RolesPage() {
  const can = useAuthStore((s) => s.can);
  const [selectedRole, setSelectedRole] = useState<RoleResponseDto | null>(null);

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<ApiResponse<RoleResponseDto[]>>('/api/v1/roles'),
    select: (res) => res.data,
  });

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: () => api.get<ApiResponse<PermissionResponseDto[]>>('/api/v1/roles/permissions'),
    select: (res) => res.data,
  });

  const roles = rolesQuery.data ?? [];
  const allPermissions = permissionsQuery.data ?? [];
  const canEdit = can(Permissions.ROLES.UPDATE);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Roles</h1>
        <p className="text-muted-foreground text-sm">Manage roles and their permissions.</p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              {canEdit && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canEdit ? 4 : 3 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canEdit ? 4 : 3}
                  className="text-muted-foreground py-10 text-center"
                >
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium capitalize">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description ? String(role.description) : '—'}
                  </TableCell>
                  <TableCell>
                    <PermissionsPreview permissions={role.permissions} />
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRole(role)}
                      >
                        <Settings2 />
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditPermissionsDialog
        role={selectedRole}
        allPermissions={allPermissions}
        open={!!selectedRole}
        onOpenChange={(open) => !open && setSelectedRole(null)}
      />
    </div>
  );
}
