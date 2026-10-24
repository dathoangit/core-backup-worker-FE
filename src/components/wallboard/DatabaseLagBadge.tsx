import { useTranslation } from 'react-i18next';
import type { WallboardLagState } from 'src/types/wallboard';
import { StatusPulseDot } from './StatusPulseDot';
import { lagBadge } from './wallboard-format';

type DatabaseLagBadgeProps = {
  lagMinutes: number | null | undefined;
  lagState: WallboardLagState | null | undefined;
};

export function DatabaseLagBadge({
  lagMinutes,
  lagState,
}: DatabaseLagBadgeProps) {
  // Re-render on locale change; label text comes from common:lag.* via lagBadge().
  useTranslation('common');
  const badge = lagBadge(lagMinutes, lagState);
  const className =
    badge.tone === 'ok'
      ? 'bg-emerald-100 text-emerald-800'
      : badge.tone === 'warn'
        ? 'bg-amber-100 text-amber-800'
        : badge.tone === 'error'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-600';

  const dotVariant =
    lagState === 'on_time'
      ? 'scheduleOk'
      : badge.tone === 'warn'
        ? 'warn'
        : badge.tone === 'error'
          ? 'error'
          : 'neutral';

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded px-1 py-0.5 text-[9px] font-semibold xl:text-[10px] ${className}`}>
      <StatusPulseDot variant={dotVariant} />
      {badge.label}
    </span>
  );
}
