export type BackupStreamEventType =
  | 'run.status'
  | 'run.progress'
  | 'run.log'
  | 'heartbeat'
  | 'snapshot';

export type BackupRunStatusEvent = {
  type: 'run.status';
  runId: string;
  status:
    | 'queued'
    | 'running'
    | 'ok'
    | 'partial'
    | 'error'
    | 'cancelled'
    | 'cancelling';
  mode?: string;
  trigger?: string;
  error?: string | null;
  at: string;
};

export type BackupRunProgressEvent = {
  type: 'run.progress';
  runId: string;
  database: string | null;
  currentTable?: string | null;
  tablesDone: number;
  tablesTotal: number;
  databasesDone: number;
  databasesTotal: number;
  /** Cumulative rows processed so far (not a planned total). */
  rowsTotal: number;
  bytesTotal: number;
  rowsPerSec?: number;
  bytesPerSec?: number;
  etaSeconds?: number | null;
  startedAt?: string | null;
  percent: number;
  at: string;
};

export type BackupRunLogEvent = {
  type: 'run.log';
  runId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  at: string;
};

export type BackupSnapshotEvent = {
  type: 'snapshot';
  runId: string;
  status: BackupRunStatusEvent | null;
  progress: BackupRunProgressEvent | null;
  logs: BackupRunLogEvent[];
  at: string;
};

export type BackupHeartbeatEvent = {
  type: 'heartbeat';
  at: string;
};

export type BackupStreamEvent =
  | BackupRunStatusEvent
  | BackupRunProgressEvent
  | BackupRunLogEvent
  | BackupSnapshotEvent
  | BackupHeartbeatEvent;
