import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
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

export function BackupRunDetail({ runId }: BackupRunDetailProps) {
  const { accessToken, role } = useAuth();
  const [run, setRun] = useState<BackupRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchBackupRun(accessToken, runId);
      setRun(next);
    } catch (err) {
      setError(resolveApiErrorMessage(err));
      setRun(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, role, runId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!run || run.status !== 'running') {
      return;
    }

    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [load, run]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/runs"
            className="text-sm font-medium text-sky-700 hover:underline">
            ← Quay lại lịch sử
          </Link>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">
            Chi tiết backup run
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-600">{runId}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Làm mới
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading && !run ? (
        <p className="mt-6 text-sm text-slate-600">Đang tải...</p>
      ) : null}

      {run ? (
        <div className="mt-6 space-y-6">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">Status</dt>
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
              <dt className="text-xs font-medium text-slate-500">Mode</dt>
              <dd className="mt-1 text-sm text-slate-900">{run.mode}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Trigger</dt>
              <dd className="mt-1 text-sm text-slate-900">{run.trigger}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Bắt đầu</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatIsoAsLocalDateTime(run.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Kết thúc</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.finishedAt
                  ? formatIsoAsLocalDateTime(run.finishedAt)
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Archive</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {run.archiveStatus ?? '—'}
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
            <h3 className="text-sm font-semibold text-slate-900">Databases</h3>
            {!run.databases || run.databases.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Không có chi tiết database (có thể là stub từ filesystem).
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Group</th>
                      <th className="px-3 py-2 font-medium">Database</th>
                      <th className="px-3 py-2 font-medium">Profile</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Chunks</th>
                      <th className="px-3 py-2 font-medium">Bytes</th>
                      <th className="px-3 py-2 font-medium">Rows</th>
                      <th className="px-3 py-2 font-medium">Error</th>
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
                            {db.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {db.chunkCount ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {formatBytes(db.bytesTotal)}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {db.rowCountTotal ?? '—'}
                        </td>
                        <td className="max-w-xs truncate px-3 py-3 text-xs text-red-600">
                          {db.error ?? '—'}
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
