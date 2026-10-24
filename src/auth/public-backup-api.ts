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
    disk: data.disk
      ? {
          ...data.disk,
          forecast: data.disk.forecast ?? null,
        }
      : null,
    historyByDay: (data.historyByDay ?? []).map((day) => ({
      ...day,
      bytesWritten: day.bytesWritten ?? 0,
      durationSecAvg: day.durationSecAvg ?? null,
      rowCountTotal: day.rowCountTotal ?? 0,
    })),
  };
}
