import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelBackupRun,
  fetchBackupRuns,
  fetchBackupZones,
  triggerBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings } from 'src/auth/settings-api';
import { BackupOverviewCards } from 'src/components/admin/backup/BackupOverviewCards';
import { BackupQueuePanel } from 'src/components/admin/backup/BackupQueuePanel';
import { BackupRunsTable } from 'src/components/admin/backup/BackupRunsTable';
import { BackupZonesPanel } from 'src/components/admin/backup/BackupZonesPanel';
import { RunProgressBar } from 'src/components/backup/RunProgressBar';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type {
  BackupMode,
  BackupRun,
  BackupZones,
  SourceGroup,
} from 'src/types/backup';
import { SETTING_SCHEDULE_ENABLED_KEY } from 'src/types/settings';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

function isTruthySetting(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function RunsHistoryPanel() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);
  const [queueRefreshKey, setQueueRefreshKey] = useState(0);

  const load = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const [nextRuns, nextZones, backupSettings] = await Promise.all([
        fetchBackupRuns(50),
        fetchBackupZones(),
        fetchSettings('backup'),
      ]);

      setRuns(nextRuns);
      setZones(nextZones);

      const scheduleSetting = backupSettings.find(
        (row) => row.key === SETTING_SCHEDULE_ENABLED_KEY,
      );
      setScheduleEnabled(
        scheduleSetting ? isTruthySetting(scheduleSetting.value) : null,
      );
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

  const { progressByRunId } = useBackupStream({
    enabled: role === 'admin',
    onOpen: () => {
      void load();
    },
    onStatus: (event) => {
      setQueueRefreshKey((key) => key + 1);
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

  const activeProgress = runs
    .filter((run) => run.status === 'running' || run.status === 'queued')
    .map((run) => progressByRunId[run.runId])
    .find(Boolean);

  const handleTrigger = async (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => {
    if (role !== 'admin') {
      return;
    }

    setTriggering(true);
    setError(null);
    setInfo(null);

    try {
      const result = await triggerBackupRun(options);
      setInfo(
        result.status === 'queued'
          ? `Đã xếp hàng job ${result.runId}`
          : result.message,
      );
      setQueueRefreshKey((key) => key + 1);
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setTriggering(false);
    }
  };

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
          ? `Đang hủy job ${runId}...`
          : `Đã hủy job ${runId}`,
      );
      setQueueRefreshKey((key) => key + 1);
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setCancellingRunId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Quản lý job backup
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Xếp hàng, theo dõi, và hủy job (BullMQ — tối đa 1 job chạy cùng lúc).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Làm mới
            </button>
            <Link
              href="/config"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cấu hình
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
          {loading && !zones ? (
            <p className="text-sm text-slate-600">Đang tải overview...</p>
          ) : (
            <BackupOverviewCards
              zones={zones}
              scheduleEnabled={scheduleEnabled}
            />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <BackupQueuePanel
          refreshKey={queueRefreshKey}
          onChanged={() => {
            void load();
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {activeProgress ? (
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <RunProgressBar progress={activeProgress} />
          </div>
        ) : null}
        {loading && runs.length === 0 ? (
          <p className="text-sm text-slate-600">Đang tải runs...</p>
        ) : (
          <BackupRunsTable
            runs={runs}
            triggering={triggering}
            cancellingRunId={cancellingRunId}
            onTrigger={handleTrigger}
            onCancel={handleCancel}
          />
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Zones</h2>
        <div className="mt-4">
          {loading && !zones ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : (
            <BackupZonesPanel zones={zones} />
          )}
        </div>
      </div>
    </section>
  );
}
