export type SourceGroup = 'HIS' | 'EMR' | 'BADL' | 'LIS' | 'PACS';

export type BackupMode = 'incremental' | 'full';

export type BackupTrigger = 'cron' | 'manual';

export type BackupRunStatus = 'running' | 'ok' | 'partial' | 'error';

export type BackupProfile = 'adempiere' | 'envers' | 'snapshot';

export type DatabaseRunStatus = 'ok' | 'error' | 'skipped';

export type SourceReachability = 'ready' | 'unreachable' | 'unconfigured' | string;

export type BackupDatabaseRun = {
  id?: string;
  runId: string;
  sourceGroup: SourceGroup;
  database: string;
  profile: BackupProfile;
  status: DatabaseRunStatus;
  watermarkBefore?: string | null;
  captured?: string | null;
  watermarkAfter?: string | null;
  chunkCount?: number;
  bytesTotal?: string | number;
  rowCountTotal?: string | number;
  skippedTableCount?: number;
  error?: string | null;
};

export type BackupRun = {
  id?: string;
  runId: string;
  startedAt: string;
  finishedAt?: string | null;
  status: BackupRunStatus;
  trigger: BackupTrigger;
  mode: BackupMode;
  backupDir?: string;
  error?: string | null;
  archiveStatus?: string | null;
  databases?: BackupDatabaseRun[];
};

export type TriggerBackupRunResult = {
  runId: string;
  status: 'accepted';
  message: string;
  mode: BackupMode;
};

export type TriggerBackupRunOptions = {
  mode?: BackupMode;
  groups?: SourceGroup[];
  /** Optional database name filter (CSV on the wire). */
  databases?: string[];
};

export type BackupSource = {
  group: SourceGroup;
  host: string;
  port: number;
  databases: string[];
  reachability: SourceReachability;
  reason?: string | null;
  watermarks: Record<string, string | null>;
};

export type PrimaryZoneStatus = {
  backupDir: string;
  volumes?: {
    meta: string;
    his: string;
    emr: string;
    lis?: string;
  };
  exists: boolean;
  lockHeld: boolean;
  lockPid: number | null;
  runCount: number;
  stateDatabases: string[];
  freeHint: string | null;
};

export type BackupZones = {
  primary: PrimaryZoneStatus;
  isolatedCopy: {
    target: string;
    configured: boolean;
  };
};

export type RestorePlanStepKind = 'full' | 'append' | 'cdc' | 'snapshot';

export type RestorePlanStep = {
  order: number;
  kind: RestorePlanStepKind;
  runId: string;
  relativePath: string;
  absolutePath: string;
};

export type RestorePlan = {
  database: string;
  steps: RestorePlanStep[];
  notes: string[];
};
