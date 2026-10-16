import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchBackupRuns,
  fetchBackupSources,
  fetchBackupZones,
  fetchRestorePlan,
  triggerBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings } from 'src/auth/settings-api';
import type {
  BackupMode,
  BackupRun,
  BackupSource,
  BackupZones,
  RestorePlan,
  SourceGroup,
} from 'src/types/backup';
import {
  SETTING_SCHEDULE_ENABLED_KEY,
} from 'src/types/settings';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import { BackupOverviewCards } from './BackupOverviewCards';
import { BackupRunsTable } from './BackupRunsTable';
import { BackupSourcesPanel } from './BackupSourcesPanel';
import { BackupZonesPanel } from './BackupZonesPanel';
import { RestorePlanPanel } from './RestorePlanPanel';

type BackupTab = 'runs' | 'sources' | 'zones' | 'restore';

const TABS: Array<{ id: BackupTab; label: string }> = [
  { id: 'runs', label: 'Runs' },
  { id: 'sources', label: 'Sources' },
  { id: 'zones', label: 'Zones' },
  { id: 'restore', label: 'Restore plan' },
];

function isTruthySetting(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function BackupAdminPanel() {
  const { accessToken, role } = useAuth();
  const [tab, setTab] = useState<BackupTab>('runs');
  const [loading, setLoading] = useState(true);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [sources, setSources] = useState<BackupSource[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);

  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPanelError(null);

    try {
      const [nextRuns, nextSources, nextZones, backupSettings] =
        await Promise.all([
          fetchBackupRuns(accessToken, 50),
          fetchBackupSources(accessToken),
          fetchBackupZones(accessToken),
          fetchSettings(accessToken, 'backup'),
        ]);

      setRuns(nextRuns);
      setSources(nextSources);
      setZones(nextZones);

      const scheduleSetting = backupSettings.find(
        (row) => row.key === SETTING_SCHEDULE_ENABLED_KEY,
      );
      setScheduleEnabled(
        scheduleSetting ? isTruthySetting(scheduleSetting.value) : null,
      );
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [accessToken, role]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

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
          // Keep current list; next manual refresh can surface the error.
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
    setPanelError(null);

    try {
      await triggerBackupRun(accessToken, options);
      await loadCore();
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      setTriggering(false);
    }
  };

  const handleLoadRestorePlan = async (database: string) => {
    if (!accessToken) {
      return;
    }

    setRestoreLoading(true);
    setRestoreError(null);

    try {
      const plan = await fetchRestorePlan(accessToken, database);
      setRestorePlan(plan);
    } catch (error) {
      setRestorePlan(null);
      setRestoreError(resolveApiErrorMessage(error));
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Quản lý backup
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Theo dõi runs, sources, zones và kích hoạt backup thủ công.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCore()}
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

        {panelError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {panelError}
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
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === item.id
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loading && tab !== 'restore' ? (
            <p className="text-sm text-slate-600">Đang tải...</p>
          ) : null}

          {tab === 'runs' && !loading ? (
            <BackupRunsTable
              runs={runs}
              triggering={triggering}
              onTrigger={handleTrigger}
            />
          ) : null}

          {tab === 'sources' && !loading ? (
            <BackupSourcesPanel sources={sources} />
          ) : null}

          {tab === 'zones' && !loading ? (
            <BackupZonesPanel zones={zones} />
          ) : null}

          {tab === 'restore' ? (
            <RestorePlanPanel
              plan={restorePlan}
              loading={restoreLoading}
              error={restoreError}
              onLoad={handleLoadRestorePlan}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
