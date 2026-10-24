import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cancelBackupRun, fetchBackupRun } from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { RunLogTerminal } from 'src/components/backup/RunLogTerminal';
import { RunProgressBar } from 'src/components/backup/RunProgressBar';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type { BackupRun } from 'src/types/backup';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import {
  backupRunStatusClass,
  backupRunStatusLabel,
  databaseRunStatusClass,
  formatBytes,
} from './backup-status';

type BackupRunDetailProps = {
  runId: string;
};

function canCancel(status: BackupRun['status']): boolean {
  return status === 'queued' || status === 'running';
}

export function BackupRunDetail({ runId }: BackupRunDetailProps) {
  const { t } = useTranslation(['runs', 'common']);
  const { role } = useAuth();

  const labelForDbStatus = (status: string) => {
    if (status === 'ok' || status === 'error' || status === 'skipped') {
      return t(`common:status.${status}`);
    }
    return status;
  };
  const [run, setRun] = useState<BackupRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const loadedRunIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    const isRefresh = loadedRunIdRef.current === runId;
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const next = await fetchBackupRun(runId);
      setRun(next);
      setError(null);
      loadedRunIdRef.current = runId;
    } catch (err) {
      setError(resolveApiErrorMessage(err));
      if (!isRefresh) {
        setRun(null);
      }
    } finally {
      setLoading(false);
    }
  }, [role, runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { progressByRunId, logs } = useBackupStream({
    enabled: role === 'admin',
    runId,
    onOpen: () => {
      void load();
    },
    onStatus: (event) => {
      if (event.runId !== runId) {
        return;
      }
      setRun((prev) => {
        if (!prev) {
          void load();
          return prev;
        }
        const status =
          event.status === 'cancelling' ? 'running' : event.status;
        return {
          ...prev,
          status,
          error: event.error ?? prev.error,
        };
      });
      if (
        event.status === 'ok' ||
        event.status === 'partial' ||
        event.status === 'error' ||
        event.status === 'cancelled'
      ) {
        void load();
      }
    },
  });
  const progress = progressByRunId[runId];

  const handleCancel = async () => {
    if (role !== 'admin') {
      return;
    }

    setCancelling(true);
    setError(null);
    setInfo(null);

    try {
      const result = await cancelBackupRun(runId);
      setInfo(
        result.status === 'cancelling'
          ? t('runs:detail.cancelling')
          : t('runs:detail.cancelled'),
      );
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/runs"
            className="text-sm font-medium text-sky-700 hover:underline">
            {t('runs:detail.backLink')}
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            {t('runs:detail.title')}
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-600">{runId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {run && canCancel(run.status) ? (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => void handleCancel()}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">
              {cancelling
                ? t('common:ellipsis')
                : run.status === 'queued'
                  ? t('runs:detail.cancelQueued')
                  : t('runs:detail.cancelRunning')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t('common:actions.refresh')}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mt-4 text-sm text-sky-700" role="status">
          {info}
        </p>
      ) : null}

      {loading && !run ? (
        <p className="mt-6 text-sm text-slate-600">{t('common:loading.generic')}</p>
      ) : null}

      {run ? (
        <div className="mt-6 space-y-6">
          {(run.status === 'running' || run.status === 'queued') && progress ? (
            <RunProgressBar progress={progress} />
          ) : null}
          {(run.status === 'running' ||
            run.status === 'queued' ||
            logs.length > 0) && <RunLogTerminal logs={logs} />}
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.status')}
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${backupRunStatusClass(
                    run.status,
                  )}`}>
                  {backupRunStatusLabel(run.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.mode')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{run.mode}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.trigger')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{run.trigger}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.groups')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.sourceGroups?.trim() ? run.sourceGroups : t('common:emDash')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.databasesFilter')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.databasesFilter?.trim()
                  ? run.databasesFilter
                  : t('common:emDash')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.queuedAt')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.queuedAt
                  ? formatIsoAsLocalDateTime(run.queuedAt)
                  : t('common:emDash')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.started')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatIsoAsLocalDateTime(run.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.ended')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.finishedAt
                  ? formatIsoAsLocalDateTime(run.finishedAt)
                  : t('common:emDash')}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">
                {t('runs:detail.fields.archive')}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.archiveStatus ?? t('common:emDash')}
              </dd>
            </div>
          </dl>

          {run.backupDir ? (
            <p className="break-all font-mono text-xs text-slate-600">
              {run.backupDir}
            </p>
          ) : null}

          {run.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {run.error}
            </p>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {t('runs:detail.databasesTitle')}
            </h3>
            {!run.databases || run.databases.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {t('runs:detail.databasesEmpty')}
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.group')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.database')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.profile')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.status')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.chunks')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.bytes')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.rows')}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t('runs:detail.table.error')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {run.databases.map((db) => (
                      <tr key={`${db.sourceGroup}-${db.database}`}>
                        <td className="px-3 py-3 text-slate-700">
                          {db.sourceGroup}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {db.database}
                        </td>
                        <td className="px-3 py-3 text-slate-600">{db.profile}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${databaseRunStatusClass(
                              db.status,
                            )}`}>
                            {labelForDbStatus(db.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {db.chunkCount ?? t('common:emDash')}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatBytes(db.bytesTotal)}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {db.rowCountTotal ?? t('common:emDash')}
                        </td>
                        <td className="max-w-xs truncate px-3 py-3 text-xs text-red-600">
                          {db.error ?? t('common:emDash')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
