import Link from 'next/link';
import { useState } from 'react';
import type { BackupMode, BackupRun, SourceGroup } from 'src/types/backup';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import {
  backupRunStatusClass,
  backupRunStatusLabel,
} from './backup-status';

const SOURCE_GROUPS: SourceGroup[] = ['HIS', 'EMR', 'BADL', 'LIS', 'PACS'];

type BackupRunsTableProps = {
  runs: BackupRun[];
  triggering: boolean;
  onTrigger: (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => Promise<void>;
};

export function BackupRunsTable({
  runs,
  triggering,
  onTrigger,
}: BackupRunsTableProps) {
  const [mode, setMode] = useState<BackupMode>('incremental');
  const [groups, setGroups] = useState<SourceGroup[]>(['HIS', 'EMR', 'LIS']);
  const [databasesRaw, setDatabasesRaw] = useState('');

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
          Chạy backup thủ công
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
              {triggering ? 'Đang gửi...' : 'Trigger backup'}
            </button>
          </div>
        </div>
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
              <th className="px-3 py-2 font-medium">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Chưa có backup run.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
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
                    <Link
                      href={`/runs/${encodeURIComponent(run.runId)}`}
                      className="text-sm font-medium text-sky-700 hover:underline">
                      Xem
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {runs.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có backup run.</p>
        ) : (
          runs.map((run) => (
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
              <Link
                href={`/runs/${encodeURIComponent(run.runId)}`}
                className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline">
                Xem chi tiết
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
