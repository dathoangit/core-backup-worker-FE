import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchBackupRuns,
  fetchBackupSources,
  fetchBackupZones,
  triggerBackupRun,
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
import { RunProgressBar } from 'src/components/backup/RunProgressBar';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type { BackupRun, BackupSource, BackupZones } from 'src/types/backup';
import { SETTING_SCHEDULE_ENABLED_KEY } from 'src/types/settings';
import {
  buildDatabaseCards,
  databaseDetailHref,
  isUnconfiguredDatabaseName,
  type DatabaseCardModel,
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
  const { t, i18n } = useTranslation(['home', 'layout', 'common']);
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [sources, setSources] = useState<BackupSource[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);
  const [startingKey, setStartingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    const [runsResult, sourcesResult, zonesResult, settingsResult] =
      await Promise.allSettled([
        fetchBackupRuns(50),
        fetchBackupSources(),
        fetchBackupZones(),
        fetchSettings('backup'),
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
    hasLoadedRef.current = true;
    setLoading(false);
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const { progressByRunId } = useBackupStream({
    enabled: role === 'admin',
    onOpen: () => {
      void load();
    },
    onStatus: () => {
      void load();
    },
  });

  const hasRunningRun = runs.some((run) => run.status === 'running');

  const activeProgress = runs
    .filter((run) => run.status === 'running' || run.status === 'queued')
    .map((run) => progressByRunId[run.runId])
    .find(Boolean);

  const cards = useMemo(
    () => buildDatabaseCards(sources, runs),
    [sources, runs, i18n.language],
  );

  const handleStartDatabase = async (card: DatabaseCardModel) => {
    if (role !== 'admin' || card.reachability !== 'ready') {
      return;
    }

    const key = `${card.group}:${card.database}`;
    setStartingKey(key);
    setError(null);

    try {
      await triggerBackupRun({
        mode: 'incremental',
        groups: [card.group],
        databases: [card.database],
      });
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setStartingKey(null);
    }
  };

  if (role !== 'admin') {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {t('home:nonAdmin.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('home:nonAdmin.message')}
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
              {t('home:title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t('home:subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('common:actions.refresh')}
            </button>
            <Link
              href="/runs"
              className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700">
              {t('home:actions.runBackup')}
            </Link>
            <Link
              href="/config"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('layout:nav.config')}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('layout:nav.wallboard')}
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
            <p className="text-sm text-slate-600">{t('home:loading.overview')}</p>
          ) : (
            <BackupOverviewCards
              zones={zones}
              scheduleEnabled={scheduleEnabled}
            />
          )}
        </div>
        {activeProgress ? (
          <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <RunProgressBar progress={activeProgress} />
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {t('home:databases.sectionTitle')}
        </h2>
        <p className="mt-1 text-sm text-slate-600">{t('home:databases.hint')}</p>

        {loading && cards.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            {t('home:databases.loading')}
          </p>
        ) : cards.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            {t('home:databases.empty')}
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const isPlaceholder = isUnconfiguredDatabaseName(card.database);
              const href = isPlaceholder
                ? `/config?category=${card.group.toLowerCase()}`
                : databaseDetailHref(card.group, card.database);
              const cardKey = `${card.group}:${card.database}`;
              const canStart =
                !isPlaceholder &&
                card.reachability === 'ready' &&
                !hasRunningRun &&
                startingKey === null;

              return (
                <article
                  key={`${card.group}-${card.database}-${card.host}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                      <dt>{t('home:card.watermark')}</dt>
                      <dd className="truncate font-mono text-slate-800">
                        {card.watermark ?? t('common:emDash')}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt>{t('home:card.lastRun')}</dt>
                      <dd>
                        {card.lastRunStatus ? (
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 font-medium ${backupRunStatusClass(
                              card.lastRunStatus,
                            )}`}>
                            {backupRunStatusLabel(card.lastRunStatus)}
                          </span>
                        ) : (
                          t('common:emDash')
                        )}
                      </dd>
                    </div>
                    {card.lastDbStatus ? (
                      <div className="flex items-center justify-between gap-2">
                        <dt>{t('home:card.dbStatus')}</dt>
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
                        <dt>{t('home:card.timestamp')}</dt>
                        <dd className="text-right">
                          {formatIsoAsLocalDateTime(card.lastStartedAt)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {card.reason ? (
                    <p className="mt-2 text-xs text-amber-700">{card.reason}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={href}
                      className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      {isPlaceholder
                        ? t('home:card.configure')
                        : t('common:actions.details')}
                    </Link>
                    {!isPlaceholder ? (
                      <button
                        type="button"
                        disabled={!canStart}
                        title={
                          card.reachability !== 'ready'
                            ? t('home:card.tooltipStartWhenReady')
                            : hasRunningRun
                              ? t('home:card.tooltipBackupRunning')
                              : t('home:card.tooltipStartIncremental')
                        }
                        onClick={() => void handleStartDatabase(card)}
                        className="inline-flex rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {startingKey === cardKey
                          ? t('home:card.starting')
                          : t('home:card.start')}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
