import type { AuthRole } from 'src/auth/types';
import i18n from 'src/i18n';

export function getRoleLabel(role: AuthRole): string {
  const key = `common:roles.${role}` as const;
  const translated = i18n.t(key);
  return translated === key ? role : translated;
}
