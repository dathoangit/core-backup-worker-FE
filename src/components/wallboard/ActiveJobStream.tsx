import { useTranslation } from 'react-i18next';
import type { BackupRunProgressEvent } from 'src/types/backup-stream';
import type { WallboardActiveJob } from 'src/types/wallboard';
import {
  formatBytesPerSec,
  formatBytesShort,
  formatCompactCount,
  formatEta,
  formatRowsPerSec,
} from './wallboard-format';

type ActiveJobStreamProps = {
  overviewJob: WallboardActiveJob | null;
  liveProgress: BackupRunProgressEvent | null;
  liveStatus?: string | null;
  finishedAt?: string | null;
  /** Compact strip when idle / side panel. */
  compact?: boolean;
};

const COMPLETED_OK = new Set(['ok', 'partial']);
const FINISHED = new Set(['ok', 'partial', 'error', 'cancelled']);

function durationLabel(
  startedAt: string | null | undefined,
  finishedAt: string | null | undefined,
): string {
  if (!startedAt || !finishedAt) {
    return '—';
  }

  const started = new Date(startedAt).getTime();
  const finished = new Date(finishedAt).getTime();

  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) {
    return '—';
  }

  return formatEta(Math.round((finished - started) / 1000));
}

function mergeJob(
  overviewJob: WallboardActiveJob | null,
  liveProgress: BackupRunProgressEvent | null,
  liveStatus?: string | null,
): WallboardActiveJob | null {
  if (!overviewJob && !liveProgress) {
    return null;
  }

  if (!overviewJob && liveProgress) {
    const status =
      liveStatus === 'ok' ||
      liveStatus === 'partial' ||
      liveStatus === 'error' ||
      liveStatus === 'cancelled' ||
      liveStatus === 'running' ||
      liveStatus === 'queued'
        ? liveStatus
        : 'running';
    const completedOk = COMPLETED_OK.has(status);
    const percent = completedOk ? 100 : liveProgress.percent;
    const rowsProcessed = liveProgress.rowsTotal;
    return {
      runId: liveProgress.runId,
      mode: 'incremental',
      status,
      startedAt: liveProgress.startedAt ?? null,
      percent,
      rowsProcessed,
      estimatedRowsTotal:
        percent > 0
          ? Math.max(rowsProcessed, Math.round(rowsProcessed / (percent / 100)))
          : null,
      bytesProcessed: liveProgress.bytesTotal,
      rowsPerSec: completedOk ? 0 : (liveProgress.rowsPerSec ?? 0),
      bytesPerSec: completedOk ? 0 : (liveProgress.bytesPerSec ?? 0),
      etaSeconds: completedOk ? 0 : (liveProgress.etaSeconds ?? null),
      currentDatabase: liveProgress.database,
      currentTable: liveProgress.currentTable ?? null,
    };
  }

  if (
    !liveProgress ||
    (overviewJob && liveProgress.runId !== overviewJob.runId)
  ) {
    if (!overviewJob) {
      return null;
    }

    if (COMPLETED_OK.has(overviewJob.status)) {
      return {
        ...overviewJob,
        percent: 100,
        etaSeconds: 0,
      };
    }

    return overviewJob;
  }

  const status = liveStatus ?? overviewJob!.status;
  const completedOk = COMPLETED_OK.has(status);
  const percent = completedOk ? 100 : liveProgress.percent;
  const rowsProcessed = liveProgress.rowsTotal;
  return {
    ...overviewJob!,
    status: status as WallboardActiveJob['status'],
    percent,
    rowsProcessed,
    estimatedRowsTotal:
      percent > 0
        ? Math.max(rowsProcessed, Math.round(rowsProcessed / (percent / 100)))
        : overviewJob!.estimatedRowsTotal,
    bytesProcessed: liveProgress.bytesTotal,
    rowsPerSec: completedOk ? 0 : (liveProgress.rowsPerSec ?? overviewJob!.rowsPerSec),
    bytesPerSec: completedOk
      ? 0
      : (liveProgress.bytesPerSec ?? overviewJob!.bytesPerSec),
    etaSeconds: completedOk
      ? 0
      : (liveProgress.etaSeconds ?? overviewJob!.etaSeconds),
    currentDatabase: liveProgress.database ?? overviewJob!.currentDatabase,
    currentTable: liveProgress.currentTable ?? overviewJob!.currentTable,
    startedAt: liveProgress.startedAt ?? overviewJob!.startedAt,
  };
}

function statusLabel(
  status: string,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'ok':
      return t('activeJob.statusOk');
    case 'partial':
      return t('activeJob.statusPartial');
    case 'error':
      return t('activeJob.statusError');
    case 'cancelled':
      return t('activeJob.statusCancelled');
    default:
      return status;
  }
}

function statusValueClass(status: string): string {
  switch (status) {
    case 'ok':
      return 'text-emerald-700';
    case 'partial':
      return 'text-amber-700';
    case 'error':
      return 'text-red-700';
    default:
      return 'text-slate-700';
  }
}

export function ActiveJobStream({
  overviewJob,
  liveProgress,
  liveStatus = null,
  finishedAt = null,
  compact = false,
}: ActiveJobStreamProps) {
  const { t } = useTranslation('wallboard');
  const job = mergeJob(overviewJob, liveProgress, liveStatus);

  if (!job) {
    return (
      <div
        className={`flex h-full items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 ${
          compact ? 'py-2' : 'justify-center py-4'
        }`}>
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-400" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700">
            {t('activeJob.idleTitle')}
          </p>
          <p className="truncate text-[10px] text-slate-500">
            {t('activeJob.idleHint')}
          </p>
        </div>
      </div>
    );
  }

  const finished = FINISHED.has(job.status);
  const completedOk = COMPLETED_OK.has(job.status);
  const percent = completedOk
    ? 100
    : Math.max(0, Math.min(100, job.percent));
  const totalLabel = job.estimatedRowsTotal
    ? formatCompactCount(job.estimatedRowsTotal)
    : '?';
  const statusClass = statusValueClass(job.status);
  const barClass =
    job.status === 'error'
      ? 'bg-red-500'
      : job.status === 'partial'
        ? 'bg-amber-500'
        : completedOk
          ? 'bg-emerald-500'
          : 'bg-sky-500';
  const resolvedFinishedAt = finishedAt ?? job.finishedAt ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {job.mode} · {job.runId}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {job.currentDatabase ?? '—'}
          {!finished && job.currentTable ? ` · ${job.currentTable}` : ''}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            {finished
              ? t(completedOk ? 'activeJob.completed' : 'activeJob.stopped')
              : t('activeJob.progress')}
          </span>
          <span className="font-semibold tabular-nums text-slate-900">
            {percent}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClass}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        {finished ? (
          <>
            <Metric
              label={t('activeJob.status')}
              value={statusLabel(job.status, t)}
              valueClassName={statusClass}
            />
            <Metric
              label={t('activeJob.rowsTotal')}
              value={formatCompactCount(job.rowsProcessed)}
            />
            <Metric
              label={t('activeJob.volume')}
              value={formatBytesShort(job.bytesProcessed)}
            />
            <Metric
              label={t('activeJob.duration')}
              value={durationLabel(job.startedAt, resolvedFinishedAt)}
            />
          </>
        ) : (
          <>
            <Metric
              label={t('activeJob.speed')}
              value={formatRowsPerSec(job.rowsPerSec)}
            />
            <Metric
              label={t('activeJob.diskIo')}
              value={formatBytesPerSec(job.bytesPerSec)}
            />
            <Metric
              label={t('activeJob.rows')}
              value={t('activeJob.rowsProgress', {
                processed: formatCompactCount(job.rowsProcessed),
                total: totalLabel,
              })}
            />
            <Metric
              label={t('activeJob.eta')}
              value={formatEta(job.etaSeconds)}
              emphasize
            />
          </>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
  valueClassName,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p
        className={`truncate font-semibold tabular-nums ${
          valueClassName ?? (emphasize ? 'text-sky-700' : 'text-slate-900')
        }`}>
        {value}
      </p>
    </div>
  );
}
