import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchBackupRuns,
  fetchBackupSources,
  fetchRestorePlan,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import {
  backupRunStatusClass,
  backupRunStatusLabel,
  databaseRunStatusClass,
  reachabilityClass,
} from 'src/components/admin/backup/backup-status';
import type {
  BackupRun,
  BackupSource,
  RestorePlan,
  SourceGroup,
} from 'src/types/backup';
import { groupToSettingCategory } from 'src/utils/backup-database-cards';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

type DatabaseDetailPanelProps = {
  group: SourceGroup;
  database: string;
};

export function DatabaseDetailPanel({
  group,
  database,
}: DatabaseDetailPanelProps) {
  const { accessToken, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const loadedKeyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<BackupSource | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    const requestKey = `${group}:${database}`;
    const isRefresh = loadedKeyRef.current === requestKey;
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const [sources, nextRuns] = await Promise.all([
        fetchBackupSources(accessToken),
        fetchBackupRuns(accessToken, 50),
      ]);
      setSource(sources.find((row) => row.group === group) ?? null);
      setRuns(nextRuns);
      setError(null);
      loadedKeyRef.current = requestKey;
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, group, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const relatedRuns = useMemo(() => {
    return runs.filter((run) =>
      run.databases?.some(
        (row) => row.database === database && row.sourceGroup === group,
      ),
    );
  }, [runs, database, group]);

  const loadRestorePlan = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      return;
    }

    setPlanLoading(true);
    setPlanError(null);

    try {
      const next = await fetchRestorePlan(accessToken, database);
      setPlan(next);
    } catch (err) {
      setPlan(null);
      setPlanError(resolveApiErrorMessage(err));
    } finally {
      setPlanLoading(false);
    }
  }, [accessToken, database, role]);

  useEffect(() => {
    void loadRestorePlan();
  }, [loadRestorePlan]);

  const configCategory = groupToSettingCategory(group);
  const watermark = source?.watermarks[database] ?? null;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Link
          href="/"
          className="text-sm font-medium text-sky-700 hover:underline">
          ← Tổng quan
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {group}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {database}
            </h1>
            {source ? (
              <p className="mt-1 text-sm text-slate-600">
                {source.host}:{source.port}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Làm mới
            </button>
            <Link
              href={`/config?category=${configCategory}`}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Sửa cấu hình nguồn
            </Link>
          </div>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {loading && !source ? (
          <p className="mt-6 text-sm text-slate-600">Đang tải...</p>
        ) : (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">Reachability</dt>
              <dd className="mt-1">
                {source ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${reachabilityClass(
                      source.reachability,
                    )}`}>
                    {source.reachability}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">Không tìm thấy source</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Watermark</dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-900">
                {watermark ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Runs liên quan</dt>
              <dd className="mt-1 text-sm text-slate-900">{relatedRuns.length}</dd>
            </div>
          </dl>
        )}

        {source?.reason ? (
          <p className="mt-4 text-sm text-amber-700">{source.reason}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Lịch sử gần đây</h2>
        {relatedRuns.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Chưa có run nào ghi nhận database này trong 50 lần gần nhất.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {relatedRuns.map((run) => {
              const dbRow = run.databases?.find(
                (row) =>
                  row.database === database && row.sourceGroup === group,
              );
              return (
                <article
                  key={run.runId}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {run.runId}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatIsoAsLocalDateTime(run.startedAt)} · {run.mode} ·{' '}
                        {run.trigger}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${backupRunStatusClass(
                          run.status,
                        )}`}>
                        {backupRunStatusLabel(run.status)}
                      </span>
                      {dbRow ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${databaseRunStatusClass(
                            dbRow.status,
                          )}`}>
                          db: {dbRow.status}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/runs/${encodeURIComponent(run.runId)}`}
                    className="mt-3 inline-block text-sm font-medium text-sky-700 hover:underline">
                    Xem chi tiết run
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Restore plan</h2>
            <p className="mt-1 text-sm text-slate-600">
              Kế hoạch khôi phục (chỉ xem, không thực thi).
            </p>
          </div>
          <button
            type="button"
            disabled={planLoading}
            onClick={() => void loadRestorePlan()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {planLoading ? 'Đang tải...' : 'Tải lại plan'}
          </button>
        </div>

        {planError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {planError}
          </p>
        ) : null}

        {plan ? (
          <div className="mt-4 space-y-3">
            {plan.notes.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {plan.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {plan.steps.length === 0 ? (
              <p className="text-sm text-slate-500">Không có bước restore.</p>
            ) : (
              <ol className="space-y-2">
                {plan.steps.map((step) => (
                  <li
                    key={`${step.order}-${step.runId}-${step.relativePath}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-900">
                      #{step.order} · {step.kind} · {step.runId}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-slate-600">
                      {step.absolutePath || step.relativePath}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : !planLoading && !planError ? (
          <p className="mt-4 text-sm text-slate-500">Chưa có plan.</p>
        ) : null}
      </div>
    </section>
  );
}
