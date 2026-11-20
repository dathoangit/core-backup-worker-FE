import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type Highcharts from 'highcharts';
import type HighchartsReactType from 'highcharts-react-official';
import type { WallboardDisk } from 'src/types/wallboard';
import { AutoScrollRows } from './AutoScrollRows';
import { useWallboardPalette } from './WallboardThemeContext';
import { formatBytesShort } from './wallboard-format';
import { wbClass } from './wallboard-theme';

const LEGEND_GAP_PX = 4;
/** Approx one legend line (text + leading) for visible-row math. */
const LEGEND_ROW_ESTIMATE_PX = 18;
const LEGEND_VISIBLE_MIN = 4;

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
  free: '#f0f1f2',
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

function colorFor(id: string, freeColor: string): string {
  if (id === 'free') {
    return freeColor;
  }
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
  const { t } = useTranslation('wallboard');
  const { palette } = useWallboardPalette();
  const boxRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [legendVisible, setLegendVisible] = useState(LEGEND_VISIBLE_MIN);
  const [hc, setHc] = useState<typeof Highcharts | null>(null);
  const [Chart, setChart] = useState<typeof HighchartsReactType | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const folders = useMemo(
    () => (disk.folders ?? []).filter((folder) => folder.bytes > 0),
    [disk.folders],
  );
  const chartReady = box.width >= 48 && box.height >= 48;

  useEffect(() => {
    const node = boxRef.current;
    if (!node) {
      return;
    }

    const applySize = (width: number, height: number) => {
      const nextWidth = Math.round(width);
      const nextHeight = Math.round(height);
      setBox((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    // Seed immediately — Highcharts must not mount at 0×0 (F5 race).
    const rect = node.getBoundingClientRect();
    applySize(rect.width, rect.height);

    const observer = new ResizeObserver(([entry]) => {
      applySize(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = legendRef.current;
    if (!node) {
      return;
    }

    const updateVisible = (height: number) => {
      const stride = LEGEND_ROW_ESTIMATE_PX + LEGEND_GAP_PX;
      const count = Math.max(
        LEGEND_VISIBLE_MIN,
        Math.floor((height + LEGEND_GAP_PX) / stride),
      );
      setLegendVisible((prev) => (prev === count ? prev : count));
    };

    updateVisible(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(([entry]) => {
      updateVisible(entry.contentRect.height);
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
    const total = Math.max(
      1,
      folders.reduce((sum, folder) => sum + folder.bytes, 0),
    );
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
        categories: [t('storage.chartCategory')],
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
        gridLineColor: palette.rule,
        labels: {
          style: { color: palette.muted, fontSize: '10px' },
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
        color: colorFor(folder.id, palette.rule),
        data: [folder.bytes],
      })),
    };
  }, [box.height, box.width, folders, palette.muted, palette.rule, t]);

  if (folders.length === 0) {
    return (
      <p className={`flex flex-1 items-center text-xs ${wbClass.muted}`}>
        {t('storage.emptyFolders')}
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 gap-2">
      <div ref={boxRef} className="min-h-0 min-w-0 flex-1">
        {loadError ? (
          <p className={`flex h-full items-center text-xs ${wbClass.legendErr}`}>
            {loadError}
          </p>
        ) : hc && Chart && chartReady ? (
          <Chart
            highcharts={hc}
            options={options}
            updateArgs={CHART_UPDATE_ARGS}
            containerProps={CHART_CONTAINER_PROPS}
          />
        ) : (
          <p className={`flex h-full items-center text-xs ${wbClass.muted}`}>
            {t('storage.loadingChart')}
          </p>
        )}
      </div>
      <div
        ref={legendRef}
        className="flex h-full min-h-0 w-[11.5rem] shrink-0 flex-col self-stretch xl:w-52">
        <AutoScrollRows
          className="h-full min-h-0"
          visibleCount={legendVisible}
          gapPx={LEGEND_GAP_PX}
          items={folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-baseline justify-between gap-2 text-[11px] leading-tight xl:text-xs">
              <span
                className={`flex min-w-0 items-center gap-1.5 ${wbClass.muted}`}>
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full border border-[var(--wb-border)]"
                  style={{
                    backgroundColor: colorFor(folder.id, palette.rule),
                  }}
                  aria-hidden
                />
                <span className="truncate">{folder.label}</span>
              </span>
              <span className={`shrink-0 ${wbClass.kpi}`}>
                {formatBytesShort(folder.bytes)}
              </span>
            </div>
          ))}
        />
      </div>
    </div>
  );
}
