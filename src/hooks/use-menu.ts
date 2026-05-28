import { useMemo } from "react";
import { MENU_ITEMS, isMenuGroup, type MenuItem } from "@/lib/menu";
import { useAuthStore } from "@/stores/auth.store";
import type { Permission } from "@/lib/permissions";

export function useVisibleMenuItems(): MenuItem[] {
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  return useMemo(() => {
    const can = (p: Permission) => permissions.includes(p);

    return MENU_ITEMS.reduce<MenuItem[]>((acc, item) => {
      if (isMenuGroup(item)) {
        const visibleChildren = item.children.filter((c) => can(c.permission));
        if (visibleChildren.length > 0)
          acc.push({ ...item, children: visibleChildren });
      } else if (can(item.permission)) {
        acc.push(item);
      }
      return acc;
    }, []);
  }, [permissions]);
}
