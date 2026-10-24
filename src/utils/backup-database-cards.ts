import i18n from 'src/i18n';
import type {
  BackupDatabaseRun,
  BackupRun,
  BackupSource,
  DatabaseRunStatus,
  SourceGroup,
  SourceReachability,
} from 'src/types/backup';

export function unconfiguredDatabasePlaceholder(): string {
  return i18n.t('home:databases.unconfiguredPlaceholder');
}

export function isUnconfiguredDatabaseName(database: string): boolean {
  return database === unconfiguredDatabasePlaceholder();
}

export type DatabaseCardModel = {
  group: SourceGroup;
  database: string;
  host: string;
  port: number;
  reachability: SourceReachability;
  reason?: string | null;
  watermark: string | null;
  lastRunId: string | null;
  lastRunStatus: BackupRun['status'] | null;
  lastDbStatus: DatabaseRunStatus | null;
  lastStartedAt: string | null;
};

function findLatestDbRun(
  runs: BackupRun[],
  group: SourceGroup,
  database: string,
): { run: BackupRun; db: BackupDatabaseRun } | null {
  for (const run of runs) {
    const db = run.databases?.find(
      (row) => row.database === database && row.sourceGroup === group,
    );
    if (db) {
      return { run, db };
    }
  }
  return null;
}

/** Flatten source inventory into one card per database, enriched with latest run info. */
export function buildDatabaseCards(
  sources: BackupSource[],
  runs: BackupRun[],
): DatabaseCardModel[] {
  const cards: DatabaseCardModel[] = [];

  for (const source of sources) {
    for (const database of source.databases) {
      const latest = findLatestDbRun(runs, source.group, database);
      cards.push({
        group: source.group,
        database,
        host: source.host,
        port: source.port,
        reachability: source.reachability,
        reason: source.reason,
        watermark: source.watermarks[database] ?? null,
        lastRunId: latest?.run.runId ?? null,
        lastRunStatus: latest?.run.status ?? null,
        lastDbStatus: latest?.db.status ?? null,
        lastStartedAt: latest?.run.startedAt ?? null,
      });
    }

    // Unconfigured sources may have empty databases — still show the group once.
    if (source.databases.length === 0) {
      cards.push({
        group: source.group,
        database: unconfiguredDatabasePlaceholder(),
        host: source.host || '—',
        port: source.port || 0,
        reachability: source.reachability,
        reason: source.reason,
        watermark: null,
        lastRunId: null,
        lastRunStatus: null,
        lastDbStatus: null,
        lastStartedAt: null,
      });
    }
  }

  return cards;
}

export function groupToSettingCategory(
  group: SourceGroup,
): 'his' | 'emr' | 'badl' | 'lis' | 'backup' {
  switch (group) {
    case 'HIS':
      return 'his';
    case 'EMR':
      return 'emr';
    case 'BADL':
      return 'badl';
    case 'LIS':
      return 'lis';
    default:
      return 'backup';
  }
}

export function databaseDetailHref(group: SourceGroup, database: string): string {
  return `/databases/${encodeURIComponent(group)}/${encodeURIComponent(database)}`;
}
