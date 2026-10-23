import { useEffect, useState } from 'react';
import type {
  WallboardSchedule,
  WallboardScheduleTarget,
} from 'src/types/wallboard';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { formatCountdown } from './wallboard-format';

type NextJobCountdownProps = {
  schedule: WallboardSchedule | null | undefined;
  scheduleEnabled: boolean | null | undefined;
};

function DbChipList({
  databases,
  groups,
  tone,
}: {
  databases: WallboardScheduleTarget[];
  groups?: string[];
  tone: 'sky' | 'violet';
}) {
  if (databases.length === 0 && (!groups || groups.length === 0)) {
    return (
      <p className="mt-1 text-[10px] text-slate-500">Chưa gắn DB / nhóm</p>
    );
  }

  const chip =
    tone === 'sky'
      ? 'bg-sky-100 text-sky-800'
      : 'bg-violet-100 text-violet-800';

  return (
    <div className="mt-1.5 min-h-0">
      {groups && groups.length > 0 ? (
        <p className="mb-0.5 text-[10px] font-medium text-slate-600">
          Nhóm: {groups.join(', ')}
        </p>
      ) : null}
      <div className="flex max-h-[4.5rem] flex-wrap gap-1 overflow-y-auto">
        {databases.map((db) => (
          <span
            key={`${db.group}-${db.database}`}
            className={`inline-flex max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${chip}`}
            title={`${db.group} · ${db.database}`}>
            {db.database}
          </span>
        ))}
      </div>
      {databases.length > 0 ? (
        <p className="mt-0.5 text-[9px] text-slate-500">
          {databases.length} DB sẽ chạy
        </p>
      ) : null}
    </div>
  );
}

export function NextJobCountdown({ schedule }: NextJobCountdownProps) {
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
        <div className="flex min-h-0 flex-col rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
            Next Incremental
          </p>
          <p className="text-2xl font-bold tabular-nums text-sky-950 xl:text-3xl">
            {formatCountdown(nextIncrementalAt)}
          </p>
          <p className="truncate text-[10px] text-sky-700/80">
            {nextIncrementalAt
              ? formatIsoAsLocalDateTime(nextIncrementalAt)
              : 'Chưa có cron incremental'}
          </p>
          <DbChipList databases={incrementalDbs} tone="sky" />
        </div>

        <div className="flex min-h-0 flex-col rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">
            Next Weekly Full
          </p>
          <p className="text-2xl font-bold tabular-nums text-violet-950 xl:text-3xl">
            {nextFullLabel ?? '—'}
          </p>
          <p className="truncate text-[10px] text-violet-700/80">
            {nextFullAt ? formatCountdown(nextFullAt) : 'Chưa có cron full'}
          </p>
          <DbChipList
            databases={fullDbs}
            groups={fullGroups}
            tone="violet"
          />
        </div>
      </div>
    </div>
  );
}
