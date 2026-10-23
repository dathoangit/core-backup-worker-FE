import { getPublicApiBaseUrl } from 'src/config/public-api';
import { apiGet, apiPost } from 'src/utils/api';
import type { AuthLoginRequest, AuthLoginResponse, AuthMeResponse } from './types';

const apiBase = getPublicApiBaseUrl();

export function login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  return apiPost<AuthLoginResponse, AuthLoginRequest>({
    api: apiBase,
    endPoint: '/auth/login',
    body,
    suppressUnauthorized: true,
  });
}

export function fetchMe(): Promise<AuthMeResponse> {
  return apiGet<AuthMeResponse>({
    api: apiBase,
    endPoint: '/auth/me',
    suppressUnauthorized: true,
  });
}

export function logout(): Promise<void> {
  return apiPost<void>({
    api: apiBase,
    endPoint: '/auth/logout',
    suppressUnauthorized: true,
  });
}
