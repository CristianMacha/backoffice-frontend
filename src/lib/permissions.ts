export const Permissions = {
  DASHBOARD: {
    VIEW: 'dashboard.view',
  },
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
  },
  PERMISSIONS: {
    CREATE: 'permissions.create',
    READ: 'permissions.read',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
  },
  PROFILE: {
    READ: 'profile.read',
  },
} as const;

export type Permission = {
  [K in keyof typeof Permissions]: (typeof Permissions)[K][keyof (typeof Permissions)[K]];
}[keyof typeof Permissions];
