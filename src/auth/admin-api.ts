import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from 'src/types/admin';
import { apiDelete, apiGet, apiPatch, apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

function withToken(token: string) {
  return { api: apiBase, token };
}

export function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  return apiGet<AdminUser[]>({
    ...withToken(token),
    endPoint: '/admin/users',
  });
}

export function createAdminUser(
  token: string,
  body: CreateAdminUserRequest,
): Promise<AdminUser> {
  return apiPost<AdminUser, CreateAdminUserRequest>({
    ...withToken(token),
    endPoint: '/admin/users',
    body,
  });
}

export function updateAdminUser(
  token: string,
  userId: string,
  body: UpdateAdminUserRequest,
): Promise<AdminUser> {
  return apiPatch<AdminUser, UpdateAdminUserRequest>({
    ...withToken(token),
    endPoint: `/admin/users/${userId}`,
    body,
  });
}

export function deactivateAdminUser(token: string, userId: string): Promise<void> {
  return apiDelete<void>({
    ...withToken(token),
    endPoint: `/admin/users/${userId}`,
  });
}
