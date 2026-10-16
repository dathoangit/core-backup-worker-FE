import type { BackupRunStatus, DatabaseRunStatus, SourceReachability } from 'src/types/backup';

export function backupRunStatusClass(status: BackupRunStatus | string): string {
  switch (status) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700';
    case 'running':
      return 'bg-sky-50 text-sky-700';
    case 'partial':
      return 'bg-amber-50 text-amber-700';
    case 'error':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function backupRunStatusLabel(status: BackupRunStatus | string): string {
  switch (status) {
    case 'ok':
      return 'OK';
    case 'running':
      return 'Đang chạy';
    case 'partial':
      return 'Một phần';
    case 'error':
      return 'Lỗi';
    default:
      return status;
  }
}

export function databaseRunStatusClass(status: DatabaseRunStatus | string): string {
  switch (status) {
    case 'ok':
      return 'bg-emerald-50 text-emerald-700';
    case 'skipped':
      return 'bg-slate-100 text-slate-600';
    case 'error':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function reachabilityClass(reachability: SourceReachability): string {
  switch (reachability) {
    case 'ready':
      return 'bg-emerald-50 text-emerald-700';
    case 'unconfigured':
      return 'bg-slate-100 text-slate-600';
    case 'unreachable':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

export function formatBytes(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(n) || n < 0) {
    return String(value);
  }

  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  if (n < 1024 * 1024 * 1024) {
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
