import type { WallboardDisk } from 'src/types/wallboard';
import { BackupStorageCylinder } from './BackupStorageCylinder';
import {
  formatBytesShort,
  formatCompression,
  formatDailyGrowth,
} from './wallboard-format';

type DiskForecastPanelProps = {
  disk: WallboardDisk | null;
  primaryExists: boolean;
};

export function DiskForecastPanel({
  disk,
  primaryExists,
}: DiskForecastPanelProps) {
  const forecast = disk?.forecast ?? null;
  const days = forecast?.estimatedDaysUntilFull ?? null;
  const warning = days != null && days <= 14;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="grid shrink-0 grid-cols-3 gap-1.5">
        <ForecastMetric
          label="Tăng trưởng / ngày"
          value={formatDailyGrowth(forecast?.dailyGrowthBytes)}
          hint="7 ngày gần nhất"
          emphasize
        />
        <ForecastMetric
          label="Gzip efficiency"
          value={formatCompression(
            forecast?.compressionRatio,
            forecast?.compressionSavingsPercent,
          )}
          hint="ước lượng CSV→gz"
        />
        <ForecastMetric
          label="Đĩa đầy sau"
          value={days != null ? `~${days} ngày` : '—'}
          hint={warning ? 'Cảnh báo sớm' : 'ước lượng'}
          tone={warning ? 'warn' : 'default'}
          emphasize
        />
      </div>

      {warning ? (
        <p className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
          Cảnh báo: ước tính đĩa đầy trong ~{days} ngày — cần dọn retention /
          mở rộng volume.
        </p>
      ) : null}

      {disk?.exists ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <p className="shrink-0 text-[11px] text-slate-600 xl:text-xs">
            <span className="font-semibold text-slate-900">
              {formatBytesShort(disk.usedBytes)}
            </span>
            {' / '}
            {formatBytesShort(disk.totalBytes)}
            <span className="text-slate-500">
              {' '}
              · {disk.usedPercent}% · trống {formatBytesShort(disk.freeBytes)}
            </span>
          </p>
          <BackupStorageCylinder disk={disk} />
        </div>
      ) : (
        <p className="flex flex-1 items-center text-xs text-slate-500">
          Primary {primaryExists ? 'OK' : 'missing'} · chưa đọc được ổ.
        </p>
      )}
    </div>
  );
}

function ForecastMetric({
  label,
  value,
  hint,
  emphasize = false,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint: string;
  emphasize?: boolean;
  tone?: 'default' | 'warn';
}) {
  const box =
    tone === 'warn'
      ? 'bg-amber-50 border-amber-200'
      : 'bg-slate-50 border-slate-100';

  return (
    <div className={`rounded-lg border px-2 py-1.5 ${box}`}>
      <p className="text-[10px] font-medium text-slate-500">{label}</p>
      <p
        className={`truncate text-sm font-bold tabular-nums xl:text-base ${
          tone === 'warn'
            ? 'text-amber-900'
            : emphasize
              ? 'text-slate-900'
              : 'text-slate-800'
        }`}>
        {value}
      </p>
      <p className="truncate text-[9px] text-slate-400">{hint}</p>
    </div>
  );
}
