import { getPublicApiBaseUrl } from 'src/config/public-api';
import type { WallboardOverview } from 'src/types/wallboard';
import { apiGet } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export async function fetchPublicOverview(): Promise<WallboardOverview> {
  const data = await apiGet<WallboardOverview>({
    api: apiBase,
    endPoint: '/public/backup/overview',
  });

  return {
    ...data,
    schedule: {
      enabled: data.schedule?.enabled ?? data.scheduleEnabled ?? null,
      nextIncrementalAt: data.schedule?.nextIncrementalAt ?? null,
      nextFullAt: data.schedule?.nextFullAt ?? null,
      nextFullLabel: data.schedule?.nextFullLabel ?? null,
      nextIncrementalDatabases:
        data.schedule?.nextIncrementalDatabases ?? [],
      nextFullDatabases: data.schedule?.nextFullDatabases ?? [],
      nextFullGroups: data.schedule?.nextFullGroups ?? [],
    },
    activeJob: data.activeJob ?? null,
    databases: (data.databases ?? []).map((db) => ({
      ...db,
      lagMinutes: db.lagMinutes ?? null,
      lagState: db.lagState ?? 'no_data',
    })),
    freshness: {
      healthy: data.freshness?.healthy ?? true,
      lastSuccessAt: data.freshness?.lastSuccessAt ?? null,
      maxAgeHours: data.freshness?.maxAgeHours ?? 0,
      ageHours: data.freshness?.ageHours ?? null,
    },
    jobSummary: {
      ok: data.jobSummary?.ok ?? 0,
      error: data.jobSummary?.error ?? 0,
      partial: data.jobSummary?.partial ?? 0,
      running: data.jobSummary?.running ?? 0,
      total: data.jobSummary?.total ?? 0,
    },
    recentJobs: data.recentJobs ?? [],
    zones: {
      primaryExists: data.zones?.primaryExists ?? false,
      lockHeld: data.zones?.lockHeld ?? false,
      runCount: data.zones?.runCount ?? 0,
      isolatedConfigured: data.zones?.isolatedConfigured ?? false,
      freeHint: data.zones?.freeHint ?? null,
    },
    disk: data.disk
      ? {
          ...data.disk,
          folders: data.disk.folders ?? [],
          forecast: data.disk.forecast ?? null,
        }
      : null,
    historyByDay: (data.historyByDay ?? []).map((day) => ({
      ...day,
      ok: day.ok ?? 0,
      error: day.error ?? 0,
      partial: day.partial ?? 0,
      running: day.running ?? 0,
      bytesWritten: day.bytesWritten ?? 0,
      durationSecAvg: day.durationSecAvg ?? null,
      rowCountTotal: day.rowCountTotal ?? 0,
    })),
  };
}
