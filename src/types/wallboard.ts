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
};

export type WallboardRecentJob = {
  runId: string;
  status: BackupRunStatus;
  mode: BackupMode;
  trigger: BackupTrigger;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
};

export type WallboardDisk = {
  id: 'meta' | 'his' | 'emr';
  label: string;
  path: string;
  exists: boolean;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  availableBytes: number;
  usedPercent: number;
};

export type WallboardOverview = {
  generatedAt: string;
  scheduleEnabled: boolean | null;
  freshness: {
    healthy: boolean;
    lastSuccessAt: string | null;
    maxAgeHours: number;
    ageHours: number | null;
  };
  databases: WallboardDatabase[];
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
  disks: WallboardDisk[];
};
