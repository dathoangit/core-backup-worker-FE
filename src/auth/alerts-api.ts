import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function sendAlertTest(
  channel: 'telegram' | 'email',
): Promise<{ ok: true }> {
  return apiPost<{ ok: true }>({
    api: apiBase,
    endPoint: '/admin/alerts/test',
    params: { channel },
  });
}
