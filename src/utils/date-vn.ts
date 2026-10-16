/**
 * Local calendar date for `<input type="date">` and display helpers for API ISO strings.
 * Display uses the browser's default timezone ("machine" local time).
 */

/** YYYY-MM-DD for date inputs using the browser local calendar (avoids UTC day shift from `toISOString()`). */
export function formatLocalDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatIsoAsLocalDate(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
  }).format(t);
}

export function formatIsoAsLocalDateTime(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(t);
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` → `DD/MM/YYYY` for manual date-of-birth entry. */
export function isoYmdToDdMmYyyy(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return '';
  }
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formats typed digits (and optional slashes) into `DD/MM/YYYY` as the user types.
 * Example: `10061997` → `10/06/1997`.
 */
export function formatDateOfBirthDisplayInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length === 0) {
    return '';
  }
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Parses `DD/MM/YYYY` (with or without slashes) into `YYYY-MM-DD` if the calendar date is valid and ≤ maxIso (YYYY-MM-DD).
 */
export function parseDdMmYyyyToIsoYmd(
  display: string,
  maxIsoYmd: string,
): string | null {
  const trimmed = display.trim();
  if (!trimmed) {
    return null;
  }

  let day: number;
  let month: number;
  let year: number;

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    day = Number.parseInt(slash[1], 10);
    month = Number.parseInt(slash[2], 10);
    year = Number.parseInt(slash[3], 10);
  } else {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length !== 8) {
      return null;
    }
    day = Number.parseInt(digits.slice(0, 2), 10);
    month = Number.parseInt(digits.slice(2, 4), 10);
    year = Number.parseInt(digits.slice(4, 8), 10);
  }

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const local = new Date(year, month - 1, day);
  if (
    local.getFullYear() !== year ||
    local.getMonth() !== month - 1 ||
    local.getDate() !== day
  ) {
    return null;
  }

  const iso = `${year}-${pad2(month)}-${pad2(day)}`;
  if (iso > maxIsoYmd) {
    return null;
  }
  return iso;
}
