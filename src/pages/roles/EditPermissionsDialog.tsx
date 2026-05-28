import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import type { ApiResponse, PermissionResponseDto, RoleResponseDto } from '@/lib/api.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Props = {
  role: RoleResponseDto | null;
  allPermissions: PermissionResponseDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function groupByPrefix(permissions: PermissionResponseDto[]) {
  return permissions.reduce<Record<string, PermissionResponseDto[]>>((acc, perm) => {
    const group = perm.name.split('.')[0];
    const label = group.charAt(0).toUpperCase() + group.slice(1);
    (acc[label] ??= []).push(perm);
    return acc;
  }, {});
}

export function EditPermissionsDialog({ role, allPermissions, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupByPrefix(allPermissions), [allPermissions]);

  useEffect(() => {
    if (!role) return;
    const rolePermissionNames = new Set(role.permissions);
    const initial = allPermissions
      .filter((p) => rolePermissionNames.has(p.name))
      .map((p) => p.id);
    setSelectedIds(new Set(initial));
  }, [role, allPermissions]);

  const mutation = useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
      api.patch<ApiResponse<RoleResponseDto>>(`/api/v1/roles/${id}/permissions`, {
        permissionIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated successfully.');
      onOpenChange(false);
    },
  });

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleGroup(perms: PermissionResponseDto[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (checked ? next.add(p.id) : next.delete(p.id)));
      return next;
    });
  }

  function handleSave() {
    if (!role) return;
    mutation.mutate({ id: role.id, permissionIds: Array.from(selectedIds) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit permissions</DialogTitle>
          {role && <DialogDescription>{role.name}</DialogDescription>}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="grid gap-4 py-1">
            {Object.entries(groups).map(([label, perms], i) => {
              const allChecked = perms.every((p) => selectedIds.has(p.id));
              const someChecked = perms.some((p) => selectedIds.has(p.id));

              return (
                <div key={label}>
                  {i > 0 && <Separator className="mb-4" />}
                  <div className="mb-2 flex items-center gap-2">
                    <Checkbox
                      id={`group-${label}`}
                      checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                      onCheckedChange={(checked) => toggleGroup(perms, checked === true)}
                    />
                    <label
                      htmlFor={`group-${label}`}
                      className="cursor-pointer text-sm font-semibold"
                    >
                      {label}
                    </label>
                  </div>
                  <div className="ml-6 grid gap-2">
                    {perms.map((perm) => (
                      <div key={perm.id} className="flex items-center gap-2">
                        <Checkbox
                          id={perm.id}
                          checked={selectedIds.has(perm.id)}
                          onCheckedChange={(checked) => toggle(perm.id, !!checked)}
                        />
                        <label htmlFor={perm.id} className="cursor-pointer text-sm">
                          {perm.description ?? perm.name}
                          <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                            {perm.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {mutation.isError && (
          <p className="text-destructive text-sm">Failed to update permissions. Try again.</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
