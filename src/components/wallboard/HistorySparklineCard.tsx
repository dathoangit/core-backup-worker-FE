import { useMemo } from 'react';
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
import {
  formatBytesShort,
  formatCompactCount,
  formatShortDay,
  percent,
} from './wallboard-format';

type HistorySparklineCardProps = {
  historyByDay: WallboardHistoryDay[];
  recentJobs?: WallboardRecentJob[];
};

const STATUS_COLORS = {
  ok: '#059669',
  error: '#dc2626',
  partial: '#d97706',
  bytes: '#0284c7',
} as const;

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

function formatDurationMin(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec < 0) {
    return '—';
  }
  const min = sec / 60;
  if (min < 10) {
    return `${min.toFixed(1)}m`;
  }
  return `${Math.round(min)}m`;
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
  if (!active || !payload?.length) {
    return null;
  }
  const day = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] shadow-sm">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-emerald-700">OK: {day.ok}</p>
      <p className="text-red-700">Error: {day.error}</p>
      <p className="text-amber-700">Partial: {day.partial}</p>
      <p className="text-sky-700">
        Volume: {formatBytesShort(day.bytesWritten)}
      </p>
      <p className="text-violet-700">
        Duration TB: {formatDurationMin(day.durationSecAvg)}
      </p>
      <p className="text-slate-600">
        Rows: {formatCompactCount(day.rowCountTotal)}
      </p>
      <p className="border-t border-slate-100 pt-0.5 text-slate-600">
        Tổng job {day.total} · OK {day.successPct}%
      </p>
    </div>
  );
}

export function HistorySparklineCard({
  historyByDay,
  recentJobs = [],
}: HistorySparklineCardProps) {
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
        <div className="rounded-md bg-emerald-50 px-1.5 py-1">
          <p className="text-[9px] text-emerald-700">14-Day OK%</p>
          <p className="text-base font-bold tabular-nums text-emerald-800 xl:text-lg">
            {successRate}%
          </p>
        </div>
        <div className="rounded-md bg-slate-50 px-1.5 py-1">
          <p className="text-[9px] text-slate-500">OK / Fail</p>
          <p className="text-base font-bold tabular-nums text-slate-900 xl:text-lg">
            <span className="text-emerald-700">{okTotal}</span>
            <span className="text-slate-400">/</span>
            <span className="text-red-700">{failedTotal}</span>
          </p>
        </div>
        <div className="rounded-md bg-sky-50 px-1.5 py-1">
          <p className="text-[9px] text-sky-700">Volume 14d</p>
          <p className="truncate text-base font-bold tabular-nums text-sky-900 xl:text-lg">
            {formatBytesShort(totalBytes)}
          </p>
        </div>
        <div className="rounded-md bg-violet-50 px-1.5 py-1">
          <p className="text-[9px] text-violet-700">Duration TB</p>
          <p className="text-base font-bold tabular-nums text-violet-900 xl:text-lg">
            {formatDurationMin(avgDurationSec)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-slate-600 xl:text-[10px]">
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ background: STATUS_COLORS.ok }}
          />
          Jobs
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-3 rounded-full"
            style={{ background: STATUS_COLORS.bytes }}
          />
          GB/ngày
        </span>
        <span className="text-sky-700">Streak {streak}d</span>
        {todayVsAvgBytesPct != null ? (
          <span
            className={
              todayVsAvgBytesPct >= 0 ? 'text-sky-700' : 'text-emerald-700'
            }>
            Hôm nay {todayVsAvgBytesPct >= 0 ? '+' : ''}
            {todayVsAvgBytesPct}% vs TB volume
          </span>
        ) : null}
        {bestDay ? (
          <span className="text-emerald-700">
            Best {bestDay.label} ({bestDay.successPct}%)
          </span>
        ) : null}
        {worstDay ? (
          <span className="text-red-700">
            Worst {worstDay.label} (E{worstDay.error}/P{worstDay.partial})
          </span>
        ) : null}
        {modeSampleSize > 0 ? (
          <span className="rounded bg-slate-100 px-1 py-0.5 font-medium text-slate-700">
            Inc {incrementalPct}% · Full {fullPct}%
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
              title={`${day.label}: ${formatBytesShort(day.bytesWritten)} · ${formatDurationMin(day.durationSecAvg)}${
                failed ? ' · có lỗi' : ''
              }`}
              className="h-2 rounded-[2px]"
              style={{
                backgroundColor: failed
                  ? `rgba(220, 38, 38, ${0.35 + intensity * 0.55})`
                  : intensity === 0
                    ? '#e2e8f0'
                    : `rgba(2, 132, 199, ${0.25 + intensity * 0.7})`,
              }}
            />
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="22%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickMargin={2}
              interval="preserveStartEnd"
              height={16}
            />
            <YAxis
              yAxisId="jobs"
              allowDecimals={false}
              tick={{ fontSize: 9, fill: '#64748b' }}
              width={18}
              tickMargin={2}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 9, fill: '#0284c7' }}
              width={28}
              tickMargin={2}
              tickFormatter={(v: number) =>
                v >= 1 ? `${v}G` : v > 0 ? `${Math.round(v * 1024)}M` : '0'
              }
            />
            <Tooltip
              content={<HistoryTooltip />}
              cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
            />
            <Bar
              yAxisId="jobs"
              dataKey="ok"
              name="OK"
              stackId="status"
              fill={STATUS_COLORS.ok}
              isAnimationActive={false}
              maxBarSize={14}
            />
            <Bar
              yAxisId="jobs"
              dataKey="partial"
              name="Partial"
              stackId="status"
              fill={STATUS_COLORS.partial}
              isAnimationActive={false}
              maxBarSize={14}
            />
            <Bar
              yAxisId="jobs"
              dataKey="error"
              name="Error"
              stackId="status"
              fill={STATUS_COLORS.error}
              isAnimationActive={false}
              maxBarSize={14}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="bytesGb"
              name="GB"
              stroke={STATUS_COLORS.bytes}
              strokeWidth={2}
              dot={{ r: 2.5, fill: STATUS_COLORS.bytes }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
