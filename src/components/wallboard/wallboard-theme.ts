/**
 * Wallboard tokens: Framed sheet (light) / True-black flat (dark).
 * CSS vars live on `.wb-root`; JS maps feed Recharts / Highcharts.
 */

export type WallboardThemeMode = 'light' | 'dark';

export const WALLBOARD_THEME_STORAGE_KEY = 'wallboardTheme:v1';

export type WallboardPalette = {
  ground: string;
  surface: string;
  raised: string;
  border: string;
  rule: string;
  control: string;
  text: string;
  muted: string;
  chart: string;
  status: {
    ok: string;
    error: string;
    partial: string;
    running: string;
  };
};

export const WB_LIGHT: WallboardPalette = {
  ground: '#f7f2f2',
  surface: '#ffffff',
  raised: '#f4f6f8',
  border: '#e8eaec',
  rule: '#f0f1f2',
  control: '#cdced1',
  text: '#131416',
  muted: '#5d5f60',
  chart: '#1e5a8c',
  status: {
    ok: '#1e7b4f',
    error: '#c4242a',
    partial: '#a86f0c',
    running: '#1e5a8c',
  },
};

/** True-black flat; crest blue for chart/running (not library lime). */
export const WB_DARK: WallboardPalette = {
  ground: '#000000',
  surface: '#111111',
  raised: '#2a2a2a',
  border: '#1a1a1a',
  rule: '#161616',
  control: '#444444',
  text: '#ffffff',
  muted: '#b4b4b4',
  chart: '#4cb3f0',
  status: {
    ok: '#86efac',
    error: '#e5566f',
    partial: '#e5a93b',
    running: '#4cb3f0',
  },
};

export function paletteFor(mode: WallboardThemeMode): WallboardPalette {
  return mode === 'dark' ? WB_DARK : WB_LIGHT;
}

/** @deprecated Prefer paletteFor(mode) for charts; kept for gradual migration. */
export const WB = WB_LIGHT;

/** Tailwind utility bundles — resolve via CSS vars on `.wb-root`. */
export const wbClass = {
  root: 'wb-root bg-[var(--wb-ground)] text-[var(--wb-text)]',
  panel:
    'rounded-lg border border-[var(--wb-border)] bg-[var(--wb-surface)] p-2.5 xl:p-3 shadow-none',
  panelTitle:
    'text-sm font-semibold tracking-tight text-[var(--wb-text)] xl:text-base',
  panelSubtitle: 'truncate text-[11px] text-[var(--wb-muted)] xl:text-xs',
  raised: 'border border-[var(--wb-border)] bg-[var(--wb-raised)]',
  surface: 'border border-[var(--wb-border)] bg-[var(--wb-surface)]',
  muted: 'text-[var(--wb-muted)]',
  ink: 'text-[var(--wb-text)]',
  mono: 'font-mono tabular-nums',
  kpi: 'font-semibold tabular-nums text-[var(--wb-text)]',
  pillOk: 'bg-[var(--wb-pill-ok-bg)] text-[var(--wb-pill-ok-fg)]',
  pillWarn: 'bg-[var(--wb-pill-warn-bg)] text-[var(--wb-pill-warn-fg)]',
  pillErr: 'bg-[var(--wb-pill-err-bg)] text-[var(--wb-pill-err-fg)]',
  pillNeutral: 'bg-[var(--wb-pill-neutral-bg)] text-[var(--wb-pill-neutral-fg)]',
  legendOk: 'text-[var(--wb-ok)]',
  legendErr: 'text-[var(--wb-pill-err-fg)]',
  legendPartial: 'text-[var(--wb-warn-fg)]',
  legendRunning: 'text-[var(--wb-running)]',
  chartSoft: 'border border-[var(--wb-chart-soft-border)] bg-[var(--wb-chart-soft)]',
  chartInk: 'text-[var(--wb-chart)]',
  warnSoft: 'border border-[var(--wb-warn-soft-border)] bg-[var(--wb-pill-warn-bg)]',
  warnInk: 'text-[var(--wb-warn-fg)]',
  ruleBorder: 'border-[var(--wb-rule)]',
  controlText: 'text-[var(--wb-control)]',
  metricBox: 'border border-[var(--wb-border)] bg-[var(--wb-raised)]',
  dashedIdle:
    'border border-dashed border-[var(--wb-border)] bg-[var(--wb-raised)]',
  progressTrack: 'bg-[var(--wb-rule)]',
  dotOk: 'bg-[var(--wb-ok)]',
  dotErr: 'bg-[var(--wb-err)]',
  dotWarn: 'bg-[var(--wb-warn)]',
  dotRunning: 'bg-[var(--wb-running)]',
  dotNeutral: 'bg-[var(--wb-control)]',
} as const;
