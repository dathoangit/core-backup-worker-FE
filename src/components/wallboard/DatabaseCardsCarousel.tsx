import {
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
} from 'react';
import type { WallboardDatabase } from 'src/types/wallboard';
import { DatabaseLagBadge } from './DatabaseLagBadge';

const COLS = 3;
const VISIBLE_ROWS = 4;
const PAGE_SIZE = COLS * VISIBLE_ROWS;
const SCROLL_MS = 5_000;
const ANIM_MS = 450;
const GAP_PX = 6;

type DatabaseCardsCarouselProps = {
  databases: WallboardDatabase[];
};

function buildRows(databases: WallboardDatabase[]): WallboardDatabase[][] {
  const rows: WallboardDatabase[][] = [];
  for (let i = 0; i < databases.length; i += COLS) {
    rows.push(databases.slice(i, i + COLS));
  }
  return rows;
}

/** Circular window of `count` rows starting at `startRow`. */
function rowWindow(
  rows: WallboardDatabase[][],
  startRow: number,
  count: number,
): WallboardDatabase[][] {
  if (rows.length === 0) {
    return [];
  }
  const out: WallboardDatabase[][] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(rows[(startRow + i) % rows.length]!);
  }
  return out;
}

function DatabaseCard({ db }: { db: WallboardDatabase }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-xs font-semibold text-slate-900 xl:text-sm">
          {db.database}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
            db.live
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-red-100 text-red-800'
          }`}>
          {db.live ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-live-dot motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {db.live ? 'LIVE' : 'OFF'}
        </span>
      </div>
      <p className="truncate text-[10px] text-slate-500">
        {db.group} · {db.host}
      </p>
      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
        WM {db.watermark ?? '—'}
      </p>
      <div className="mt-0.5">
        <DatabaseLagBadge lagMinutes={db.lagMinutes} />
      </div>
    </article>
  );
}

function DatabaseRow({
  row,
  rowKey,
}: {
  row: WallboardDatabase[];
  rowKey: string;
}) {
  return (
    <div
      data-db-row
      className="grid shrink-0 grid-cols-3 gap-1.5 xl:gap-2"
      style={{ marginBottom: GAP_PX }}>
      {Array.from({ length: COLS }, (_, col) => {
        const db = row[col];
        if (!db) {
          return <div key={`${rowKey}-empty-${col}`} />;
        }
        return (
          <DatabaseCard
            key={`${rowKey}-${db.group}-${db.database}-${db.host}`}
            db={db}
          />
        );
      })}
    </div>
  );
}

export function DatabaseCardsCarousel({
  databases,
}: DatabaseCardsCarouselProps) {
  const rows = buildRows(databases);
  const needsScroll = databases.length > PAGE_SIZE;
  const [rowOffset, setRowOffset] = useState(0);
  const [shiftPx, setShiftPx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    setRowOffset(0);
    setShiftPx(0);
    setAnimating(false);
    busyRef.current = false;
  }, [databases.length]);

  useEffect(() => {
    if (!needsScroll || rows.length <= VISIBLE_ROWS) {
      return;
    }

    const id = window.setInterval(() => {
      if (busyRef.current) {
        return;
      }
      const firstRow = trackRef.current?.querySelector<HTMLElement>(
        '[data-db-row]',
      );
      if (!firstRow) {
        setRowOffset((prev) => (prev + 1) % rows.length);
        return;
      }
      busyRef.current = true;
      const distance = firstRow.offsetHeight + GAP_PX;
      setAnimating(true);
      setShiftPx(distance);
    }, SCROLL_MS);

    return () => window.clearInterval(id);
  }, [needsScroll, rows.length]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (!animating || event.target !== event.currentTarget) {
      return;
    }
    setRowOffset((prev) => (prev + 1) % rows.length);
    setAnimating(false);
    setShiftPx(0);
    busyRef.current = false;
  };

  if (!needsScroll) {
    return (
      <div className="grid h-full grid-cols-3 content-start gap-1.5 overflow-hidden xl:gap-2">
        {databases.map((db) => (
          <DatabaseCard
            key={`${db.group}-${db.database}-${db.host}`}
            db={db}
          />
        ))}
      </div>
    );
  }

  // ROWS visible + 1 upcoming row at bottom (slides into view while top exits).
  const trackRows = rowWindow(rows, rowOffset, VISIBLE_ROWS + 1);

  return (
    <div className="h-full overflow-hidden">
      <div
        ref={trackRef}
        className={animating ? 'ease-out' : ''}
        style={{
          transform: `translateY(-${shiftPx}px)`,
          transition: animating
            ? `transform ${ANIM_MS}ms ease-out`
            : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}>
        {trackRows.map((row, i) => {
          const absoluteRow = (rowOffset + i) % rows.length;
          return (
            <DatabaseRow
              key={`row-${absoluteRow}-${i === trackRows.length - 1 ? 'next' : 'vis'}`}
              row={row}
              rowKey={`r${absoluteRow}`}
            />
          );
        })}
      </div>
    </div>
  );
}
