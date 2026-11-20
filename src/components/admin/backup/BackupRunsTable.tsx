import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BackupRun, BackupRunStatus } from 'src/types/backup';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import {
  backupRunStatusClass,
  backupRunStatusLabel,
  canCancelBackupRun,
  canResumeBackupRun,
} from './backup-status';

const STATUS_FILTERS: Array<BackupRunStatus | 'all'> = [
  'all',
  'queued',
  'running',
  'ok',
  'partial',
  'error',
  'cancelled',
];

type BackupRunsTableProps = {
  runs: BackupRun[];
  cancellingRunId: string | null;
  resumingRunId: string | null;
  onCancel: (runId: string) => Promise<void>;
  onResume: (runId: string) => Promise<void>;
};

export function BackupRunsTable({
  runs,
  cancellingRunId,
  resumingRunId,
  onCancel,
  onResume,
}: BackupRunsTableProps) {
  const { t } = useTranslation(['runs', 'common']);
  const [statusFilter, setStatusFilter] = useState<BackupRunStatus | 'all'>(
    'all',
  );

  const filteredRuns = useMemo(() => {
    if (statusFilter === 'all') {
      return runs;
    }

    return runs.filter((run) => run.status === statusFilter);
  }, [runs, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">
          {t('runs:filter.label')}
        </span>
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              statusFilter === status
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
            {status === 'all'
              ? t('common:filter.all')
              : backupRunStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2 font-medium">{t('runs:table.runId')}</th>
              <th className="px-3 py-2 font-medium">{t('runs:table.status')}</th>
              <th className="px-3 py-2 font-medium">{t('runs:table.mode')}</th>
              <th className="px-3 py-2 font-medium">
                {t('runs:table.trigger')}
              </th>
              <th className="px-3 py-2 font-medium">
                {t('runs:table.started')}
              </th>
              <th className="px-3 py-2 font-medium">{t('runs:table.ended')}</th>
              <th className="px-3 py-2 font-medium">
                {t('runs:table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRuns.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-slate-500">
                  {t('runs:table.empty')}
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => (
                <tr key={run.runId}>
                  <td className="px-3 py-3 font-mono text-xs text-slate-900">
                    {run.runId}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${backupRunStatusClass(
                        run.status,
                      )}`}>
                      {backupRunStatusLabel(run.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {t(`common:mode.${run.mode}`, { defaultValue: run.mode })}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{run.trigger}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatIsoAsLocalDateTime(run.startedAt)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {run.finishedAt
                      ? formatIsoAsLocalDateTime(run.finishedAt)
                      : t('common:emDash')}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/runs/${encodeURIComponent(run.runId)}`}
                        className="text-sm font-medium text-sky-700 hover:underline">
                        {t('common:actions.view')}
                      </Link>
                      {canCancelBackupRun(run.status) ? (
                        <button
                          type="button"
                          disabled={cancellingRunId === run.runId}
                          onClick={() => void onCancel(run.runId)}
                          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50">
                          {cancellingRunId === run.runId
                            ? t('common:ellipsis')
                            : t('common:actions.cancel')}
                        </button>
                      ) : null}
                      {canResumeBackupRun(run.status) ? (
                        <button
                          type="button"
                          disabled={resumingRunId === run.runId}
                          onClick={() => void onResume(run.runId)}
                          className="text-sm font-medium text-emerald-700 hover:underline disabled:opacity-50">
                          {resumingRunId === run.runId
                            ? t('common:ellipsis')
                            : t('common:actions.resume')}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredRuns.length === 0 ? (
          <p className="text-sm text-slate-500">{t('runs:table.empty')}</p>
        ) : (
          filteredRuns.map((run) => (
            <article
              key={run.runId}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate font-mono text-xs font-semibold text-slate-900">
                  {run.runId}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${backupRunStatusClass(
                    run.status,
                  )}`}>
                  {backupRunStatusLabel(run.status)}
                </span>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div>
                  <dt className="inline font-medium">
                    {t('runs:table.mode')}:{' '}
                  </dt>
                  <dd className="inline">
                    {t(`common:mode.${run.mode}`, { defaultValue: run.mode })}
                  </dd>
                </div>
                <div>
                  <dt className="inline font-medium">
                    {t('runs:table.trigger')}:{' '}
                  </dt>
                  <dd className="inline">{run.trigger}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">
                    {t('runs:mobile.startedAt')}{' '}
                  </dt>
                  <dd className="inline">
                    {formatIsoAsLocalDateTime(run.startedAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/runs/${encodeURIComponent(run.runId)}`}
                  className="text-sm font-medium text-sky-700 hover:underline">
                  {t('common:actions.viewDetails')}
                </Link>
                {canCancelBackupRun(run.status) ? (
                  <button
                    type="button"
                    disabled={cancellingRunId === run.runId}
                    onClick={() => void onCancel(run.runId)}
                    className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50">
                    {cancellingRunId === run.runId
                      ? t('common:ellipsis')
                      : t('common:actions.cancel')}
                  </button>
                ) : null}
                {canResumeBackupRun(run.status) ? (
                  <button
                    type="button"
                    disabled={resumingRunId === run.runId}
                    onClick={() => void onResume(run.runId)}
                    className="text-sm font-medium text-emerald-700 hover:underline disabled:opacity-50">
                    {resumingRunId === run.runId
                      ? t('common:ellipsis')
                      : t('common:actions.resume')}
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
