import type { BackupRunProgressEvent } from 'src/types/backup-stream';
import type { WallboardActiveJob } from 'src/types/wallboard';
import {
  formatBytesPerSec,
  formatCompactCount,
  formatEta,
  formatRowsPerSec,
} from './wallboard-format';

type ActiveJobStreamProps = {
  overviewJob: WallboardActiveJob | null;
  liveProgress: BackupRunProgressEvent | null;
  /** Compact strip when idle / side panel. */
  compact?: boolean;
};

function mergeJob(
  overviewJob: WallboardActiveJob | null,
  liveProgress: BackupRunProgressEvent | null,
): WallboardActiveJob | null {
  if (!overviewJob && !liveProgress) {
    return null;
  }

  if (!overviewJob && liveProgress) {
    const percent = liveProgress.percent;
    const rowsProcessed = liveProgress.rowsTotal;
    return {
      runId: liveProgress.runId,
      mode: 'incremental',
      status: 'running',
      startedAt: liveProgress.startedAt ?? null,
      percent,
      rowsProcessed,
      estimatedRowsTotal:
        percent > 0
          ? Math.max(rowsProcessed, Math.round(rowsProcessed / (percent / 100)))
          : null,
      bytesProcessed: liveProgress.bytesTotal,
      rowsPerSec: liveProgress.rowsPerSec ?? 0,
      bytesPerSec: liveProgress.bytesPerSec ?? 0,
      etaSeconds: liveProgress.etaSeconds ?? null,
      currentDatabase: liveProgress.database,
      currentTable: liveProgress.currentTable ?? null,
    };
  }

  if (!liveProgress || (overviewJob && liveProgress.runId !== overviewJob.runId)) {
    return overviewJob;
  }

  const percent = liveProgress.percent;
  const rowsProcessed = liveProgress.rowsTotal;
  return {
    ...overviewJob!,
    percent,
    rowsProcessed,
    estimatedRowsTotal:
      percent > 0
        ? Math.max(rowsProcessed, Math.round(rowsProcessed / (percent / 100)))
        : overviewJob!.estimatedRowsTotal,
    bytesProcessed: liveProgress.bytesTotal,
    rowsPerSec: liveProgress.rowsPerSec ?? overviewJob!.rowsPerSec,
    bytesPerSec: liveProgress.bytesPerSec ?? overviewJob!.bytesPerSec,
    etaSeconds: liveProgress.etaSeconds ?? overviewJob!.etaSeconds,
    currentDatabase: liveProgress.database ?? overviewJob!.currentDatabase,
    currentTable: liveProgress.currentTable ?? overviewJob!.currentTable,
    startedAt: liveProgress.startedAt ?? overviewJob!.startedAt,
  };
}

export function ActiveJobStream({
  overviewJob,
  liveProgress,
  compact = false,
}: ActiveJobStreamProps) {
  const job = mergeJob(overviewJob, liveProgress);
  const running = Boolean(job && job.status === 'running');

  if (!running) {
    return (
      <div
        className={`flex h-full items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 ${
          compact ? 'py-2' : 'justify-center py-4'
        }`}>
        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-slate-400" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700">Idle — không có job RUNNING</p>
          <p className="truncate text-[10px] text-slate-500">
            Progress / rows/s / ETA hiện khi backup chạy
          </p>
        </div>
      </div>
    );
  }

  const percent = Math.max(0, Math.min(100, job!.percent));
  const totalLabel = job!.estimatedRowsTotal
    ? formatCompactCount(job!.estimatedRowsTotal)
    : '?';

  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {job!.mode} · {job!.runId}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {job!.currentDatabase ?? '—'}
          {job!.currentTable ? ` · ${job!.currentTable}` : ''}
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Progress</span>
          <span className="font-semibold tabular-nums text-slate-900">
            {percent}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <Metric label="Speed" value={formatRowsPerSec(job!.rowsPerSec)} />
        <Metric label="Disk I/O" value={formatBytesPerSec(job!.bytesPerSec)} />
        <Metric
          label="Rows"
          value={`${formatCompactCount(job!.rowsProcessed)} / ${totalLabel}`}
        />
        <Metric label="ETA" value={formatEta(job!.etaSeconds)} emphasize />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p
        className={`truncate font-semibold tabular-nums ${
          emphasize ? 'text-sky-700' : 'text-slate-900'
        }`}>
        {value}
      </p>
    </div>
  );
}
