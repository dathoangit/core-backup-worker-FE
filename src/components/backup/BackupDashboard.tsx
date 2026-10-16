import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchBackupRuns,
  fetchBackupSources,
  fetchBackupZones,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings } from 'src/auth/settings-api';
import { BackupOverviewCards } from 'src/components/admin/backup/BackupOverviewCards';
import {
  backupRunStatusClass,
  backupRunStatusLabel,
  databaseRunStatusClass,
  reachabilityClass,
} from 'src/components/admin/backup/backup-status';
import type { BackupRun, BackupSource, BackupZones } from 'src/types/backup';
import { SETTING_SCHEDULE_ENABLED_KEY } from 'src/types/settings';
import {
  buildDatabaseCards,
  databaseDetailHref,
} from 'src/utils/backup-database-cards';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

function isTruthySetting(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function BackupDashboard() {
  const { accessToken, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [sources, setSources] = useState<BackupSource[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [runsResult, sourcesResult, zonesResult, settingsResult] =
      await Promise.allSettled([
        fetchBackupRuns(accessToken, 50),
        fetchBackupSources(accessToken),
        fetchBackupZones(accessToken),
        fetchSettings(accessToken, 'backup'),
      ]);

    const failures: string[] = [];

    if (runsResult.status === 'fulfilled') {
      setRuns(runsResult.value);
    } else {
      failures.push(resolveApiErrorMessage(runsResult.reason));
    }

    if (sourcesResult.status === 'fulfilled') {
      setSources(sourcesResult.value);
    } else {
      failures.push(resolveApiErrorMessage(sourcesResult.reason));
    }

    if (zonesResult.status === 'fulfilled') {
      setZones(zonesResult.value);
    } else {
      failures.push(resolveApiErrorMessage(zonesResult.reason));
    }

    if (settingsResult.status === 'fulfilled') {
      const scheduleSetting = settingsResult.value.find(
        (row) => row.key === SETTING_SCHEDULE_ENABLED_KEY,
      );
      setScheduleEnabled(
        scheduleSetting ? isTruthySetting(scheduleSetting.value) : null,
      );
    } else {
      failures.push(resolveApiErrorMessage(settingsResult.reason));
    }

    setError(failures.length > 0 ? failures[0] ?? null : null);
    setLoading(false);
  }, [accessToken, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasRunningRun = runs.some((run) => run.status === 'running');

  useEffect(() => {
    if (!hasRunningRun || !accessToken || role !== 'admin') {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const [nextRuns, nextSources] = await Promise.all([
            fetchBackupRuns(accessToken, 50),
            fetchBackupSources(accessToken),
          ]);
          setRuns(nextRuns);
          setSources(nextSources);
        } catch {
          // Keep current state; next manual refresh can surface the error.
        }
      })();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [accessToken, hasRunningRun, role]);

  const cards = useMemo(
    () => buildDatabaseCards(sources, runs),
    [sources, runs],
  );

  if (role !== 'admin') {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Backup monitor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tài khoản của bạn không có quyền xem dashboard backup.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Tổng quan backup
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi trạng thái các database đang được backup.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Làm mới
            </button>
            <Link
              href="/runs"
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">
              Chạy backup
            </Link>
            <Link
              href="/config"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cấu hình
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Màn hình trung tâm
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          {loading && !zones ? (
            <p className="text-sm text-slate-600">Đang tải overview...</p>
          ) : (
            <BackupOverviewCards
              zones={zones}
              scheduleEnabled={scheduleEnabled}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Databases</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chọn một database để xem chi tiết watermark, lịch sử và restore plan.
        </p>

        {loading && cards.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">Đang tải danh sách...</p>
        ) : cards.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Chưa có database nào. Thêm cấu hình nguồn tại{' '}
            <Link href="/config" className="font-medium text-sky-700 hover:underline">
              Cấu hình
            </Link>
            .
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const isPlaceholder = card.database === '(chưa cấu hình)';
              const href = isPlaceholder
                ? `/config?category=${card.group.toLowerCase()}`
                : databaseDetailHref(card.group, card.database);

              return (
                <Link
                  key={`${card.group}-${card.database}-${card.host}`}
                  href={href}
                  className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-white hover:shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {card.group}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
                        {card.database}
                      </h3>
                      <p className="mt-1 truncate text-xs text-slate-600">
                        {card.host}
                        {card.port ? `:${card.port}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${reachabilityClass(
                        card.reachability,
                      )}`}>
                      {card.reachability}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between gap-2">
                      <dt>Watermark</dt>
                      <dd className="truncate font-mono text-slate-800">
                        {card.watermark ?? '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt>Lần chạy gần nhất</dt>
                      <dd>
                        {card.lastRunStatus ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 font-medium ${backupRunStatusClass(
                              card.lastRunStatus,
                            )}`}>
                            {backupRunStatusLabel(card.lastRunStatus)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </dd>
                    </div>
                    {card.lastDbStatus ? (
                      <div className="flex items-center justify-between gap-2">
                        <dt>DB status</dt>
                        <dd>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 font-medium ${databaseRunStatusClass(
                              card.lastDbStatus,
                            )}`}>
                            {card.lastDbStatus}
                          </span>
                        </dd>
                      </div>
                    ) : null}
                    {card.lastStartedAt ? (
                      <div className="flex justify-between gap-2">
                        <dt>Thời điểm</dt>
                        <dd className="text-right">
                          {formatIsoAsLocalDateTime(card.lastStartedAt)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {card.reason ? (
                    <p className="mt-2 text-xs text-amber-700">{card.reason}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
