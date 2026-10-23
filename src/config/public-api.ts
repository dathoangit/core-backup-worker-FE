/**
 * Browser-facing API base URL (includes Nest global prefix `api/v1`).
 * Override with NEXT_PUBLIC_API_URL for each environment.
 */
export function getPublicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) {
    return url.replace(/\/$/, '');
  }
  return 'http://localhost:8081/api/v1';
}
