import { useEffect, useMemo, useRef, useState } from 'react';
import type Highcharts from 'highcharts';
import type HighchartsReactType from 'highcharts-react-official';
import type { WallboardDisk } from 'src/types/wallboard';
import { formatBytesShort } from './wallboard-format';

type BackupStorageCylinderProps = {
  disk: WallboardDisk;
};

const FOLDER_COLOR: Record<string, string> = {
  produce: '#2f6fed',
  signer: '#7c3aed',
  file_service: '#d97706',
  vital_signs: '#059669',
  research_management: '#db2777',
  medical_incident: '#ea580c',
  html_editor: '#0d9488',
  phat_thuoc: '#4f46e5',
  BloodStorage_XanhPon: '#e11d48',
  Labconnect_Card: '#65a30d',
  LabconnXP: '#0891b2',
  LabInventory_XP: '#9333ea',
  meta: '#64748b',
  other: '#94a3b8',
  free: '#e8eef5',
};

const CHART_CONTAINER_PROPS = { className: 'h-full w-full' };
const CHART_UPDATE_ARGS: [boolean, boolean, boolean] = [true, true, false];

const FALLBACK_COLORS = [
  '#0369a1',
  '#6d28d9',
  '#b45309',
  '#047857',
  '#be123c',
  '#0f766e',
  '#4338ca',
  '#a16207',
];

function cylinderDiameter(width: number, height: number): number {
  if (width < 48 || height < 48) {
    return 160;
  }

  const plotWidth = Math.max(width - 48, 96);
  const plotHeight = Math.max(height - 24, 96);

  return Math.round(Math.min(plotWidth * 0.82, plotHeight * 0.58));
}

function colorFor(id: string): string {
  const named = FOLDER_COLOR[id];
  if (named) {
    return named;
  }

  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? FALLBACK_COLORS[0];
}

export function BackupStorageCylinder({ disk }: BackupStorageCylinderProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [hc, setHc] = useState<typeof Highcharts | null>(null);
  const [Chart, setChart] = useState<typeof HighchartsReactType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const folders = useMemo(
    () => disk.folders.filter((folder) => folder.bytes > 0),
    [disk.folders],
  );

  useEffect(() => {
    const node = boxRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((current) => {
        const nextWidth = Math.round(width);
        const nextHeight = Math.round(height);
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return { width: nextWidth, height: nextHeight };
      });
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const highchartsMod = await import('highcharts/esm/highcharts.js');
        await import('highcharts/esm/highcharts-3d.js');
        await import('highcharts/esm/modules/cylinder.js');
        const highcharts = highchartsMod.default;
        const reactMod = await import('highcharts-react-official');

        if (!cancelled) {
          setHc(highcharts);
          setChart(() => reactMod.default);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo<Highcharts.Options>(() => {
    const total = folders.reduce((sum, folder) => sum + folder.bytes, 0);
    const stacked = [...folders].reverse();
    const diameter = cylinderDiameter(box.width, box.height);

    return {
      chart: {
        type: 'cylinder',
        backgroundColor: 'transparent',
        animation: false,
        spacing: [4, 4, 6, 4],
        options3d: {
          enabled: true,
          alpha: 16,
          beta: 6,
          depth: diameter,
          viewDistance: 18,
          frame: {
            visible: 'false',
            size: 0,
            bottom: { size: 0, color: 'transparent', visible: false },
            back: { size: 0, color: 'transparent', visible: false },
            front: { size: 0, color: 'transparent', visible: false },
            left: { size: 0, color: 'transparent', visible: false },
            right: { size: 0, color: 'transparent', visible: false },
            top: { size: 0, color: 'transparent', visible: false },
            side: { size: 0, color: 'transparent' },
          },
        },
      },
      title: { text: undefined },
      accessibility: { enabled: false },
      credits: { enabled: false },
      xAxis: {
        categories: ['Backup'],
        labels: { enabled: false },
        lineWidth: 0,
        tickLength: 0,
      },
      yAxis: {
        min: 0,
        max: total,
        endOnTick: false,
        maxPadding: 0,
        minPadding: 0,
        title: { text: undefined },
        gridLineColor: '#e2e8f0',
        labels: {
          style: { color: '#64748b', fontSize: '10px' },
          formatter() {
            return formatBytesShort(Number(this.value));
          },
        },
      },
      legend: { enabled: false },
      tooltip: { enabled: false },
      plotOptions: {
        series: {
          stacking: 'normal',
          animation: false,
          enableMouseTracking: false,
        },
        cylinder: {
          pointWidth: diameter,
          depth: diameter,
        },
      },
      series: stacked.map((folder) => ({
        type: 'cylinder' as const,
        id: folder.id,
        name: folder.label,
        color: colorFor(folder.id),
        data: [folder.bytes],
      })),
    };
  }, [box.height, box.width, folders]);

  if (folders.length === 0) {
    return (
      <p className="flex flex-1 items-center text-xs text-slate-500">
        Ổ trống hoặc chưa đo được folder.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 gap-2">
      <div ref={boxRef} className="min-h-0 min-w-0 flex-1">
        {loadError ? (
          <p className="flex h-full items-center text-xs text-red-700">
            {loadError}
          </p>
        ) : hc && Chart ? (
          <Chart
            highcharts={hc}
            options={options}
            updateArgs={CHART_UPDATE_ARGS}
            containerProps={CHART_CONTAINER_PROPS}
          />
        ) : (
          <p className="flex h-full items-center text-xs text-slate-500">
            Đang tải chart…
          </p>
        )}
      </div>
      <ul className="flex w-[11.5rem] shrink-0 flex-col justify-center gap-1 overflow-y-auto py-0.5 xl:w-52">
        {folders.map((folder) => (
          <li
            key={folder.id}
            className="flex items-baseline justify-between gap-2 text-[11px] leading-tight xl:text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-700">
              <span
                className="mt-0.5 h-2 w-2 shrink-0 rounded-full border border-slate-200"
                style={{ backgroundColor: colorFor(folder.id) }}
                aria-hidden
              />
              <span className="truncate">{folder.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {formatBytesShort(folder.bytes)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
