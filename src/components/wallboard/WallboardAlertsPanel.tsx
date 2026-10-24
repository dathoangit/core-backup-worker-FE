import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { WallboardOverview } from 'src/types/wallboard';
import { formatBytesShort } from './wallboard-format';

type AlertSeverity = 'critical' | 'warning' | 'ok';

type AlertItem = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail?: string;
};

type WallboardAlertsPanelProps = {
  data: WallboardOverview;
  unreachableCount: number;
  diskCritical: boolean;
  diskWarning: boolean;
};

function buildAlerts(
  options: WallboardAlertsPanelProps,
  t: TFunction<'wallboard'>,
): AlertItem[] {
  const { data, unreachableCount, diskCritical, diskWarning } = options;
  const items: AlertItem[] = [];

  if (!data.freshness.healthy) {
    items.push({
      id: 'freshness',
      severity: 'critical',
      title: t('alerts.freshnessStaleTitle'),
      detail:
        data.freshness.ageHours != null
          ? t('alerts.freshnessStaleDetailAge', {
              hours: data.freshness.ageHours,
              max: data.freshness.maxAgeHours,
            })
          : t('alerts.freshnessStaleDetailThreshold', {
              max: data.freshness.maxAgeHours,
            }),
    });
  }

  if (unreachableCount > 0) {
    items.push({
      id: 'unreachable',
      severity: 'critical',
      title: t('alerts.unreachableTitle', { count: unreachableCount }),
      detail: t('alerts.unreachableDetail'),
    });
  }

  if (data.zones.lockHeld) {
    items.push({
      id: 'lock',
      severity: 'critical',
      title: t('alerts.lockHeldTitle'),
      detail: t('alerts.lockHeldDetail'),
    });
  }

  if (diskCritical) {
    items.push({
      id: 'disk-critical',
      severity: 'critical',
      title: t('alerts.diskCriticalTitle'),
      detail: data.disk
        ? t('alerts.diskUsageDetail', {
            percent: data.disk.usedPercent,
            free: formatBytesShort(data.disk.freeBytes),
          })
        : t('alerts.diskUnreadable'),
    });
  } else if (diskWarning) {
    items.push({
      id: 'disk-warn',
      severity: 'warning',
      title: t('alerts.diskWarningTitle'),
      detail: data.disk
        ? t('alerts.diskUsageDetail', {
            percent: data.disk.usedPercent,
            free: formatBytesShort(data.disk.freeBytes),
          })
        : undefined,
    });
  }

  const unconfigured = data.databases.filter(
    (db) => db.reachability === 'unconfigured',
  ).length;
  if (unconfigured > 0) {
    items.push({
      id: 'unconfigured',
      severity: 'warning',
      title: t('alerts.unconfiguredTitle', { count: unconfigured }),
      detail: t('alerts.unconfiguredDetail'),
    });
  }

  if (data.scheduleEnabled === false) {
    items.push({
      id: 'schedule',
      severity: 'warning',
      title: t('alerts.scheduleOffTitle'),
      detail: t('alerts.scheduleOffDetail'),
    });
  }

  return items;
}

function buildHealthyChecks(
  options: WallboardAlertsPanelProps,
  t: TFunction<'wallboard'>,
): AlertItem[] {
  const { data, unreachableCount } = options;
  const live = data.databases.filter((db) => db.live).length;
  const total = data.databases.length;

  return [
    {
      id: 'freshness-ok',
      severity: 'ok',
      title: t('checks.freshnessOkTitle'),
      detail:
        data.freshness.ageHours != null
          ? t('checks.freshnessOkDetailAge', {
              hours: data.freshness.ageHours,
              max: data.freshness.maxAgeHours,
            })
          : t('checks.freshnessOkDetailWithin', {
              max: data.freshness.maxAgeHours,
            }),
    },
    {
      id: 'hosts-ok',
      severity: 'ok',
      title: t('checks.hostsOkTitle'),
      detail: t('checks.hostsOkDetail', {
        live,
        total,
        unreachable: unreachableCount,
      }),
    },
    {
      id: 'disk-ok',
      severity: 'ok',
      title: t('checks.diskOkTitle'),
      detail: data.disk?.exists
        ? t('alerts.diskUsageDetail', {
            percent: data.disk.usedPercent,
            free: formatBytesShort(data.disk.freeBytes),
          })
        : t('checks.diskUnreadable'),
    },
    {
      id: 'lock-ok',
      severity: 'ok',
      title: data.zones.lockHeld
        ? t('checks.lockHeldTitle')
        : t('checks.lockFreeTitle'),
      detail: data.zones.lockHeld
        ? t('checks.lockHeldDetail')
        : t('checks.lockFreeDetail'),
    },
    {
      id: 'schedule-ok',
      severity: 'ok',
      title:
        data.scheduleEnabled === false
          ? t('checks.scheduleOffTitle')
          : data.scheduleEnabled
            ? t('checks.scheduleOnTitle')
            : t('checks.scheduleUnknownTitle'),
      detail:
        data.scheduleEnabled === false
          ? t('checks.manualOnlyDetail')
          : t('checks.scheduleOnDetail'),
    },
  ];
}

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { bar: string; badge: string; labelKey: string }
> = {
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-600 text-white',
    labelKey: 'alerts.severityCrit',
  },
  warning: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    labelKey: 'alerts.severityWarn',
  },
  ok: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-600 text-white',
    labelKey: 'alerts.severityOk',
  },
};

function AlertRow({ alert }: { alert: AlertItem }) {
  const { t } = useTranslation('wallboard');
  const style = SEVERITY_STYLES[alert.severity];
  return (
    <div className="flex min-w-0 overflow-hidden rounded-md border border-slate-200/80 bg-white">
      <span className={`w-1 shrink-0 ${style.bar}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5">
        <span
          className={`mt-0.5 shrink-0 rounded px-1 py-px text-[9px] font-bold leading-none ${style.badge}`}>
          {t(style.labelKey)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-slate-900 xl:text-xs">
            {alert.title}
          </p>
          {alert.detail ? (
            <p className="truncate text-[10px] text-slate-500">{alert.detail}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function WallboardAlertsPanel({
  data,
  unreachableCount,
  diskCritical,
  diskWarning,
}: WallboardAlertsPanelProps) {
  const { t } = useTranslation('wallboard');
  const { alerts, healthy } = useMemo(() => {
    const props = { data, unreachableCount, diskCritical, diskWarning };
    return {
      alerts: buildAlerts(props, t),
      healthy: buildHealthyChecks(props, t),
    };
  }, [data, unreachableCount, diskCritical, diskWarning, t]);
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const allClear = alerts.length === 0;
  const rows = allClear ? healthy : alerts;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {allClear ? (
            <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {t('alerts.allClear')}
            </span>
          ) : (
            <>
              {criticalCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {t('alerts.criticalCount', { count: criticalCount })}
                </span>
              ) : null}
              {warningCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {t('alerts.warningCount', { count: warningCount })}
                </span>
              ) : null}
            </>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-slate-400">
          {allClear
            ? t('alerts.checksCount', { count: healthy.length })
            : t('alerts.issuesCount', { count: alerts.length })}
        </span>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {rows.map((alert) => (
          <li key={alert.id}>
            <AlertRow alert={alert} />
          </li>
        ))}
      </ul>
    </div>
  );
}
