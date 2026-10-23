const LEGACY_ACCESS_TOKEN_KEY = 'triage.auth.accessToken';
const LEGACY_AUTH_USER_KEY = 'triage.auth.user';

/** Drop pre-cookie JWT leftovers from localStorage / sessionStorage once per boot. */
export function clearLegacyAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_AUTH_USER_KEY);
  window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_AUTH_USER_KEY);
}
