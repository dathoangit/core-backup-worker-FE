import type { WallboardDisk } from 'src/types/wallboard';
import { diskBarTone, formatBytesShort } from './wallboard-format';

type DiskCylinderProps = {
  disk: WallboardDisk;
};

const TONE_FILL = {
  ok: { body: '#10b981', rim: '#047857', mid: '#34d399' },
  warn: { body: '#f59e0b', rim: '#b45309', mid: '#fbbf24' },
  error: { body: '#ef4444', rim: '#b91c1c', mid: '#f87171' },
} as const;

const FREE_FILL = { body: '#e2e8f0', rim: '#94a3b8', mid: '#f1f5f9' };

/**
 * Circular stacked cylinder (Used bottom + Free top) with side legend.
 * Style inspired by SnapCenter storage savings chart.
 */
export function DiskCylinder({ disk }: DiskCylinderProps) {
  const tone = disk.exists ? diskBarTone(disk.usedPercent) : 'error';
  const usedColors = TONE_FILL[tone];
  const usedPct = disk.exists
    ? Math.min(100, Math.max(0, disk.usedPercent))
    : 100;
  const freeBytes = disk.exists ? Math.max(0, disk.availableBytes) : 0;

  const vbW = 56;
  const vbH = 96;
  const cx = 28;
  const rx = 20;
  const ry = 7;
  const topY = 14;
  const bottomY = 84;
  const bodyH = bottomY - topY;
  const usedH = (usedPct / 100) * bodyH;
  const freeH = bodyH - usedH;
  const usedTopY = bottomY - usedH;
  const uid = disk.id;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <div className="relative h-full w-[52px] shrink-0 xl:w-[60px]">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="h-full max-h-[120px] w-full"
          role="img"
          aria-label={`${disk.label}: ${Math.round(usedPct)}% used`}>
          <defs>
            <linearGradient id={`stk-used-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={usedColors.mid} />
              <stop offset="100%" stopColor={usedColors.rim} />
            </linearGradient>
            <linearGradient id={`stk-free-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FREE_FILL.mid} />
              <stop offset="100%" stopColor={FREE_FILL.body} />
            </linearGradient>
            <linearGradient id={`stk-sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.25" />
            </linearGradient>
            <clipPath id={`stk-body-${uid}`}>
              <path
                d={`
                  M ${cx - rx} ${topY}
                  A ${rx} ${ry} 0 0 0 ${cx + rx} ${topY}
                  L ${cx + rx} ${bottomY}
                  A ${rx} ${ry} 0 0 1 ${cx - rx} ${bottomY}
                  Z
                `}
              />
            </clipPath>
          </defs>

          {/* Free stack (top) */}
          {freeH > 0 ? (
            <rect
              x={cx - rx}
              y={topY}
              width={rx * 2}
              height={freeH + ry}
              fill={`url(#stk-free-${uid})`}
              clipPath={`url(#stk-body-${uid})`}
            />
          ) : null}

          {/* Used stack (bottom) */}
          {usedH > 0 ? (
            <rect
              x={cx - rx}
              y={usedTopY}
              width={rx * 2}
              height={usedH + ry}
              fill={`url(#stk-used-${uid})`}
              clipPath={`url(#stk-body-${uid})`}
            />
          ) : null}

          {/* Sheen */}
          <rect
            x={cx - rx}
            y={topY}
            width={rx * 2}
            height={bodyH}
            fill={`url(#stk-sheen-${uid})`}
            clipPath={`url(#stk-body-${uid})`}
            opacity={0.5}
          />

          {/* Bottom cap */}
          <ellipse
            cx={cx}
            cy={bottomY}
            rx={rx}
            ry={ry}
            fill={usedH > 0 ? usedColors.rim : FREE_FILL.rim}
          />

          {/* Stack boundary ellipse */}
          {usedPct > 3 && usedPct < 97 ? (
            <ellipse
              cx={cx}
              cy={usedTopY}
              rx={rx}
              ry={ry}
              fill={usedColors.body}
              stroke={usedColors.rim}
              strokeWidth={0.7}
            />
          ) : null}

          {/* Top lid */}
          <ellipse
            cx={cx}
            cy={topY}
            rx={rx}
            ry={ry}
            fill={FREE_FILL.mid}
            stroke={FREE_FILL.rim}
            strokeWidth={1}
          />
          <ellipse
            cx={cx}
            cy={topY - 1}
            rx={rx * 0.7}
            ry={ry * 0.5}
            fill="#ffffff"
            opacity={0.75}
          />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-900 xl:text-sm">
          {disk.label}
          <span className="ml-1 font-normal text-slate-500">
            {disk.exists ? `${Math.round(usedPct)}%` : 'missing'}
          </span>
        </p>
        <ul className="mt-1 space-y-1 text-[10px] xl:text-[11px]">
          <li className="flex items-start gap-1.5">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: usedColors.body }}
            />
            <span className="min-w-0">
              <span className="font-semibold text-slate-800">
                {disk.exists ? formatBytesShort(disk.usedBytes) : '—'}
              </span>
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: FREE_FILL.rim }}
            />
            <span className="min-w-0">
              <span className="font-semibold text-slate-800">
                {disk.exists ? formatBytesShort(freeBytes) : '—'}
              </span>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
