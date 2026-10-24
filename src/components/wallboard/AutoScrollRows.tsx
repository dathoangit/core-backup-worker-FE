import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from 'react';

const DEFAULT_SCROLL_MS = 5_000;
const DEFAULT_ANIM_MS = 450;

type AutoScrollRowsProps = {
  items: ReactNode[];
  /** How many rows stay visible in the viewport. */
  visibleCount: number;
  /** Gap between rows in px (must match spacing in each row wrapper). */
  gapPx?: number;
  scrollMs?: number;
  animMs?: number;
  className?: string;
  /** Extra class on each row wrapper (margin-bottom uses gapPx). */
  rowClassName?: string;
};

function windowRows<T>(rows: T[], start: number, count: number): T[] {
  if (rows.length === 0) {
    return [];
  }
  const out: T[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(rows[(start + i) % rows.length]!);
  }
  return out;
}

/**
 * Circular vertical carousel: every `scrollMs`, slide up one row.
 * When `items.length <= visibleCount`, renders a static list (no animation).
 */
export function AutoScrollRows({
  items,
  visibleCount,
  gapPx = 4,
  scrollMs = DEFAULT_SCROLL_MS,
  animMs = DEFAULT_ANIM_MS,
  className = '',
  rowClassName = '',
}: AutoScrollRowsProps) {
  const needsScroll = items.length > visibleCount;
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
  }, [items.length, visibleCount]);

  useEffect(() => {
    if (!needsScroll) {
      return;
    }

    const id = window.setInterval(() => {
      if (busyRef.current) {
        return;
      }
      const firstRow = trackRef.current?.querySelector<HTMLElement>(
        '[data-auto-scroll-row]',
      );
      if (!firstRow) {
        setRowOffset((prev) => (prev + 1) % items.length);
        return;
      }
      busyRef.current = true;
      setAnimating(true);
      setShiftPx(firstRow.offsetHeight + gapPx);
    }, scrollMs);

    return () => window.clearInterval(id);
  }, [needsScroll, items.length, gapPx, scrollMs]);

  const handleTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (!animating || event.target !== event.currentTarget) {
      return;
    }
    setRowOffset((prev) => (prev + 1) % items.length);
    setAnimating(false);
    setShiftPx(0);
    busyRef.current = false;
  };

  if (items.length === 0) {
    return null;
  }

  if (!needsScroll) {
    return (
      <div className={className}>
        {items.map((item, i) => (
          <div
            key={i}
            className={rowClassName}
            style={{ marginBottom: i < items.length - 1 ? gapPx : 0 }}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  const trackItems = windowRows(items, rowOffset, visibleCount + 1);

  return (
    <div className={`overflow-hidden ${className}`.trim()}>
      <div
        ref={trackRef}
        style={{
          transform: `translateY(-${shiftPx}px)`,
          transition: animating ? `transform ${animMs}ms ease-out` : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}>
        {trackItems.map((item, i) => {
          const absolute = (rowOffset + i) % items.length;
          return (
            <div
              key={`row-${absolute}-${i === trackItems.length - 1 ? 'next' : 'vis'}`}
              data-auto-scroll-row
              className={rowClassName}
              style={{ marginBottom: gapPx }}>
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}
