import type { Permission } from '@/lib/permissions';

// ---------------------------------------------------------------------------
// Error envelope — shape returned by the backend on any error response
// ---------------------------------------------------------------------------

export type ErrorResponse = {
  statusCode: number;
  errorCode: string;
  message: string;
  requestId: string | undefined;
  timestamp: string;
  path: string;
};

// ---------------------------------------------------------------------------
// Response envelope — all endpoints wrap their payload in { data: T }
// Paginated endpoints additionally include { meta: PaginationMeta }
// ---------------------------------------------------------------------------

export type ApiResponse<T> = { data: T };

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiPaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type MeResponseDto = {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'banned';
  permissions: Permission[];
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type UserResponseDto = {
  id: string;
  email: string;
  roleId: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  updatedAt: string;
};

export type CreateUserDto = {
  email: string;
  roleId: string;
};

export type ChangeUserRoleDto = {
  roleId: string;
};

export type PasswordResetResponseDto = {
  resetLink: string;
};

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

export type RoleResponseDto = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export type PermissionResponseDto = {
  id: string;
  name: string;
  description: string | null;
};

export type UpdateRolePermissionsDto = {
  permissionIds: string[];
};
