import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  AppSetting,
  SettingCategory,
  UpdateSettingRequest,
} from 'src/types/settings';
import { apiGet, apiPut } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function fetchSettings(category?: SettingCategory): Promise<AppSetting[]> {
  return apiGet<AppSetting[]>({
    api: apiBase,
    endPoint: '/admin/settings',
    params: category ? { category } : undefined,
  });
}

export function fetchSetting(key: string): Promise<AppSetting> {
  return apiGet<AppSetting>({
    api: apiBase,
    endPoint: `/admin/settings/${encodeURIComponent(key)}`,
  });
}

export function updateSetting(
  key: string,
  body: UpdateSettingRequest,
): Promise<AppSetting> {
  return apiPut<AppSetting, UpdateSettingRequest>({
    api: apiBase,
    endPoint: `/admin/settings/${encodeURIComponent(key)}`,
    body,
  });
}
