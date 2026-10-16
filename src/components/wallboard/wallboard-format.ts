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
    return 'vừa xong';
  }
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin} phút trước`;
  }
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 48) {
    return `${diffHour} giờ trước`;
  }
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} ngày trước`;
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

export function diskBarTone(usedPercent: number): 'ok' | 'warn' | 'error' {
  if (usedPercent >= 90) {
    return 'error';
  }
  if (usedPercent >= 80) {
    return 'warn';
  }
  return 'ok';
}
