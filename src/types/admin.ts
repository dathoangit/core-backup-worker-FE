import type { AuthRole } from 'src/auth/types';

export type AdminUser = {
  id: string;
  username: string;
  email?: string | null;
  emailVerifiedAt?: string | null;
  role: AuthRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdminUserRequest = {
  username: string;
  email?: string;
  password: string;
  role: AuthRole;
  isActive?: boolean;
};

export type UpdateAdminUserRequest = {
  username?: string;
  email?: string;
  password?: string;
  role?: AuthRole;
  isActive?: boolean;
};
