import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  BackupQueueSnapshot,
  BackupRun,
  BackupSource,
  BackupZones,
  CancelAllQueuedResult,
  CancelBackupRunResult,
  RestorePlan,
  TriggerBackupRunOptions,
  TriggerBackupRunResult,
} from 'src/types/backup';
import { apiGet, apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function fetchBackupRuns(limit = 50): Promise<BackupRun[]> {
  return apiGet<BackupRun[]>({
    api: apiBase,
    endPoint: '/admin/backup/runs',
    params: { limit },
  });
}

export function fetchBackupRun(runId: string): Promise<BackupRun> {
  return apiGet<BackupRun>({
    api: apiBase,
    endPoint: `/admin/backup/runs/${encodeURIComponent(runId)}`,
  });
}

export function triggerBackupRun(
  options: TriggerBackupRunOptions = {},
): Promise<TriggerBackupRunResult> {
  const mode = options.mode ?? 'incremental';
  const groups =
    options.groups && options.groups.length > 0
      ? options.groups.join(',')
      : undefined;
  const databases =
    options.databases && options.databases.length > 0
      ? options.databases.join(',')
      : undefined;

  return apiPost<TriggerBackupRunResult>({
    api: apiBase,
    endPoint: '/admin/backup/runs',
    params: {
      mode,
      groups,
      databases,
    },
  });
}

export function cancelBackupRun(runId: string): Promise<CancelBackupRunResult> {
  return apiPost<CancelBackupRunResult>({
    api: apiBase,
    endPoint: `/admin/backup/runs/${encodeURIComponent(runId)}/cancel`,
  });
}

export function fetchBackupQueue(): Promise<BackupQueueSnapshot> {
  return apiGet<BackupQueueSnapshot>({
    api: apiBase,
    endPoint: '/admin/backup/queue',
  });
}

export function cancelAllQueuedBackupRuns(): Promise<CancelAllQueuedResult> {
  return apiPost<CancelAllQueuedResult>({
    api: apiBase,
    endPoint: '/admin/backup/queue/cancel-all-queued',
  });
}

export function fetchBackupSources(): Promise<BackupSource[]> {
  return apiGet<BackupSource[]>({
    api: apiBase,
    endPoint: '/admin/backup/sources',
  });
}

export function fetchBackupZones(): Promise<BackupZones> {
  return apiGet<BackupZones>({
    api: apiBase,
    endPoint: '/admin/backup/zones',
  });
}

export function fetchRestorePlan(database = 'produce'): Promise<RestorePlan> {
  return apiGet<RestorePlan>({
    api: apiBase,
    endPoint: '/admin/backup/restore-plan',
    params: { database },
  });
}
