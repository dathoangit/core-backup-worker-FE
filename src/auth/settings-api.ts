import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  AppSetting,
  SettingCategory,
  UpdateSettingRequest,
} from 'src/types/settings';
import { apiGet, apiPut } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

function withToken(token: string) {
  return { api: apiBase, token };
}

export function fetchSettings(
  token: string,
  category?: SettingCategory,
): Promise<AppSetting[]> {
  return apiGet<AppSetting[]>({
    ...withToken(token),
    endPoint: '/admin/settings',
    params: category ? { category } : undefined,
  });
}

export function fetchSetting(token: string, key: string): Promise<AppSetting> {
  return apiGet<AppSetting>({
    ...withToken(token),
    endPoint: `/admin/settings/${encodeURIComponent(key)}`,
  });
}

export function updateSetting(
  token: string,
  key: string,
  body: UpdateSettingRequest,
): Promise<AppSetting> {
  return apiPut<AppSetting, UpdateSettingRequest>({
    ...withToken(token),
    endPoint: `/admin/settings/${encodeURIComponent(key)}`,
    body,
  });
}
