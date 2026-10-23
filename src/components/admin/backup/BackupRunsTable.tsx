import Link from 'next/link';
import { useMemo, useState } from 'react';
import type {
  BackupMode,
  BackupRun,
  BackupRunStatus,
  SourceGroup,
} from 'src/types/backup';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import {
  backupRunScopeLabel,
  backupRunStatusClass,
  backupRunStatusLabel,
} from './backup-status';

const SOURCE_GROUPS: SourceGroup[] = ['HIS', 'EMR', 'BADL', 'LIS', 'PACS'];

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
  triggering: boolean;
  cancellingRunId: string | null;
  onTrigger: (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => Promise<void>;
  onCancel: (runId: string) => Promise<void>;
};

function canCancel(status: BackupRunStatus): boolean {
  return status === 'queued' || status === 'running';
}

export function BackupRunsTable({
  runs,
  triggering,
  cancellingRunId,
  onTrigger,
  onCancel,
}: BackupRunsTableProps) {
  const [mode, setMode] = useState<BackupMode>('incremental');
  const [groups, setGroups] = useState<SourceGroup[]>(['HIS', 'EMR', 'LIS']);
  const [databasesRaw, setDatabasesRaw] = useState('');
  const [statusFilter, setStatusFilter] = useState<BackupRunStatus | 'all'>(
    'all',
  );

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

  const filteredRuns = useMemo(() => {
    if (statusFilter === 'all') {
      return runs;
    }

    return runs.filter((run) => run.status === statusFilter);
  }, [runs, statusFilter]);

  const toggleGroup = (group: SourceGroup) => {
    setGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const handleTrigger = async () => {
    const databases = databasesRaw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    await onTrigger({
      mode,
      groups,
      databases: databases.length > 0 ? databases : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Chạy backup thủ công (xếp hàng BullMQ)
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block font-medium">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as BackupMode)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="incremental">Incremental</option>
                <option value="full">Full</option>
              </select>
            </label>
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">
                Groups
              </legend>
              <div className="flex flex-wrap gap-2">
                {SOURCE_GROUPS.map((group) => (
                  <label
                    key={group}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={groups.includes(group)}
                      onChange={() => toggleGroup(group)}
                      className="rounded border-slate-300"
                    />
                    {group}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <label className="block text-sm text-slate-700">
            <span className="mb-1 block font-medium">
              Databases (optional, CSV)
            </span>
            <input
              type="text"
              value={databasesRaw}
              onChange={(e) => setDatabasesRaw(e.target.value)}
              placeholder="produce,signer — trống = tất cả DB trong group"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={triggering || groups.length === 0}
              onClick={() => void handleTrigger()}
              className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
              {triggering ? 'Đang xếp hàng...' : 'Xếp hàng backup'}
            </button>
          </div>
        </div>
      </div>

      {runningRuns.length > 0 || queuedRuns.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
            <h3 className="text-sm font-semibold text-sky-900">Đang chạy</h3>
            <ul className="mt-2 space-y-2">
              {runningRuns.length === 0 ? (
                <li className="text-xs text-sky-800/80">Không có job đang chạy</li>
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
                      onClick={() => void onCancel(run.runId)}
                      className="shrink-0 rounded-md border border-red-200 px-2 py-1 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {cancellingRunId === run.runId ? '...' : 'Hủy'}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
            <h3 className="text-sm font-semibold text-violet-900">Hàng đợi</h3>
            <ul className="mt-2 space-y-2">
              {queuedRuns.length === 0 ? (
                <li className="text-xs text-violet-800/80">Hàng đợi trống</li>
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
                      onClick={() => void onCancel(run.runId)}
                      className="shrink-0 rounded-md border border-red-200 px-2 py-1 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {cancellingRunId === run.runId ? '...' : 'Hủy'}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600">Lọc status:</span>
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
            {status === 'all' ? 'Tất cả' : backupRunStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2 font-medium">Run ID</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Mode</th>
              <th className="px-3 py-2 font-medium">Trigger</th>
              <th className="px-3 py-2 font-medium">Bắt đầu</th>
              <th className="px-3 py-2 font-medium">Kết thúc</th>
              <th className="px-3 py-2 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Chưa có backup run.
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
                  <td className="px-3 py-3 text-slate-600">{run.mode}</td>
                  <td className="px-3 py-3 text-slate-600">{run.trigger}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatIsoAsLocalDateTime(run.startedAt)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {run.finishedAt
                      ? formatIsoAsLocalDateTime(run.finishedAt)
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/runs/${encodeURIComponent(run.runId)}`}
                        className="text-sm font-medium text-sky-700 hover:underline">
                        Xem
                      </Link>
                      {canCancel(run.status) ? (
                        <button
                          type="button"
                          disabled={cancellingRunId === run.runId}
                          onClick={() => void onCancel(run.runId)}
                          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50">
                          {cancellingRunId === run.runId ? '...' : 'Hủy'}
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
          <p className="text-sm text-slate-500">Chưa có backup run.</p>
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
                  <dt className="inline font-medium">Mode: </dt>
                  <dd className="inline">{run.mode}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Trigger: </dt>
                  <dd className="inline">{run.trigger}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Bắt đầu: </dt>
                  <dd className="inline">
                    {formatIsoAsLocalDateTime(run.startedAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/runs/${encodeURIComponent(run.runId)}`}
                  className="text-sm font-medium text-sky-700 hover:underline">
                  Xem chi tiết
                </Link>
                {canCancel(run.status) ? (
                  <button
                    type="button"
                    disabled={cancellingRunId === run.runId}
                    onClick={() => void onCancel(run.runId)}
                    className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50">
                    {cancellingRunId === run.runId ? '...' : 'Hủy'}
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
