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

function buildAlerts(options: WallboardAlertsPanelProps): AlertItem[] {
  const { data, unreachableCount, diskCritical, diskWarning } = options;
  const items: AlertItem[] = [];

  if (!data.freshness.healthy) {
    items.push({
      id: 'freshness',
      severity: 'critical',
      title: 'Backup freshness stale',
      detail:
        data.freshness.ageHours != null
          ? `Tuổi dữ liệu ~${data.freshness.ageHours}h (max ${data.freshness.maxAgeHours}h)`
          : `Vượt ngưỡng ${data.freshness.maxAgeHours}h`,
    });
  }

  if (unreachableCount > 0) {
    items.push({
      id: 'unreachable',
      severity: 'critical',
      title: `${unreachableCount} host unreachable`,
      detail: 'Không kết nối được nguồn backup',
    });
  }

  if (data.zones.lockHeld) {
    items.push({
      id: 'lock',
      severity: 'critical',
      title: 'Primary lock đang giữ',
      detail: 'Có thể đang có job chạy hoặc lock bị treo',
    });
  }

  if (diskCritical) {
    items.push({
      id: 'disk-critical',
      severity: 'critical',
      title: 'Ổ đĩa critical',
      detail: data.disk
        ? `${data.disk.usedPercent}% đã dùng · trống ${formatBytesShort(data.disk.freeBytes)}`
        : 'Không đọc được dung lượng ổ',
    });
  } else if (diskWarning) {
    items.push({
      id: 'disk-warn',
      severity: 'warning',
      title: 'Ổ đĩa sắp đầy',
      detail: data.disk
        ? `${data.disk.usedPercent}% đã dùng · trống ${formatBytesShort(data.disk.freeBytes)}`
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
      title: `${unconfigured} DB chưa cấu hình`,
      detail: 'Thiếu host / credentials trong settings',
    });
  }

  if (data.scheduleEnabled === false) {
    items.push({
      id: 'schedule',
      severity: 'warning',
      title: 'Lịch tự động đang tắt',
      detail: 'Cron không enqueue — chỉ chạy manual',
    });
  }

  return items;
}

const SEVERITY_STYLES: Record<
  AlertSeverity,
  { bar: string; badge: string; label: string }
> = {
  critical: {
    bar: 'bg-red-500',
    badge: 'bg-red-600 text-white',
    label: 'CRIT',
  },
  warning: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    label: 'WARN',
  },
  ok: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-600 text-white',
    label: 'OK',
  },
};

export function WallboardAlertsPanel({
  data,
  unreachableCount,
  diskCritical,
  diskWarning,
}: WallboardAlertsPanelProps) {
  const alerts = buildAlerts({
    data,
    unreachableCount,
    diskCritical,
    diskWarning,
  });
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;
  const allClear = alerts.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {allClear ? (
            <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              All clear
            </span>
          ) : (
            <>
              {criticalCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {criticalCount} critical
                </span>
              ) : null}
              {warningCount > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {warningCount} warning
                </span>
              ) : null}
            </>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-slate-400">
          {alerts.length} issue{alerts.length === 1 ? '' : 's'}
        </span>
      </div>

      {allClear ? (
        <div className="flex min-h-0 flex-1 flex-col items-start justify-center rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2">
          <p className="text-sm font-semibold text-emerald-900">
            Hệ thống ổn định
          </p>
          <p className="text-[11px] text-emerald-800/80">
            Freshness OK · host sẵn sàng · đĩa trong ngưỡng · lịch{' '}
            {data.scheduleEnabled ? 'bật' : '—'}
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <li
                key={alert.id}
                className="flex min-w-0 overflow-hidden rounded-md border border-slate-200/80 bg-white">
                <span
                  className={`w-1 shrink-0 ${style.bar}`}
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1 py-px text-[9px] font-bold leading-none ${style.badge}`}>
                    {style.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-900 xl:text-xs">
                      {alert.title}
                    </p>
                    {alert.detail ? (
                      <p className="truncate text-[10px] text-slate-500">
                        {alert.detail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
