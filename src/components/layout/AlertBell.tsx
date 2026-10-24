import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'src/auth/context';
import i18n from 'src/i18n';
import { useToast } from 'src/components/ui/ToastProvider';
import { useBackupStream } from 'src/hooks/useBackupStream';

const SEEN_KEY = 'backup.alerts.lastSeenAt';
const TOASTED_KEY = 'backup.alerts.toasted';
const toastedThisSession = new Set<string>();

type AlertItem = {
  runId: string;
  status: 'error' | 'partial';
  at: string;
  error?: string | null;
};

function readLastSeen(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(SEEN_KEY);
}

function writeLastSeen(iso: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(SEEN_KEY, iso);
}

function toastKey(runId: string, status: string): string {
  return `${runId}:${status}`;
}

function readToastedKeys(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(TOASTED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function claimToast(runId: string, status: string): boolean {
  const key = toastKey(runId, status);
  if (toastedThisSession.has(key) || readToastedKeys().includes(key)) {
    return false;
  }
  toastedThisSession.add(key);
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    const keys = readToastedKeys();
    window.sessionStorage.setItem(
      TOASTED_KEY,
      JSON.stringify([...keys, key].slice(-50)),
    );
  } catch {
    // sessionStorage can throw in private mode; the in-memory set still dedupes.
  }
  return true;
}

export function AlertBell() {
  const { t } = useTranslation(['layout', 'common']);
  const { role } = useAuth();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AlertItem[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  useEffect(() => {
    setLastSeenAt(readLastSeen());
  }, []);

  useBackupStream({
    enabled: role === 'admin',
    onStatus: (event, source) => {
      if (event.status !== 'error' && event.status !== 'partial') {
        return;
      }
      const item: AlertItem = {
        runId: event.runId,
        status: event.status,
        at: event.at,
        error: event.error,
      };
      setItems((prev) =>
        [item, ...prev.filter((row) => row.runId !== item.runId)].slice(0, 20),
      );
      if (source !== 'live' || !claimToast(event.runId, event.status)) {
        return;
      }
      pushToast({
        tone: event.status === 'error' ? 'error' : 'warning',
        title:
          event.status === 'error'
            ? i18n.t('alerts.backupFailed', { ns: 'layout' })
            : i18n.t('alerts.backupPartial', { ns: 'layout' }),
        message: `${event.runId}${event.error ? ` — ${event.error}` : ''}`,
      });
    },
  });

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) {
      return items.length;
    }
    return items.filter((item) => item.at > lastSeenAt).length;
  }, [items, lastSeenAt]);

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    writeLastSeen(now);
    setLastSeenAt(now);
  }, []);

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            markSeen();
          }
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        aria-label={t('alerts.ariaBell')}>
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M10 2a4.5 4.5 0 00-4.5 4.5v.7c0 .8-.25 1.58-.72 2.24L3.6 11.1A1.25 1.25 0 004.6 13h10.8a1.25 1.25 0 001-1.9l-1.18-1.66a3.9 3.9 0 01-.72-2.24v-.7A4.5 4.5 0 0010 2zm0 16a2.25 2.25 0 01-2.12-1.5h4.24A2.25 2.25 0 0110 18z" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? t('common:badge.overflow9Plus') : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">
              {t('alerts.panelTitle')}
            </p>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => setOpen(false)}>
              {t('common:actions.close')}
            </button>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-slate-500">{t('alerts.empty')}</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li key={`${item.runId}-${item.at}`}>
                  <Link
                    href={`/runs/${encodeURIComponent(item.runId)}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {item.status}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-800">
                      {item.runId}
                    </p>
                    {item.error ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                        {item.error}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
