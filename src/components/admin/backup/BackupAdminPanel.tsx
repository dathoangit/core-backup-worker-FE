import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelBackupRun,
  fetchBackupRuns,
  fetchBackupSources,
  fetchBackupZones,
  fetchRestorePlan,
  triggerBackupRun,
} from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings } from 'src/auth/settings-api';
import { useBackupStream } from 'src/hooks/useBackupStream';
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

const TAB_IDS: BackupTab[] = ['runs', 'sources', 'zones', 'restore'];

function isTruthySetting(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function BackupAdminPanel() {
  const { t } = useTranslation(['runs', 'common', 'layout']);
  const { role } = useAuth();
  const [tab, setTab] = useState<BackupTab>('runs');
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);

  const [runs, setRuns] = useState<BackupRun[]>([]);
  const [sources, setSources] = useState<BackupSource[]>([]);
  const [zones, setZones] = useState<BackupZones | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean | null>(null);

  const [restorePlan, setRestorePlan] = useState<RestorePlan | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const [nextRuns, nextSources, nextZones, backupSettings] =
        await Promise.all([
          fetchBackupRuns(50),
          fetchBackupSources(),
          fetchBackupZones(),
          fetchSettings('backup'),
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
      setPanelError(null);
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  const hasActiveQueue = runs.some(
    (run) => run.status === 'running' || run.status === 'queued',
  );

  useBackupStream({
    enabled: role === 'admin' && hasActiveQueue,
    onOpen: () => {
      void loadCore();
    },
    onStatus: () => {
      void loadCore();
    },
  });

  const handleTrigger = async (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => {
    if (role !== 'admin') {
      return;
    }

    setTriggering(true);
    setPanelError(null);

    try {
      await triggerBackupRun(options);
      await loadCore();
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      setTriggering(false);
    }
  };

  const handleCancel = async (runId: string) => {
    if (role !== 'admin') {
      return;
    }

    setCancellingRunId(runId);
    setPanelError(null);

    try {
      await cancelBackupRun(runId);
      await loadCore();
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      setCancellingRunId(null);
    }
  };

  const handleLoadRestorePlan = async (database: string) => {
    if (role !== 'admin') {
      return;
    }

    setRestoreLoading(true);
    setRestoreError(null);

    try {
      const plan = await fetchRestorePlan(database);
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
              {t('runs:admin.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t('runs:admin.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadCore()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('common:actions.refresh')}
            </button>
            <Link
              href="/config"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {t('layout:nav.config')}
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
            <p className="text-sm text-slate-600">{t('runs:loading.overview')}</p>
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
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === id
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {t(`runs:admin.tabs.${id}`)}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {loading && tab !== 'restore' ? (
            <p className="text-sm text-slate-600">{t('common:loading.generic')}</p>
          ) : null}

          {tab === 'runs' && !loading ? (
            <BackupRunsTable
              runs={runs}
              triggering={triggering}
              cancellingRunId={cancellingRunId}
              onTrigger={handleTrigger}
              onCancel={handleCancel}
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
