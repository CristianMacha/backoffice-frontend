import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, KeyRound, ShieldCheck, UserX } from 'lucide-react';
import type { UserResponseDto } from '@/lib/api.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Permissions } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';

export type RowAction = 'changeRole' | 'deactivate' | 'resetPassword';

type ColumnsOptions = {
  rolesMap: Record<string, string>;
  onAction: (action: RowAction, user: UserResponseDto) => void;
};

const statusVariant: Record<UserResponseDto['status'], 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  inactive: 'secondary',
  banned: 'destructive',
};

function ActionsCell({
  user,
  onAction,
}: {
  user: UserResponseDto;
  onAction: ColumnsOptions['onAction'];
}) {
  const can = useAuthStore((s) => s.can);
  const canUpdate = can(Permissions.USERS.UPDATE);
  const canDelete = can(Permissions.USERS.DELETE) && user.status === 'active';

  if (!canUpdate && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canUpdate && (
          <DropdownMenuItem onClick={() => onAction('changeRole', user)}>
            <ShieldCheck />
            Change role
          </DropdownMenuItem>
        )}
        {canUpdate && (
          <DropdownMenuItem onClick={() => onAction('resetPassword', user)}>
            <KeyRound />
            Send password reset
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onAction('deactivate', user)}
            >
              <UserX />
              Deactivate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function buildColumns({ rolesMap, onAction }: ColumnsOptions): ColumnDef<UserResponseDto>[] {
  return [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'roleId',
      header: 'Role',
      cell: ({ row }) => rolesMap[row.original.roleId] ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status]}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => <ActionsCell user={row.original} onAction={onAction} />,
    },
  ];
}

