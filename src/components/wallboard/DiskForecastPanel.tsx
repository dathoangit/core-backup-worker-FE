import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('wallboard');
  const forecast = disk?.forecast ?? null;
  const days = forecast?.estimatedDaysUntilFull ?? null;
  const warning = days != null && days <= 14;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="grid shrink-0 grid-cols-3 gap-1.5">
        <ForecastMetric
          label={t('forecast.growthPerDay')}
          value={formatDailyGrowth(forecast?.dailyGrowthBytes)}
          hint={t('forecast.last7Days')}
          emphasize
        />
        <ForecastMetric
          label={t('forecast.gzipEfficiency')}
          value={formatCompression(
            forecast?.compressionRatio,
            forecast?.compressionSavingsPercent,
          )}
          hint={t('forecast.csvToGz')}
        />
        <ForecastMetric
          label={t('forecast.daysUntilFull')}
          value={days != null ? t('forecast.daysValue', { days }) : '—'}
          hint={warning ? t('forecast.earlyWarning') : t('forecast.estimate')}
          tone={warning ? 'warn' : 'default'}
          emphasize
        />
      </div>

      {warning ? (
        <p className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
          {t('forecast.diskFullWarning', { days })}
        </p>
      ) : null}

      {disk?.exists ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <p className="shrink-0 text-[11px] text-slate-600 xl:text-xs">
            <Trans
              t={t}
              i18nKey="forecast.diskUsageLine"
              values={{
                used: formatBytesShort(disk.usedBytes),
                total: formatBytesShort(disk.totalBytes),
                percent: disk.usedPercent,
                free: formatBytesShort(disk.freeBytes),
              }}
              components={{
                used: <span className="font-semibold text-slate-900" />,
                muted: <span className="text-slate-500" />,
              }}
            />
          </p>
          <BackupStorageCylinder disk={disk} />
        </div>
      ) : (
        <p className="flex flex-1 items-center text-xs text-slate-500">
          {t('forecast.primaryUnreadable', {
            status: primaryExists ? t('primary.ok') : t('primary.missing'),
          })}
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
