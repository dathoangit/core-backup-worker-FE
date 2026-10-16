/**
 * Browser-facing API base URL.
 * Defaults to direct backend URL in local development.
 * Override with NEXT_PUBLIC_API_URL for each environment.
 */
export function getPublicApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) {
    return url.replace(/\/$/, '');
  }
  return 'http://localhost:8081';
}
