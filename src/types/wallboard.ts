import type {
  BackupMode,
  BackupRunStatus,
  BackupTrigger,
  DatabaseRunStatus,
  SourceGroup,
  SourceReachability,
} from './backup';

export type WallboardDatabase = {
  group: SourceGroup;
  database: string;
  host: string;
  live: boolean;
  reachability: SourceReachability;
  reason: string | null;
  lastDbStatus: DatabaseRunStatus | null;
  lastRunStatus: BackupRunStatus | null;
  lastStartedAt: string | null;
  watermark: string | null;
  /** Minutes since lastStartedAt (backup freshness lag). */
  lagMinutes: number | null;
};

export type WallboardJobSummary = {
  ok: number;
  error: number;
  partial: number;
  running: number;
  total: number;
};

export type WallboardHistoryDay = {
  date: string;
  ok: number;
  error: number;
  partial: number;
  running: number;
  bytesWritten?: number;
  durationSecAvg?: number | null;
  rowCountTotal?: number;
};

export type WallboardRecentJob = {
  runId: string;
  status: BackupRunStatus;
  mode: BackupMode;
  trigger: BackupTrigger;
  startedAt: string;
  finishedAt: string | null;
  queuedAt: string | null;
  sourceGroups: string | null;
  databasesFilter: string | null;
  error: string | null;
};

export type WallboardDiskFolder = {
  id: string;
  label: string;
  bytes: number;
};

export type WallboardDiskForecast = {
  dailyGrowthBytes: number | null;
  compressionRatio: number | null;
  compressionSavingsPercent: number | null;
  estimatedDaysUntilFull: number | null;
};

export type WallboardDisk = {
  path: string;
  exists: boolean;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  availableBytes: number;
  usedPercent: number;
  folders: WallboardDiskFolder[];
  forecast?: WallboardDiskForecast | null;
};

export type WallboardActiveJob = {
  runId: string;
  mode: BackupMode;
  status: BackupRunStatus;
  startedAt: string | null;
  percent: number;
  rowsProcessed: number;
  estimatedRowsTotal: number | null;
  bytesProcessed: number;
  rowsPerSec: number;
  bytesPerSec: number;
  etaSeconds: number | null;
  currentDatabase: string | null;
  currentTable: string | null;
};

export type WallboardScheduleTarget = {
  group: SourceGroup;
  database: string;
};

export type WallboardSchedule = {
  enabled: boolean | null;
  nextIncrementalAt: string | null;
  nextFullAt: string | null;
  nextFullLabel: string | null;
  nextIncrementalDatabases?: WallboardScheduleTarget[];
  nextFullDatabases?: WallboardScheduleTarget[];
  nextFullGroups?: SourceGroup[];
};

export type WallboardOverview = {
  generatedAt: string;
  scheduleEnabled: boolean | null;
  schedule: WallboardSchedule;
  freshness: {
    healthy: boolean;
    lastSuccessAt: string | null;
    maxAgeHours: number;
    ageHours: number | null;
  };
  databases: WallboardDatabase[];
  activeJob: WallboardActiveJob | null;
  jobSummary: WallboardJobSummary;
  historyByDay: WallboardHistoryDay[];
  recentJobs: WallboardRecentJob[];
  zones: {
    primaryExists: boolean;
    lockHeld: boolean;
    runCount: number;
    isolatedConfigured: boolean;
    freeHint: string | null;
  };
  disk: WallboardDisk | null;
};
