import { useTranslation } from 'react-i18next';
import type { BackupRunProgressEvent } from 'src/types/backup-stream';
import { formatBytes } from 'src/components/admin/backup/backup-status';

type RunProgressBarProps = {
  progress: BackupRunProgressEvent | null | undefined;
  compact?: boolean;
};

export function RunProgressBar({ progress, compact = false }: RunProgressBarProps) {
  const { t, i18n } = useTranslation('runs');

  if (!progress) {
    return null;
  }

  const percent = Math.max(0, Math.min(100, progress.percent));
  const formatRows = (n: number) =>
    new Intl.NumberFormat(i18n.language).format(n);

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
        <span>
          {progress.database
            ? t('progress.byTable', {
                db: progress.database,
                done: progress.tablesDone,
                total: progress.tablesTotal || '?',
              })
            : t('progress.byDatabase', {
                done: progress.databasesDone,
                total: progress.databasesTotal,
              })}
        </span>
        <span className="font-medium tabular-nums text-slate-800">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {!compact && (
        <p className="text-xs text-slate-500">
          {t('progress.stats', {
            rows: formatRows(progress.rowsTotal),
            bytes: formatBytes(progress.bytesTotal),
          })}
        </p>
      )}
    </div>
  );
}
