import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiPost } from 'src/utils/api';
import type { AuthLoginRequest, AuthLoginResponse } from './types';

const apiBase = getPublicApiBaseUrl();

export function login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  return apiPost<AuthLoginResponse, AuthLoginRequest>({
    api: apiBase,
    endPoint: '/auth/login',
    body,
  });
}
