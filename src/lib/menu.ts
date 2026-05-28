import { LayoutDashboard, Users, User, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Permissions, type Permission } from '@/lib/permissions';

export type MenuLeaf = {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  permission: Permission;
  children?: never;
};

export type MenuGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: MenuLeaf[];
  path?: never;
};

export type MenuItem = MenuLeaf | MenuGroup;

export function isMenuGroup(item: MenuItem): item is MenuGroup {
  return Array.isArray((item as MenuGroup).children);
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    permission: Permissions.DASHBOARD.VIEW,
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    children: [
      {
        id: 'users-list',
        label: 'Users List',
        icon: User,
        path: '/users',
        permission: Permissions.USERS.READ,
      },
      {
        id: 'roles',
        label: 'Roles',
        icon: Shield,
        path: '/roles',
        permission: Permissions.ROLES.READ,
      },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    permission: Permissions.PROFILE.READ,
  },
];
