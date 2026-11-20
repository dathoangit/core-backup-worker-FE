import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BackupRun } from 'src/types/backup';
import { backupRunScopeLabel } from './backup-status';

type ActiveJobsSummaryProps = {
  runs: BackupRun[];
  cancellingRunId: string | null;
  onCancel: (runId: string) => Promise<void>;
};

export function ActiveJobsSummary({
  runs,
  cancellingRunId,
  onCancel,
}: ActiveJobsSummaryProps) {
  const { t } = useTranslation(['runs', 'common']);

  const queuedRuns = useMemo(
    () =>
      runs
        .filter((run) => run.status === 'queued')
        .sort((a, b) => {
          const aTime = a.queuedAt ?? a.startedAt;
          const bTime = b.queuedAt ?? b.startedAt;
          return aTime.localeCompare(bTime);
        }),
    [runs],
  );

  const runningRuns = useMemo(
    () => runs.filter((run) => run.status === 'running'),
    [runs],
  );

  if (runningRuns.length === 0 && queuedRuns.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
        <h3 className="text-sm font-semibold text-sky-900">
          {t('runs:sections.running')}
        </h3>
        <ul className="mt-2 space-y-2">
          {runningRuns.length === 0 ? (
            <li className="text-xs text-sky-800/80">
              {t('runs:sections.runningEmpty')}
            </li>
          ) : (
            runningRuns.map((run) => (
              <li
                key={run.runId}
                className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-slate-900">
                    {run.runId}
                  </p>
                  <p className="truncate text-slate-600">
                    {t(`common:mode.${run.mode}`, {
                      defaultValue: run.mode,
                    })}{' '}
                    · {run.trigger} ·{' '}
                    {backupRunScopeLabel({
                      databasesFilter: run.databasesFilter,
                      sourceGroups: run.sourceGroups,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={cancellingRunId === run.runId}
                  onClick={() => void onCancel(run.runId)}
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
      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
        <h3 className="text-sm font-semibold text-violet-900">
          {t('runs:sections.queue')}
        </h3>
        <ul className="mt-2 space-y-2">
          {queuedRuns.length === 0 ? (
            <li className="text-xs text-violet-800/80">
              {t('runs:sections.queueEmpty')}
            </li>
          ) : (
            queuedRuns.map((run, index) => (
              <li
                key={run.runId}
                className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-slate-900">
                    #{index + 1} {run.runId}
                  </p>
                  <p className="truncate text-slate-600">
                    {t(`common:mode.${run.mode}`, {
                      defaultValue: run.mode,
                    })}{' '}
                    · {run.trigger} ·{' '}
                    {backupRunScopeLabel({
                      databasesFilter: run.databasesFilter,
                      sourceGroups: run.sourceGroups,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={cancellingRunId === run.runId}
                  onClick={() => void onCancel(run.runId)}
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
  );
}
