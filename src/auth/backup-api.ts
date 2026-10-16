import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  BackupRun,
  BackupSource,
  BackupZones,
  RestorePlan,
  TriggerBackupRunOptions,
  TriggerBackupRunResult,
} from 'src/types/backup';
import { apiGet, apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

function withToken(token: string) {
  return { api: apiBase, token };
}

export function fetchBackupRuns(
  token: string,
  limit = 50,
): Promise<BackupRun[]> {
  return apiGet<BackupRun[]>({
    ...withToken(token),
    endPoint: '/admin/backup/runs',
    params: { limit },
  });
}

export function fetchBackupRun(token: string, runId: string): Promise<BackupRun> {
  return apiGet<BackupRun>({
    ...withToken(token),
    endPoint: `/admin/backup/runs/${encodeURIComponent(runId)}`,
  });
}

export function triggerBackupRun(
  token: string,
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
    ...withToken(token),
    endPoint: '/admin/backup/runs',
    params: {
      mode,
      groups,
      databases,
    },
  });
}

export function fetchBackupSources(token: string): Promise<BackupSource[]> {
  return apiGet<BackupSource[]>({
    ...withToken(token),
    endPoint: '/admin/backup/sources',
  });
}

export function fetchBackupZones(token: string): Promise<BackupZones> {
  return apiGet<BackupZones>({
    ...withToken(token),
    endPoint: '/admin/backup/zones',
  });
}

export function fetchRestorePlan(
  token: string,
  database = 'produce',
): Promise<RestorePlan> {
  return apiGet<RestorePlan>({
    ...withToken(token),
    endPoint: '/admin/backup/restore-plan',
    params: { database },
  });
}
