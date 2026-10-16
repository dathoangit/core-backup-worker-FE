import type { AuthRole } from 'src/auth/types';

const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  nurse: 'Điều dưỡng',
};

export function getRoleLabel(role: AuthRole): string {
  return ROLE_LABELS[role] ?? role;
}
