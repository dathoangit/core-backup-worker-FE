const ADMIN_ONLY_EXACT = new Set(['/runs', '/config', '/files']);

const ADMIN_ONLY_PREFIXES = [
  '/admin',
  '/runs/',
  '/databases/',
  '/config/',
  '/files/',
];

/** Paths that require `role === 'admin'` (beyond general auth). */
export function isAdminOnlyPath(pathname: string): boolean {
  if (ADMIN_ONLY_EXACT.has(pathname)) {
    return true;
  }

  return ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
