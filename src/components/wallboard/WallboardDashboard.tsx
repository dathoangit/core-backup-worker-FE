import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';
import { fetchPublicOverview } from 'src/auth/public-backup-api';
import {
  backupRunScopeLabel,
  backupRunStatusLabel,
} from 'src/components/admin/backup/backup-status';
import { LanguageSwitcher } from 'src/components/layout/LanguageSwitcher';
import { APP_BRAND_SHORT_NAME, APP_ORG_NAME } from 'src/constants/branding';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type { BackupRunProgressEvent } from 'src/types/backup-stream';
import type { WallboardOverview } from 'src/types/wallboard';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import { ActiveJobStream } from './ActiveJobStream';
import { DatabaseCardsCarousel } from './DatabaseCardsCarousel';
import { DiskForecastPanel } from './DiskForecastPanel';
import { HistorySparklineCard } from './HistorySparklineCard';
import { NextJobCountdown } from './NextJobCountdown';
import { WallboardAlertsPanel } from './WallboardAlertsPanel';
import { WallboardPanel } from './WallboardPanel';
import {
  formatRelativeTime,
  percent,
} from './wallboard-format';

/** Safety net for TV displays if SSE drops; primary updates come from the stream. */
const SAFETY_REFRESH_MS = 5 * 60_000;
const RECENT_JOBS_VISIBLE = 5;

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
    case 'queued':
      return 'running';
    case 'cancelled':
    default:
      return 'neutral';
  }
}

export function WallboardDashboard() {
  const { t } = useTranslation('wallboard');
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
    }, SAFETY_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const { progressByRunId, statusByRunId } = useBackupStream({
    channel: 'public',
    enabled: true,
    onOpen: () => {
      void load(true);
    },
    onStatus: () => {
      void load(true);
    },
  });

  const liveProgress = useMemo((): BackupRunProgressEvent | null => {
    const activeRunId =
      data?.activeJob?.runId ??
      Object.values(statusByRunId).find((s) => s.status === 'running')?.runId;
    if (!activeRunId) {
      const first = Object.values(progressByRunId)[0];
      return first ?? null;
    }
    return progressByRunId[activeRunId] ?? null;
  }, [data?.activeJob?.runId, progressByRunId, statusByRunId]);

  const liveCount = data?.databases.filter((db) => db.live).length ?? 0;
  const offCount = data ? data.databases.length - liveCount : 0;
  const unreachableCount =
    data?.databases.filter((db) => db.reachability === 'unreachable').length ??
    0;
  const disk = data?.disk ?? null;
  const diskCritical = disk && (!disk.exists || disk.usedPercent >= 90) ? 1 : 0;
  const diskWarning =
    disk && disk.exists && disk.usedPercent >= 80 && disk.usedPercent < 90
      ? 1
      : 0;

  const donutData = useMemo(() => {
    if (!data) {
      return [];
    }
    const { jobSummary } = data;
    return [
      { name: t('chart.success'), key: 'ok', value: jobSummary.ok },
      { name: t('chart.error'), key: 'error', value: jobSummary.error },
      { name: t('chart.partial'), key: 'partial', value: jobSummary.partial },
      { name: t('chart.running'), key: 'running', value: jobSummary.running },
    ].filter((row) => row.value > 0);
  }, [data, t]);

  const successPct = data
    ? percent(data.jobSummary.ok, data.jobSummary.total)
    : 0;

  return (
    <div className="flex h-screen max-h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-700 bg-slate-900 px-3 py-1.5 text-white xl:px-4 xl:py-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 xl:text-xs">
            {APP_ORG_NAME}
          </p>
          <h1 className="truncate text-base font-semibold xl:text-lg">
            {t('header.title', { brand: APP_BRAND_SHORT_NAME })}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-[10px] text-slate-300 xl:text-xs">
            <p>
              {lastFetchedAt
                ? t('header.refreshWithRelative', {
                    minutes: SAFETY_REFRESH_MS / 60_000,
                    relative: formatRelativeTime(lastFetchedAt),
                  })
                : t('header.refreshLine', {
                    minutes: SAFETY_REFRESH_MS / 60_000,
                  })}
            </p>
            {data ? (
              <p className="text-slate-400">
                {formatIsoAsLocalDateTime(data.generatedAt)}
              </p>
            ) : null}
          </div>
          <LanguageSwitcher variant="dark" />
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
            {t('loading')}
          </p>
        ) : data ? (
          <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-2 gap-2 xl:gap-2.5">
            {/* Row 1: Databases | Daily backups | Data growth forecast */}
            <WallboardPanel
              className="col-span-4 row-start-1"
              title={t('panels.databases.title')}
              subtitle={t('panels.databases.subtitle', {
                live: liveCount,
                off: offCount,
                total: data.databases.length,
              })}>
              <DatabaseCardsCarousel databases={data.databases} />
            </WallboardPanel>

            <WallboardPanel
              className="col-span-3 row-start-1"
              title={t('panels.daily.title')}
              subtitle={t('panels.daily.subtitle')}>
              <div className="flex h-full min-h-0 flex-col gap-1.5">
                <div className="relative min-h-[8.5rem] flex-[1.35] xl:min-h-[10rem]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          donutData.length > 0
                            ? donutData
                            : [{ name: t('chart.emptySlice'), value: 1, key: 'empty' }]
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius="52%"
                        outerRadius="96%"
                        paddingAngle={2}
                        isAnimationActive={false}>
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
                    <p className="text-2xl font-bold text-slate-900 xl:text-3xl">
                      {successPct}%
                    </p>
                    <p className="text-[10px] text-slate-500 xl:text-xs">
                      {t('legend.ok')}
                    </p>
                  </div>
                </div>
                <ul className="shrink-0 space-y-0.5 text-[11px] xl:text-xs">
                  <li className="flex justify-between text-emerald-700">
                    <span>{t('legend.ok')}</span>
                    <span className="font-semibold">{data.jobSummary.ok}</span>
                  </li>
                  <li className="flex justify-between text-red-700">
                    <span>{t('legend.error')}</span>
                    <span className="font-semibold">
                      {data.jobSummary.error}
                    </span>
                  </li>
                  <li className="flex justify-between text-amber-700">
                    <span>{t('legend.partial')}</span>
                    <span className="font-semibold">
                      {data.jobSummary.partial}
                    </span>
                  </li>
                  <li className="flex justify-between text-sky-700">
                    <span>{t('legend.running')}</span>
                    <span className="font-semibold">
                      {data.jobSummary.running}
                    </span>
                  </li>
                </ul>
                {(data.activeJob?.status === 'running' || liveProgress) && (
                  <div className="shrink-0 border-t border-slate-100 pt-1.5">
                    <ActiveJobStream
                      overviewJob={data.activeJob}
                      liveProgress={liveProgress}
                      compact
                    />
                  </div>
                )}
              </div>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-5 row-start-1"
              title={t('panels.forecast.title')}
              subtitle={
                disk?.exists
                  ? t('panels.forecast.subtitleDisk', {
                      usedPercent: disk.usedPercent,
                      path: disk.path,
                    })
                  : t('panels.forecast.subtitlePrimary', {
                      status: data.zones.primaryExists
                        ? t('primary.ok')
                        : t('primary.missing'),
                    })
              }>
              <DiskForecastPanel
                disk={disk}
                primaryExists={data.zones.primaryExists}
              />
            </WallboardPanel>

            {/* Row 2: Recent jobs | 14-day history | Alerts + Countdown */}
            <WallboardPanel
              className="col-span-3 row-start-2"
              title={t('panels.recentJobs.title')}
              subtitle={t('panels.recentJobs.subtitle', {
                visible: Math.min(RECENT_JOBS_VISIBLE, data.recentJobs.length),
                total: data.recentJobs.length,
              })}>
              <ul className="flex h-full flex-col justify-start gap-1 overflow-hidden">
                {data.recentJobs.length === 0 ? (
                  <li className="text-xs text-slate-500">
                    {t('panels.recentJobs.empty')}
                  </li>
                ) : (
                  data.recentJobs.slice(0, RECENT_JOBS_VISIBLE).map((job) => {
                    const queuedSince = job.queuedAt ?? job.startedAt;
                    const waitingMs =
                      job.status === 'queued'
                        ? Date.now() - new Date(queuedSince).getTime()
                        : 0;
                    const waitingWorker = waitingMs > 2 * 60_000;
                    const scope = backupRunScopeLabel({
                      databasesFilter: job.databasesFilter,
                      sourceGroups: job.sourceGroups,
                    });

                    return (
                      <li
                        key={job.runId}
                        className="flex min-h-0 items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                        <StatusDot tone={runStatusTone(job.status)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-medium text-slate-900 xl:text-xs">
                            {backupRunStatusLabel(job.status)} · {job.mode} ·{' '}
                            {job.trigger}
                          </p>
                          <p className="truncate text-[10px] text-slate-700">
                            {scope}
                            {waitingWorker ? (
                              <span className="ml-1 text-amber-700">
                                {t('recentJob.waitingWorker')}
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {job.runId} ·{' '}
                            {formatIsoAsLocalDateTime(job.startedAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </WallboardPanel>

            <WallboardPanel
              className="col-span-5 row-start-2"
              title={t('panels.history.title')}
              subtitle={t('panels.history.subtitle')}>
              <HistorySparklineCard
                historyByDay={data.historyByDay}
                recentJobs={data.recentJobs}
              />
            </WallboardPanel>

            <div className="col-span-4 row-start-2 flex min-h-0 flex-col gap-2 xl:gap-2.5">
              <WallboardPanel
                className="min-h-0 flex-1"
                title={t('panels.countdown.title')}
                subtitle={
                  data.scheduleEnabled === false
                    ? t('panels.countdown.subtitleScheduleOff')
                    : t('panels.countdown.subtitleUpcoming')
                }>
                <NextJobCountdown
                  schedule={data.schedule}
                  scheduleEnabled={data.scheduleEnabled}
                />
              </WallboardPanel>

              <WallboardPanel
                className="min-h-0 flex-1"
                title={t('panels.alerts.title')}
                subtitle={t('panels.alerts.subtitle')}>
                <WallboardAlertsPanel
                  data={data}
                  unreachableCount={unreachableCount}
                  diskCritical={diskCritical > 0}
                  diskWarning={diskWarning > 0}
                />
              </WallboardPanel>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
