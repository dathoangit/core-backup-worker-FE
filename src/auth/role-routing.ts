import type { AuthRole } from './types';

export const HOME_PATH = '/';

/** Where to send the user right after a successful login (or when visiting /login while already authenticated). */
export function getDefaultLandingPath(role: AuthRole): string {
  void role;
  return HOME_PATH;
}
