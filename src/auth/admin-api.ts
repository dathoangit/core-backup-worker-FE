import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from 'src/types/admin';
import { apiDelete, apiGet, apiPatch, apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>({
    api: apiBase,
    endPoint: '/admin/users',
  });
}

export function createAdminUser(body: CreateAdminUserRequest): Promise<AdminUser> {
  return apiPost<AdminUser, CreateAdminUserRequest>({
    api: apiBase,
    endPoint: '/admin/users',
    body,
  });
}

export function updateAdminUser(
  userId: string,
  body: UpdateAdminUserRequest,
): Promise<AdminUser> {
  return apiPatch<AdminUser, UpdateAdminUserRequest>({
    api: apiBase,
    endPoint: `/admin/users/${userId}`,
    body,
  });
}

export function deactivateAdminUser(userId: string): Promise<void> {
  return apiDelete<void>({
    api: apiBase,
    endPoint: `/admin/users/${userId}`,
  });
}
