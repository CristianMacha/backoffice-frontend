import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { UserPlus, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { api } from '@/lib/axios';
import type {
  ApiPaginatedResponse,
  ApiResponse,
  PasswordResetResponseDto,
  RoleResponseDto,
  UserResponseDto,
} from '@/lib/api.types';
import { Permissions } from '@/lib/permissions';
import { useAuthStore } from '@/stores/auth.store';
import { buildColumns, type RowAction } from './columns';
import { CreateUserDialog } from './CreateUserDialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';
import { DeactivateUserAlert } from './DeactivateUserAlert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

type ActiveDialog = 'changeRole' | 'deactivate' | 'resetPassword' | null;

export function UsersPage() {
  const can = useAuthStore((s) => s.can);

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['users', page],
    queryFn: () =>
      api.get<ApiPaginatedResponse<UserResponseDto>>('/api/v1/users', {
        params: { page, limit: 20 },
      }),
  });

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<ApiResponse<RoleResponseDto[]>>('/api/v1/roles'),
    select: (res) => res.data,
  });

  const rolesMap = useMemo(
    () => Object.fromEntries((rolesQuery.data ?? []).map((r) => [r.id, r.name])),
    [rolesQuery.data],
  );

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<ApiResponse<PasswordResetResponseDto>>(`/api/v1/users/${id}/password-reset`),
    onSuccess: (res) => {
      setResetLink(res.data.resetLink);
      setActiveDialog(null);
    },
  });

  function handleAction(action: RowAction, user: UserResponseDto) {
    setSelectedUser(user);
    if (action === 'resetPassword') {
      resetPasswordMutation.mutate(user.id);
    } else {
      setActiveDialog(action);
    }
  }

  function closeDialog() {
    setActiveDialog(null);
    setSelectedUser(null);
  }

  async function copyResetLink() {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const columns = useMemo(
    () => buildColumns({ rolesMap, onAction: handleAction }),
    [rolesMap],
  );

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta;

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta?.totalPages ?? -1,
  });

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          {meta && (
            <p className="text-muted-foreground text-sm">{meta.total} total</p>
          )}
        </div>
        {can(Permissions.USERS.CREATE) && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus />
            Create user
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground py-10 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page === meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ChangeRoleDialog
        user={selectedUser}
        open={activeDialog === 'changeRole'}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <DeactivateUserAlert
        user={selectedUser}
        open={activeDialog === 'deactivate'}
        onOpenChange={(open) => !open && closeDialog()}
      />

      {/* Password reset result */}
      <AlertDialog open={!!resetLink} onOpenChange={(open) => !open && setResetLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Password reset link</AlertDialogTitle>
            <AlertDialogDescription>
              Copy and share this link with the user so they can set their password.
              The link expires after first use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setResetLink(null)}>
              Close
            </Button>
            <Button onClick={copyResetLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
