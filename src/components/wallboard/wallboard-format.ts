import i18n from 'src/i18n';

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return '—';
  }

  const diffSec = Math.round((Date.now() - t.getTime()) / 1000);
  if (diffSec < 60) {
    return i18n.t('common:time.justNow');
  }
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) {
    return i18n.t('common:time.minutesAgo', { count: diffMin });
  }
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 48) {
    return i18n.t('common:time.hoursAgo', { count: diffHour });
  }
  const diffDay = Math.round(diffHour / 24);
  return i18n.t('common:time.daysAgo', { count: diffDay });
}

export function formatShortDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) {
    return dateKey;
  }
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

export function percent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

export function formatBytesShort(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function formatCompactCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }
  if (n < 1000) {
    return String(Math.round(n));
  }
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(k >= 10 ? 0 : 1)}k`;
  }
  const m = n / 1_000_000;
  return `${m >= 100 ? Math.round(m) : m.toFixed(m >= 10 ? 0 : 1)}M`;
}

export function formatRowsPerSec(rowsPerSec: number): string {
  return i18n.t('wallboard:format.rowsPerSec', {
    value: formatCompactCount(rowsPerSec),
  });
}

export function formatBytesPerSec(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) {
    return '0 MB/s';
  }
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 10) {
    return `${Math.round(mb)} MB/s`;
  }
  if (mb >= 0.1) {
    return `${mb.toFixed(1)} MB/s`;
  }
  const kb = bytesPerSec / 1024;
  return `${kb >= 10 ? Math.round(kb) : kb.toFixed(1)} KB/s`;
}

export function formatEta(etaSeconds: number | null | undefined): string {
  if (etaSeconds == null || !Number.isFinite(etaSeconds) || etaSeconds < 0) {
    return '—';
  }
  const total = Math.round(etaSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatCountdown(targetIso: string | null | undefined): string {
  if (!targetIso) {
    return '—';
  }
  const target = new Date(targetIso);
  if (Number.isNaN(target.getTime())) {
    return '—';
  }
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return '00h 00m';
  }
  const totalMin = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  if (days > 0) {
    return i18n.t('wallboard:format.countdownDaysHours', {
      days,
      hours: String(hours).padStart(2, '0'),
    });
  }
  return i18n.t('wallboard:format.countdownHoursMinutes', {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
  });
}

export function formatDailyGrowth(bytesPerDay: number | null | undefined): string {
  if (bytesPerDay == null || !Number.isFinite(bytesPerDay)) {
    return '—';
  }
  if (bytesPerDay <= 0) {
    return i18n.t('wallboard:format.zeroGrowthPerDay');
  }
  return i18n.t('wallboard:format.growthPerDay', {
    value: formatBytesShort(bytesPerDay),
  });
}

export function formatCompression(
  ratio: number | null | undefined,
  savingsPercent: number | null | undefined,
): string {
  if (ratio == null || !Number.isFinite(ratio)) {
    return '—';
  }
  const savings =
    savingsPercent != null && Number.isFinite(savingsPercent)
      ? ` / -${Math.abs(savingsPercent)}%`
      : '';
  return `${ratio.toFixed(1)}x${savings}`;
}

export type LagTone = 'ok' | 'warn' | 'error' | 'neutral';

export function lagBadge(lagMinutes: number | null | undefined): {
  tone: LagTone;
  label: string;
} {
  if (lagMinutes == null || !Number.isFinite(lagMinutes)) {
    return { tone: 'neutral', label: i18n.t('common:lag.noData') };
  }
  if (lagMinutes < 15) {
    return { tone: 'ok', label: i18n.t('common:lag.under15m') };
  }
  if (lagMinutes < 60) {
    return { tone: 'warn', label: i18n.t('common:lag.under1h') };
  }
  if (lagMinutes <= 6 * 60) {
    return { tone: 'warn', label: i18n.t('common:lag.from1hTo6h') };
  }
  return { tone: 'error', label: i18n.t('common:lag.over6h') };
}
