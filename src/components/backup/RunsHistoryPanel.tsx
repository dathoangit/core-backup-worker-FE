import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchBackupRuns,
  fetchBackupZones,
  triggerBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings } from 'src/auth/settings-api';
import { BackupOverviewCards } from 'src/components/admin/backup/BackupOverviewCards';
import { BackupRunsTable } from 'src/components/admin/backup/BackupRunsTable';
import { BackupZonesPanel } from 'src/components/admin/backup/BackupZonesPanel';
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
  const { accessToken, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextRuns, nextZones, backupSettings] = await Promise.all([
        fetchBackupRuns(accessToken, 50),
        fetchBackupZones(accessToken),
        fetchSettings(accessToken, 'backup'),
      ]);

      setRuns(nextRuns);
      setZones(nextZones);

      const scheduleSetting = backupSettings.find(
        (row) => row.key === SETTING_SCHEDULE_ENABLED_KEY,
      );
      setScheduleEnabled(
        scheduleSetting ? isTruthySetting(scheduleSetting.value) : null,
      );
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasRunningRun = runs.some((run) => run.status === 'running');

  useEffect(() => {
    if (!hasRunningRun || !accessToken || role !== 'admin') {
      return;
    }

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const nextRuns = await fetchBackupRuns(accessToken, 50);
          setRuns(nextRuns);
        } catch {
          // Keep current list.
        }
      })();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [accessToken, hasRunningRun, role]);

  const handleTrigger = async (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => {
    if (!accessToken) {
      return;
    }

    setTriggering(true);
    setError(null);

    try {
      await triggerBackupRun(accessToken, options);
      await load();
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Lịch sử backup
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi runs và kích hoạt backup thủ công.
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
        {loading && runs.length === 0 ? (
          <p className="text-sm text-slate-600">Đang tải runs...</p>
        ) : (
          <BackupRunsTable
            runs={runs}
            triggering={triggering}
            onTrigger={handleTrigger}
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
