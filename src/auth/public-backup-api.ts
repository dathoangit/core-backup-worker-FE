import { getPublicApiBaseUrl } from 'src/config/public-api';
import type { WallboardOverview } from 'src/types/wallboard';
import { apiGet } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function fetchPublicOverview(): Promise<WallboardOverview> {
  return apiGet<WallboardOverview>({
    api: apiBase,
    endPoint: '/public/backup/overview',
  });
}
