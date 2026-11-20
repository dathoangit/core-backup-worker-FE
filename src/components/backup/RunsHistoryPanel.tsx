import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelBackupRun,
  fetchBackupRuns,
  resumeBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { BackupRunsTable } from 'src/components/admin/backup/BackupRunsTable';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type { BackupRun } from 'src/types/backup';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

export function RunsHistoryPanel() {
  const { t } = useTranslation(['runs', 'common', 'layout']);
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [resumingRunId, setResumingRunId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);

  const load = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const nextRuns = await fetchBackupRuns(50);
      setRuns(nextRuns);
      setError(null);
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  useBackupStream({
    enabled: role === 'admin',
    onOpen: () => {
      void load();
    },
    onStatus: (event) => {
      setRuns((prev) => {
        const index = prev.findIndex((run) => run.runId === event.runId);
        if (index < 0) {
          void load();
          return prev;
        }
        const next = [...prev];
        const status =
          event.status === 'cancelling' ? 'running' : event.status;
        next[index] = {
          ...next[index],
          status,
          error: event.error ?? next[index].error,
        };
        return next;
      });
    },
  });

  const handleCancel = async (runId: string) => {
    if (role !== 'admin') {
      return;
    }

    setCancellingRunId(runId);
    setError(null);
    setInfo(null);

    try {
      const result = await cancelBackupRun(runId);
      setInfo(
        result.status === 'cancelling'
          ? t('runs:info.cancelling', { runId })
          : t('runs:info.cancelled', { runId }),
      );
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setCancellingRunId(null);
    }
  };

  const handleResume = async (runId: string) => {
    if (role !== 'admin') {
      return;
    }

    setResumingRunId(runId);
    setError(null);
    setInfo(null);

    try {
      const result = await resumeBackupRun(runId);
      setInfo(t('runs:info.resumed', { runId: result.runId }));
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setResumingRunId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {t('runs:page.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {t('runs:page.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('common:actions.refresh')}
            </button>
            <Link
              href="/jobs"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('layout:nav.jobs')}
            </Link>
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

        <div className="mt-6">
          {loading && runs.length === 0 ? (
            <p className="text-sm text-slate-600">{t('runs:loading.runs')}</p>
          ) : (
            <BackupRunsTable
              runs={runs}
              cancellingRunId={cancellingRunId}
              resumingRunId={resumingRunId}
              onCancel={handleCancel}
              onResume={handleResume}
            />
          )}
        </div>
      </div>
    </section>
  );
}
