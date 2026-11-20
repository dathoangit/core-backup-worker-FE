import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  WallboardHistoryDay,
  WallboardRecentJob,
} from 'src/types/wallboard';
import { useWallboardPalette } from './WallboardThemeContext';
import {
  formatBytesShort,
  formatCompactCount,
  formatShortDay,
  percent,
} from './wallboard-format';
import { wbClass } from './wallboard-theme';

type HistorySparklineCardProps = {
  historyByDay: WallboardHistoryDay[];
  recentJobs?: WallboardRecentJob[];
};

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) {
    return hex;
  }
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type ChartDay = {
  date: string;
  label: string;
  ok: number;
  error: number;
  partial: number;
  running: number;
  total: number;
  successPct: number;
  bytesWritten: number;
  bytesGb: number;
  durationSecAvg: number | null;
  durationMin: number | null;
  rowCountTotal: number;
};

function dayHasFailure(day: WallboardHistoryDay): boolean {
  return day.error > 0 || day.partial > 0;
}

function computeCleanStreak(days: WallboardHistoryDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    const hasActivity = day.ok + day.error + day.partial + day.running > 0;
    if (!hasActivity) {
      continue;
    }
    if (dayHasFailure(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function formatDurationMin(
  sec: number | null | undefined,
  t: TFunction<'wallboard'>,
): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) {
    return '—';
  }
  const min = sec / 60;
  return t('history.durationMinutes', {
    value: min < 10 ? min.toFixed(1) : Math.round(min),
  });
}

function HistoryTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDay }>;
  label?: string;
}) {
  const { t } = useTranslation('wallboard');
  if (!active || !payload?.length) {
    return null;
  }
  const day = payload[0].payload;
  return (
    <div
      className={`rounded-md px-2.5 py-1.5 text-[11px] ${wbClass.surface}`}>
      <p className={`font-semibold ${wbClass.ink}`}>{label}</p>
      <p className={wbClass.legendOk}>
        {t('history.tooltipOk')}: {day.ok}
      </p>
      <p className={wbClass.legendErr}>
        {t('history.tooltipError')}: {day.error}
      </p>
      <p className={wbClass.legendPartial}>
        {t('history.tooltipPartial')}: {day.partial}
      </p>
      <p className={wbClass.legendRunning}>
        {t('history.tooltipVolume')}: {formatBytesShort(day.bytesWritten)}
      </p>
      <p className={wbClass.muted}>
        {t('history.tooltipDuration')}: {formatDurationMin(day.durationSecAvg, t)}
      </p>
      <p className={wbClass.muted}>
        {t('history.tooltipRows')}: {formatCompactCount(day.rowCountTotal)}
      </p>
      <p className={`border-t pt-0.5 ${wbClass.ruleBorder} ${wbClass.muted}`}>
        {t('history.tooltipTotalJobs')} {day.total} · {t('history.tooltipOk')}{' '}
        {day.successPct}%
      </p>
    </div>
  );
}

export function HistorySparklineCard({
  historyByDay,
  recentJobs = [],
}: HistorySparklineCardProps) {
  const { t } = useTranslation('wallboard');
  const { palette } = useWallboardPalette();
  const statusColors = {
    ok: palette.status.ok,
    error: palette.status.error,
    partial: palette.status.partial,
    bytes: palette.chart,
  };
  const {
    okTotal,
    failedTotal,
    successRate,
    chartData,
    streak,
    bestDay,
    worstDay,
    incrementalPct,
    fullPct,
    modeSampleSize,
    totalBytes,
    avgDurationSec,
    maxBytes,
    todayVsAvgBytesPct,
  } = useMemo(() => {
    let ok = 0;
    let failed = 0;
    let bytesSum = 0;
    let durationSum = 0;
    let durationN = 0;

    const chart: ChartDay[] = historyByDay.map((day) => {
      ok += day.ok;
      failed += day.error + day.partial;
      const bytesWritten = Number(day.bytesWritten ?? 0) || 0;
      const durationSecAvg =
        day.durationSecAvg == null ? null : Number(day.durationSecAvg);
      const rowCountTotal = Number(day.rowCountTotal ?? 0) || 0;
      bytesSum += bytesWritten;
      if (durationSecAvg != null && Number.isFinite(durationSecAvg)) {
        durationSum += durationSecAvg;
        durationN += 1;
      }
      const total = day.ok + day.error + day.partial + day.running;
      const decided = day.ok + day.error + day.partial;
      return {
        date: day.date,
        label: formatShortDay(day.date),
        ok: day.ok,
        error: day.error,
        partial: day.partial,
        running: day.running,
        total,
        successPct: percent(day.ok, decided),
        bytesWritten,
        bytesGb: Math.round((bytesWritten / (1024 ** 3)) * 100) / 100,
        durationSecAvg,
        durationMin:
          durationSecAvg == null
            ? null
            : Math.round((durationSecAvg / 60) * 10) / 10,
        rowCountTotal,
      };
    });

    const activeDays = chart.filter(
      (day) => day.ok + day.error + day.partial > 0,
    );
    let bestDayPick: ChartDay | undefined;
    let worstDayPick: ChartDay | undefined;
    for (const row of activeDays) {
      if (
        !bestDayPick ||
        row.successPct > bestDayPick.successPct ||
        (row.successPct === bestDayPick.successPct && row.ok > bestDayPick.ok)
      ) {
        bestDayPick = row;
      }
      const failScore = row.error * 2 + row.partial;
      const worstFail = worstDayPick
        ? worstDayPick.error * 2 + worstDayPick.partial
        : -1;
      if (failScore > worstFail) {
        worstDayPick = row;
      }
    }

    const cutoff = Date.now() - 14 * 86_400_000;
    let incremental = 0;
    let full = 0;
    for (const job of recentJobs) {
      const started = new Date(job.startedAt).getTime();
      if (Number.isNaN(started) || started < cutoff) {
        continue;
      }
      if (job.mode === 'full') {
        full += 1;
      } else {
        incremental += 1;
      }
    }
    const modeTotal = incremental + full;

    const daysWithBytes = chart.filter((d) => d.bytesWritten > 0);
    const avgBytes =
      daysWithBytes.length > 0
        ? bytesSum / daysWithBytes.length
        : 0;
    const today = chart[chart.length - 1];
    const todayVsAvg =
      avgBytes > 0 && today?.bytesWritten
        ? Math.round(((today.bytesWritten - avgBytes) / avgBytes) * 100)
        : null;

    return {
      okTotal: ok,
      failedTotal: failed,
      successRate: percent(ok, ok + failed),
      chartData: chart,
      streak: computeCleanStreak(historyByDay),
      bestDay: bestDayPick ?? null,
      worstDay:
        worstDayPick &&
        (worstDayPick.error > 0 || worstDayPick.partial > 0)
          ? worstDayPick
          : null,
      incrementalPct: percent(incremental, modeTotal),
      fullPct: percent(full, modeTotal),
      modeSampleSize: modeTotal,
      totalBytes: bytesSum,
      avgDurationSec: durationN > 0 ? Math.round(durationSum / durationN) : null,
      maxBytes: Math.max(0, ...chart.map((d) => d.bytesWritten)),
      todayVsAvgBytesPct: todayVsAvg,
    };
  }, [historyByDay, recentJobs]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <div className="grid shrink-0 grid-cols-4 gap-1 text-[10px] xl:text-[11px]">
        <div className={`rounded-md px-1.5 py-1 ${wbClass.pillOk}`}>
          <p className="text-[9px] opacity-90">{t('history.okPercent14d')}</p>
          <p className={`text-base xl:text-lg ${wbClass.kpi}`}>
            {successRate}%
          </p>
        </div>
        <div className={`rounded-md px-1.5 py-1 bg-[var(--wb-raised)]`}>
          <p className={`text-[9px] ${wbClass.muted}`}>{t('history.okFail')}</p>
          <p className={`text-base xl:text-lg ${wbClass.kpi}`}>
            <span className={wbClass.legendOk}>{okTotal}</span>
            <span className={wbClass.controlText}>/</span>
            <span className={wbClass.legendErr}>{failedTotal}</span>
          </p>
        </div>
        <div className={`rounded-md px-1.5 py-1 ${wbClass.chartSoft}`}>
          <p className={`text-[9px] ${wbClass.chartInk}`}>
            {t('history.volume14d')}
          </p>
          <p
            className={`truncate text-base xl:text-lg ${wbClass.kpi} ${wbClass.chartInk}`}>
            {formatBytesShort(totalBytes)}
          </p>
        </div>
        <div className={`rounded-md px-1.5 py-1 bg-[var(--wb-raised)]`}>
          <p className={`text-[9px] ${wbClass.muted}`}>
            {t('history.durationAvg')}
          </p>
          <p className={`text-base xl:text-lg ${wbClass.kpi}`}>
            {formatDurationMin(avgDurationSec, t)}
          </p>
        </div>
      </div>

      <div
        className={`flex shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] xl:text-[10px] ${wbClass.muted}`}>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: statusColors.ok }}
          />
          {t('history.legendJobs')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-3 rounded-full"
            style={{ background: statusColors.bytes }}
          />
          {t('history.legendGbPerDay')}
        </span>
        <span className={wbClass.chartInk}>
          {t('history.streak', { days: streak })}
        </span>
        {todayVsAvgBytesPct != null ? (
          <span
            className={
              todayVsAvgBytesPct >= 0 ? wbClass.chartInk : wbClass.legendOk
            }>
            {t('history.todayVsAvg', {
              sign: todayVsAvgBytesPct >= 0 ? '+' : '',
              percent: todayVsAvgBytesPct,
            })}
          </span>
        ) : null}
        {bestDay ? (
          <span className={wbClass.legendOk}>
            {t('history.bestDay', {
              label: bestDay.label,
              percent: bestDay.successPct,
            })}
          </span>
        ) : null}
        {worstDay ? (
          <span className={wbClass.legendErr}>
            {t('history.worstDay', {
              label: worstDay.label,
              error: worstDay.error,
              partial: worstDay.partial,
            })}
          </span>
        ) : null}
        {modeSampleSize > 0 ? (
          <span
            className={`rounded px-1 py-0.5 font-medium ${wbClass.pillNeutral}`}>
            {t('history.modeMix', { inc: incrementalPct, full: fullPct })}
          </span>
        ) : null}
      </div>

      {/* Volume heatstrip — glanceable even when job counts are flat */}
      <div
        className="grid shrink-0 gap-0.5"
        style={{ gridTemplateColumns: `repeat(${chartData.length || 14}, minmax(0, 1fr))` }}>
        {chartData.map((day) => {
          const intensity =
            maxBytes > 0 ? Math.min(1, day.bytesWritten / maxBytes) : 0;
          const failed = day.error + day.partial > 0;
          return (
            <div
              key={day.date}
              title={t('history.heatstripTitle', {
                label: day.label,
                volume: formatBytesShort(day.bytesWritten),
                duration: formatDurationMin(day.durationSecAvg, t),
                failedSuffix: failed ? t('history.hasFailure') : '',
              })}
              className="h-2 rounded-[2px]"
              style={{
                backgroundColor: failed
                  ? withAlpha(palette.status.error, 0.35 + intensity * 0.55)
                  : intensity === 0
                    ? palette.rule
                    : withAlpha(palette.chart, 0.25 + intensity * 0.7),
              }}
            />
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="22%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={palette.rule}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: palette.muted }}
              tickMargin={2}
              interval="preserveStartEnd"
              height={16}
            />
            <YAxis
              yAxisId="jobs"
              allowDecimals={false}
              tick={{ fontSize: 9, fill: palette.muted }}
              width={18}
              tickMargin={2}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 9, fill: palette.chart }}
              width={28}
              tickMargin={2}
              tickFormatter={(v: number) =>
                v >= 1 ? `${v}G` : v > 0 ? `${Math.round(v * 1024)}M` : '0'
              }
            />
            <Tooltip
              content={<HistoryTooltip />}
              cursor={{ fill: withAlpha(palette.control, 0.2) }}
            />
            <Bar
              yAxisId="jobs"
              dataKey="ok"
              name={t('history.seriesOk')}
              stackId="status"
              fill={statusColors.ok}
              isAnimationActive={false}
              maxBarSize={14}
            />
            <Bar
              yAxisId="jobs"
              dataKey="partial"
              name={t('history.seriesPartial')}
              stackId="status"
              fill={statusColors.partial}
              isAnimationActive={false}
              maxBarSize={14}
            />
            <Bar
              yAxisId="jobs"
              dataKey="error"
              name={t('history.seriesError')}
              stackId="status"
              fill={statusColors.error}
              isAnimationActive={false}
              maxBarSize={14}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="bytesGb"
              name={t('history.seriesGb')}
              stroke={statusColors.bytes}
              strokeWidth={2}
              dot={{ r: 2.5, fill: statusColors.bytes }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
