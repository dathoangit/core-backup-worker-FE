import { Trans, useTranslation } from 'react-i18next';
import type { WallboardDisk } from 'src/types/wallboard';
import { BackupStorageCylinder } from './BackupStorageCylinder';
import {
  formatBytesShort,
  formatCompression,
  formatDailyGrowth,
} from './wallboard-format';
import { wbClass } from './wallboard-theme';

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
        />
      </div>

      {warning ? (
        <p
          className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-medium ${wbClass.pillWarn}`}>
          {t('forecast.diskFullWarning', { days })}
        </p>
      ) : null}

      {disk?.exists ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          <p className={`shrink-0 text-[11px] xl:text-xs ${wbClass.muted}`}>
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
                used: <span className={`font-semibold ${wbClass.ink}`} />,
                muted: <span className={wbClass.muted} />,
              }}
            />
          </p>
          <BackupStorageCylinder disk={disk} />
        </div>
      ) : (
        <p className={`flex flex-1 items-center text-xs ${wbClass.muted}`}>
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
  tone = 'default',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'warn';
}) {
  const box = tone === 'warn' ? wbClass.warnSoft : wbClass.metricBox;
  const valueTone = tone === 'warn' ? wbClass.warnInk : wbClass.ink;
  const hintTone = tone === 'warn' ? wbClass.warnInk : wbClass.muted;

  return (
    <div className={`rounded-lg border px-2 py-1.5 ${box}`}>
      <p className={`text-[10px] font-medium ${wbClass.ink}`}>{label}</p>
      <p
        className={`truncate text-sm font-semibold tabular-nums xl:text-base ${valueTone}`}>
        {value}
      </p>
      <p className={`truncate text-[9px] ${hintTone}`}>{hint}</p>
    </div>
  );
}
