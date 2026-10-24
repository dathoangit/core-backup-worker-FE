import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelAllQueuedBackupRuns,
  cancelBackupRun,
  fetchBackupQueue,
} from 'src/auth/backup-api';
import type { BackupQueueSnapshot } from 'src/types/backup';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import { backupRunScopeLabel } from './backup-status';

type BackupQueuePanelProps = {
  /** Bump to force reload (e.g. after SSE status / parent refresh). */
  refreshKey?: number;
  onChanged?: () => void;
};

function CountsLine({
  label,
  counts,
}: {
  label: string;
  counts: BackupQueueSnapshot['incremental']['counts'];
}) {
  const { t } = useTranslation('runs');

  return (
    <p className="text-xs text-slate-600">
      <span className="font-medium text-slate-800">{label}</span>
      {' · '}
      {t('queue.counts.waiting')} {counts.waiting}
      {' · '}
      {t('queue.counts.active')} {counts.active}
      {' · '}
      {t('queue.counts.delayed')} {counts.delayed}
      {' · '}
      {t('queue.counts.failed')} {counts.failed}
      {' · '}
      {t('queue.counts.prioritized')} {counts.prioritized}
    </p>
  );
}

export function BackupQueuePanel({
  refreshKey = 0,
  onChanged,
}: BackupQueuePanelProps) {
  const { t } = useTranslation(['runs', 'common']);
  const [snapshot, setSnapshot] = useState<BackupQueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [cancellingAll, setCancellingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchBackupQueue();
      setSnapshot(next);
      setError(null);
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const handleCancel = async (runId: string) => {
    setCancellingRunId(runId);
    setError(null);
    setInfo(null);
    try {
      const result = await cancelBackupRun(runId);
      setInfo(
        result.status === 'cancelling'
          ? t('runs:queue.cancellingOne', { runId })
          : t('runs:queue.cancelledOne', { runId }),
      );
      await load();
      onChanged?.();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setCancellingRunId(null);
    }
  };

  const handleCancelAllQueued = async () => {
    if (!window.confirm(t('runs:queue.confirmCancelAll'))) {
      return;
    }

    setCancellingAll(true);
    setError(null);
    setInfo(null);
    try {
      const result = await cancelAllQueuedBackupRuns();
      setInfo(
        t('runs:queue.cancelledMany', { count: result.cancelled.length }) +
          (result.failed.length > 0
            ? t('runs:queue.failedSuffix', { count: result.failed.length })
            : ''),
      );
      await load();
      onChanged?.();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setCancellingAll(false);
    }
  };

  const bullJobs = snapshot
    ? [...snapshot.incremental.jobs, ...snapshot.full.jobs]
    : [];
  const queuedCount = snapshot?.dbQueued.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t('runs:queue.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t('runs:queue.subtitle')}</p>
          {snapshot ? (
            <div className="mt-2 space-y-0.5">
              <CountsLine
                label={snapshot.incremental.name}
                counts={snapshot.incremental.counts}
              />
              <CountsLine label={snapshot.full.name} counts={snapshot.full.counts} />
              <p className="text-xs text-slate-500">
                {t('runs:queue.updatedAt', {
                  time: formatIsoAsLocalDateTime(snapshot.generatedAt),
                })}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t('common:actions.refresh')}
          </button>
          <button
            type="button"
            disabled={cancellingAll || queuedCount === 0}
            onClick={() => void handleCancelAllQueued()}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
            {cancellingAll
              ? t('runs:queue.cancellingAll')
              : t('runs:queue.cancelAllButton', { count: queuedCount })}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-sky-700" role="status">
          {info}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <p className="text-sm text-slate-600">{t('runs:queue.loading')}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {t('runs:queue.bullSectionTitle')}
            </div>
            <ul className="divide-y divide-slate-100">
              {bullJobs.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-500">
                  {t('runs:queue.bullEmpty')}
                </li>
              ) : (
                bullJobs.map((job) => (
                  <li
                    key={`${job.queue}-${job.runId}-${job.bullState}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-slate-900">
                        {job.runId}
                      </p>
                      <p className="truncate text-slate-600">
                        {job.bullState} · {job.mode} · {job.trigger} ·{' '}
                        {backupRunScopeLabel({
                          databases: job.databases,
                          groups: job.sourceGroups,
                        })}
                      </p>
                      <p className="truncate text-slate-400">{job.queue}</p>
                    </div>
                    <button
                      type="button"
                      disabled={cancellingRunId === job.runId}
                      onClick={() => void handleCancel(job.runId)}
                      className="shrink-0 rounded-md border border-red-200 px-2 py-1 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {cancellingRunId === job.runId
                        ? t('common:ellipsis')
                        : t('common:actions.cancel')}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="overflow-hidden rounded-lg border border-violet-200">
            <div className="border-b border-violet-100 bg-violet-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-800">
              {t('runs:queue.dbSectionTitle', { count: queuedCount })}
            </div>
            <ul className="divide-y divide-violet-50">
              {(snapshot?.dbQueued.length ?? 0) === 0 ? (
                <li className="px-3 py-3 text-sm text-violet-800/70">
                  {t('runs:queue.dbEmpty')}
                </li>
              ) : (
                snapshot?.dbQueued.map((run, index) => (
                  <li
                    key={run.runId}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-slate-900">
                        #{index + 1} {run.runId}
                      </p>
                      <p className="truncate text-slate-600">
                        {run.mode} · {run.trigger} ·{' '}
                        {backupRunScopeLabel({
                          databasesFilter: run.databasesFilter,
                          sourceGroups: run.sourceGroups,
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={cancellingRunId === run.runId}
                      onClick={() => void handleCancel(run.runId)}
                      className="shrink-0 rounded-md border border-red-200 px-2 py-1 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {cancellingRunId === run.runId
                        ? t('common:ellipsis')
                        : t('common:actions.cancel')}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
