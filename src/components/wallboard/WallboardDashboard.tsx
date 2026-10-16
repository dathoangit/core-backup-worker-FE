import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchPublicOverview } from 'src/auth/public-backup-api';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';
import type { WallboardOverview } from 'src/types/wallboard';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import { DiskCylinder } from './DiskCylinder';
import { WallboardPanel } from './WallboardPanel';
import {
  formatRelativeTime,
  formatShortDay,
  percent,
} from './wallboard-format';

const REFRESH_MS = 15_000;
const RECENT_JOBS_VISIBLE = 6;

const STATUS_COLORS = {
  ok: '#059669',
  error: '#dc2626',
  partial: '#d97706',
  running: '#0284c7',
} as const;

function StatusDot({
  tone,
}: {
  tone: 'ok' | 'error' | 'warn' | 'neutral' | 'running';
}) {
  const className =
    tone === 'ok'
      ? 'bg-emerald-500'
      : tone === 'error'
        ? 'bg-red-500'
        : tone === 'warn'
          ? 'bg-amber-500'
          : tone === 'running'
            ? 'bg-sky-500'
            : 'bg-slate-400';
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`}
    />
  );
}

function runStatusTone(
  status: string,
): 'ok' | 'error' | 'warn' | 'neutral' | 'running' {
  switch (status) {
    case 'ok':
      return 'ok';
    case 'error':
      return 'error';
    case 'partial':
      return 'warn';
    case 'running':
      return 'running';
    default:
      return 'neutral';
  }
}

export function WallboardDashboard() {
  const [data, setData] = useState<WallboardOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const overview = await fetchPublicOverview();
      setData(overview);
      setError(null);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load(true);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const liveCount = data?.databases.filter((db) => db.live).length ?? 0;
  const offCount = data ? data.databases.length - liveCount : 0;
  const unreachableCount =
    data?.databases.filter((db) => db.reachability === 'unreachable').length ??
    0;
  const disks = data?.disks ?? [];
  const diskCritical = disks.filter(
    (d) => !d.exists || d.usedPercent >= 90,
  ).length;
  const diskWarning = disks.filter(
    (d) => d.exists && d.usedPercent >= 80 && d.usedPercent < 90,
  ).length;

  const donutData = useMemo(() => {
    if (!data) {
      return [];
    }
    const { jobSummary } = data;
    return [
      { name: 'Thành công', key: 'ok', value: jobSummary.ok },
      { name: 'Lỗi', key: 'error', value: jobSummary.error },
      { name: 'Một phần', key: 'partial', value: jobSummary.partial },
      { name: 'Đang chạy', key: 'running', value: jobSummary.running },
    ].filter((row) => row.value > 0);
  }, [data]);

  const historyChartData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.historyByDay.map((day) => ({
      ...day,
      label: formatShortDay(day.date),
    }));
  }, [data]);

  const successPct = data
    ? percent(data.jobSummary.ok, data.jobSummary.total)
    : 0;

  const alertCritical =
    unreachableCount +
    (data && !data.freshness.healthy ? 1 : 0) +
    (data?.zones.lockHeld ? 1 : 0) +
    diskCritical;
  const alertWarning =
    (data?.databases.filter((db) => db.reachability === 'unconfigured')
      .length ?? 0) +
    (data?.scheduleEnabled === false ? 1 : 0) +
    diskWarning;

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-3 py-1.5 text-white xl:px-4 xl:py-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 xl:text-xs">
            {APP_ORG_NAME}
          </p>
          <h1 className="truncate text-base font-semibold xl:text-lg">
            {APP_BRAND_SHORT_NAME} · Backup Wallboard
          </h1>
        </div>
        <div className="shrink-0 text-right text-[10px] text-slate-300 xl:text-xs">
          <p>
            {REFRESH_MS / 1000}s refresh
            {lastFetchedAt ? ` · ${formatRelativeTime(lastFetchedAt)}` : ''}
          </p>
          {data ? (
            <p className="text-slate-400">
              {formatIsoAsLocalDateTime(data.generatedAt)}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 xl:gap-2.5 xl:p-2.5">
        {error ? (
          <p
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
            role="alert">
            {error}
          </p>
        ) : null}

        {loading && !data ? (
          <p className="flex flex-1 items-center justify-center text-slate-600">
            Đang tải wallboard…
          </p>
        ) : data ? (
          <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-2 gap-2 xl:gap-2.5">
            {/* Row 1 */}
            <WallboardPanel
              className="col-span-5 row-start-1"
              title="Databases"
              subtitle={`${liveCount} live · ${offCount} off · ${data.databases.length} tổng`}>
              <div className="grid h-full grid-cols-3 content-start gap-1.5 overflow-hidden xl:gap-2">
                {data.databases.map((db) => (
                  <article
                    key={`${db.group}-${db.database}-${db.host}`}
                    className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="truncate text-xs font-semibold text-slate-900 xl:text-sm">
                        {db.database}
                      </p>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          db.live
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {db.live ? 'LIVE' : 'OFF'}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-slate-500">
                      {db.group} · {db.host}
                    </p>
                  </article>
                ))}
              </div>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-3 row-start-1"
              title="Daily backups"
              subtitle="24h / mẫu gần nhất">
              <div className="flex h-full min-h-0 flex-col gap-1.5">
                <div className="relative min-h-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          donutData.length > 0
                            ? donutData
                            : [{ name: 'Trống', value: 1, key: 'empty' }]
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius="55%"
                        outerRadius="85%"
                        paddingAngle={2}>
                        {(donutData.length > 0
                          ? donutData
                          : [{ key: 'empty', value: 1 }]
                        ).map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              entry.key === 'ok'
                                ? STATUS_COLORS.ok
                                : entry.key === 'error'
                                  ? STATUS_COLORS.error
                                  : entry.key === 'partial'
                                    ? STATUS_COLORS.partial
                                    : entry.key === 'running'
                                      ? STATUS_COLORS.running
                                      : '#cbd5e1'
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-bold text-slate-900 xl:text-2xl">
                      {successPct}%
                    </p>
                    <p className="text-[10px] text-slate-500">OK</p>
                  </div>
                </div>
                <ul className="shrink-0 space-y-0.5 text-[11px] xl:text-xs">
                  <li className="flex justify-between text-emerald-700">
                    <span>OK</span>
                    <span className="font-semibold">{data.jobSummary.ok}</span>
                  </li>
                  <li className="flex justify-between text-red-700">
                    <span>Lỗi</span>
                    <span className="font-semibold">{data.jobSummary.error}</span>
                  </li>
                  <li className="flex justify-between text-amber-700">
                    <span>Partial</span>
                    <span className="font-semibold">
                      {data.jobSummary.partial}
                    </span>
                  </li>
                  <li className="flex justify-between text-sky-700">
                    <span>Running</span>
                    <span className="font-semibold">
                      {data.jobSummary.running}
                    </span>
                  </li>
                  <li className="flex justify-between border-t border-slate-200 pt-0.5 text-slate-600">
                    <span>Tổng</span>
                    <span className="font-semibold">{data.jobSummary.total}</span>
                  </li>
                </ul>
              </div>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-4 row-start-1"
              title="Ổ cứng · Volumes"
              subtitle={`Primary ${data.zones.primaryExists ? 'OK' : 'missing'} · lock ${data.zones.lockHeld ? 'HELD' : 'free'} · lịch ${data.scheduleEnabled === false ? 'tắt' : data.scheduleEnabled ? 'bật' : '?'}`}>
              <div className="flex h-full min-h-0 flex-col gap-1">
                <div className="flex min-h-0 flex-1 flex-wrap content-start items-stretch gap-1.5 overflow-auto">
                  {disks.length === 0 ? (
                    <p className="self-center text-xs text-slate-500">
                      Chưa có dữ liệu ổ.
                    </p>
                  ) : (
                    disks.map((disk) => (
                      <div
                        key={disk.id}
                        className="min-h-[96px] min-w-[140px] flex-1 basis-[30%] rounded-lg border border-slate-100 bg-slate-50/80 px-1.5 py-1">
                        <DiskCylinder disk={disk} />
                      </div>
                    ))
                  )}
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-1.5 text-[10px] xl:text-[11px]">
                  <div className="rounded-lg bg-slate-50 px-2 py-1">
                    <p className="text-slate-500">Runs</p>
                    <p className="font-semibold text-slate-900">
                      {data.zones.runCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1">
                    <p className="text-slate-500">Isolated</p>
                    <p className="font-semibold text-slate-900">
                      {data.zones.isolatedConfigured ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1">
                    <p className="text-slate-500">Fresh</p>
                    <p
                      className={`font-semibold ${
                        data.freshness.healthy
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}>
                      {data.freshness.healthy ? 'OK' : 'Stale'}
                    </p>
                  </div>
                </div>
              </div>
            </WallboardPanel>

            {/* Row 2 */}
            <WallboardPanel
              className="col-span-4 row-start-2"
              title="Recent jobs"
              subtitle={`${Math.min(RECENT_JOBS_VISIBLE, data.recentJobs.length)} / ${data.recentJobs.length}`}>
              <ul className="flex h-full flex-col justify-start gap-1 overflow-hidden">
                {data.recentJobs.length === 0 ? (
                  <li className="text-xs text-slate-500">Chưa có job.</li>
                ) : (
                  data.recentJobs.slice(0, RECENT_JOBS_VISIBLE).map((job) => (
                    <li
                      key={job.runId}
                      className="flex min-h-0 items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                      <StatusDot tone={runStatusTone(job.status)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-slate-900 xl:text-xs">
                          {job.status.toUpperCase()} · {job.mode}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {job.runId}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {formatRelativeTime(job.startedAt)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-5 row-start-2"
              title="History 14 ngày"
              subtitle="Asia/Ho_Chi_Minh">
              <div className="h-full min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="ok"
                      name="OK"
                      stroke={STATUS_COLORS.ok}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="error"
                      name="Error"
                      stroke={STATUS_COLORS.error}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="partial"
                      name="Partial"
                      stroke={STATUS_COLORS.partial}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-3 row-start-2"
              title="Alerts"
              subtitle="Ưu tiên xử lý">
              <div className="flex h-full min-h-0 flex-col gap-2">
                <div className="grid shrink-0 grid-cols-2 gap-1.5">
                  <div className="rounded-lg bg-red-50 px-2 py-2 text-center">
                    <p className="text-xl font-bold text-red-700 xl:text-2xl">
                      {alertCritical}
                    </p>
                    <p className="text-[10px] font-medium text-red-600">
                      Critical
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 px-2 py-2 text-center">
                    <p className="text-xl font-bold text-amber-700 xl:text-2xl">
                      {alertWarning}
                    </p>
                    <p className="text-[10px] font-medium text-amber-600">
                      Warning
                    </p>
                  </div>
                </div>
                <ul className="min-h-0 flex-1 space-y-1 overflow-hidden text-[11px] xl:text-xs">
                  <li className="flex items-center gap-1.5">
                    <StatusDot
                      tone={data.freshness.healthy ? 'ok' : 'error'}
                    />
                    <span className="truncate">
                      Freshness{' '}
                      {data.freshness.healthy ? 'OK' : 'stale'}
                      {data.freshness.ageHours != null
                        ? ` · ${data.freshness.ageHours}h`
                        : ''}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <StatusDot
                      tone={unreachableCount > 0 ? 'error' : 'ok'}
                    />
                    <span className="truncate">
                      {unreachableCount} host unreachable
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <StatusDot
                      tone={diskCritical > 0 ? 'error' : diskWarning > 0 ? 'warn' : 'ok'}
                    />
                    <span className="truncate">
                      Disk {diskCritical > 0 ? 'critical' : diskWarning > 0 ? 'warning' : 'OK'}
                    </span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <StatusDot
                      tone={data.scheduleEnabled === false ? 'warn' : 'ok'}
                    />
                    <span className="truncate">
                      Schedule{' '}
                      {data.scheduleEnabled === false
                        ? 'tắt'
                        : data.scheduleEnabled
                          ? 'bật'
                          : '?'}
                    </span>
                  </li>
                </ul>
              </div>
            </WallboardPanel>
          </div>
        ) : null}
      </main>
    </div>
  );
}
