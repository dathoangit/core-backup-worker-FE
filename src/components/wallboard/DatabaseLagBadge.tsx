import { useTranslation } from 'react-i18next';
import { lagBadge } from './wallboard-format';

type DatabaseLagBadgeProps = {
  lagMinutes: number | null | undefined;
};

export function DatabaseLagBadge({ lagMinutes }: DatabaseLagBadgeProps) {
  // Re-render on locale change; label text comes from common:lag.* via lagBadge().
  useTranslation('common');
  const badge = lagBadge(lagMinutes);
  const className =
    badge.tone === 'ok'
      ? 'bg-emerald-100 text-emerald-800'
      : badge.tone === 'warn'
        ? 'bg-amber-100 text-amber-800'
        : badge.tone === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-600';

  const dot =
    badge.tone === 'ok'
      ? '🟢'
      : badge.tone === 'warn'
        ? '🟡'
        : badge.tone === 'error'
          ? '🔴'
          : '⚪';

  return (
    <span
      className={`inline-flex max-w-full items-center gap-0.5 truncate rounded px-1 py-0.5 text-[9px] font-semibold xl:text-[10px] ${className}`}>
      <span aria-hidden="true">{dot}</span>
      {badge.label}
    </span>
  );
}
