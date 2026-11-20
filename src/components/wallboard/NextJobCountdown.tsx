import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  WallboardSchedule,
  WallboardScheduleTarget,
} from 'src/types/wallboard';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { AutoScrollRows } from './AutoScrollRows';
import { formatCountdown } from './wallboard-format';
import { wbClass } from './wallboard-theme';

const CHIP_VISIBLE_ROWS = 3;
const CHIP_GAP_PX = 4;
/** Horizontal padding inside chip (px-1.5 × 2) + font estimate. */
const CHIP_PAD_X = 12;
const CHIP_CHAR_PX = 6.2;
const CHIP_MAX_PX = 140;
const CHIP_MIN_PX = 40;

type NextJobCountdownProps = {
  schedule: WallboardSchedule | null | undefined;
  scheduleEnabled: boolean | null | undefined;
};

function estimateChipWidth(name: string): number {
  return Math.min(
    CHIP_MAX_PX,
    Math.max(CHIP_MIN_PX, Math.ceil(name.length * CHIP_CHAR_PX) + CHIP_PAD_X),
  );
}

/** Pack chips left-to-right; wrap when the next chip would exceed `width`. */
function packChipRows(
  databases: WallboardScheduleTarget[],
  width: number,
): WallboardScheduleTarget[][] {
  if (databases.length === 0) {
    return [];
  }
  if (width <= 0) {
    return databases.map((db) => [db]);
  }

  const rows: WallboardScheduleTarget[][] = [];
  let current: WallboardScheduleTarget[] = [];
  let used = 0;

  for (const db of databases) {
    const chipW = estimateChipWidth(db.database);
    const nextUsed = current.length === 0 ? chipW : used + CHIP_GAP_PX + chipW;
    if (current.length > 0 && nextUsed > width) {
      rows.push(current);
      current = [db];
      used = chipW;
    } else {
      current.push(db);
      used = nextUsed;
    }
  }
  if (current.length > 0) {
    rows.push(current);
  }
  return rows;
}

function DbChipList({
  databases,
  groups,
  tone,
}: {
  databases: WallboardScheduleTarget[];
  groups?: string[];
  tone: 'chart' | 'amber';
}) {
  const { t } = useTranslation('wallboard');
  const measureRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(node);
    setWidth(Math.floor(node.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);

  const packedRows = useMemo(
    () => packChipRows(databases, width),
    [databases, width],
  );

  if (databases.length === 0 && (!groups || groups.length === 0)) {
    return (
      <p className={`mt-1 text-[10px] ${wbClass.muted}`}>
        {t('countdown.noTargets')}
      </p>
    );
  }

  const chip =
    tone === 'chart'
      ? `${wbClass.chartSoft} ${wbClass.chartInk}`
      : `${wbClass.warnSoft} ${wbClass.warnInk}`;

  const rowNodes = packedRows.map((row, rowIndex) => (
    <div key={`chip-row-${rowIndex}`} className="flex gap-1 overflow-hidden">
      {row.map((db) => (
        <span
          key={`${db.group}-${db.database}`}
          className={`inline-flex max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${chip}`}
          title={`${db.group} · ${db.database}`}>
          {db.database}
        </span>
      ))}
    </div>
  ));

  return (
    <div className="mt-1.5 min-h-0 flex-1">
      {groups && groups.length > 0 ? (
        <p className={`mb-0.5 text-[10px] font-medium ${wbClass.muted}`}>
          {t('countdown.groupsPrefix', { groups: groups.join(', ') })}
        </p>
      ) : null}
      <div ref={measureRef} className="min-h-0 w-full">
        <AutoScrollRows
          items={rowNodes}
          visibleCount={CHIP_VISIBLE_ROWS}
          gapPx={CHIP_GAP_PX}
          className="min-h-0"
        />
      </div>
      {databases.length > 0 ? (
        <p className={`mt-0.5 text-[9px] ${wbClass.muted}`}>
          {t('countdown.dbCount', { count: databases.length })}
        </p>
      ) : null}
    </div>
  );
}

export function NextJobCountdown({ schedule }: NextJobCountdownProps) {
  const { t } = useTranslation('wallboard');
  const [, setTick] = useState(0);
  const nextIncrementalAt = schedule?.nextIncrementalAt ?? null;
  const nextFullAt = schedule?.nextFullAt ?? null;
  const nextFullLabel = schedule?.nextFullLabel ?? null;
  const incrementalDbs = schedule?.nextIncrementalDatabases ?? [];
  const fullDbs = schedule?.nextFullDatabases ?? [];
  const fullGroups = schedule?.nextFullGroups ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
        <div
          className={`flex min-h-0 flex-col rounded-lg px-3 py-2 ${wbClass.chartSoft}`}>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${wbClass.chartInk}`}>
            {t('countdown.incrementalTitle')}
          </p>
          <p className={`text-2xl xl:text-3xl ${wbClass.kpi}`}>
            {formatCountdown(nextIncrementalAt)}
          </p>
          <p className={`truncate text-[10px] opacity-80 ${wbClass.chartInk}`}>
            {nextIncrementalAt
              ? formatIsoAsLocalDateTime(nextIncrementalAt)
              : t('countdown.incrementalNoCron')}
          </p>
          <DbChipList databases={incrementalDbs} tone="chart" />
        </div>

        <div
          className={`flex min-h-0 flex-col rounded-lg px-3 py-2 ${wbClass.warnSoft}`}>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wide ${wbClass.warnInk}`}>
            {t('countdown.fullTitle')}
          </p>
          <p className={`text-2xl xl:text-3xl ${wbClass.kpi}`}>
            {nextFullLabel ?? '—'}
          </p>
          <p className={`truncate text-[10px] opacity-80 ${wbClass.warnInk}`}>
            {nextFullAt
              ? formatCountdown(nextFullAt)
              : t('countdown.fullNoCron')}
          </p>
          <DbChipList
            databases={fullDbs}
            groups={fullGroups}
            tone="amber"
          />
        </div>
      </div>
    </div>
  );
}
