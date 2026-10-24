import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BackupRunLogEvent } from 'src/types/backup-stream';

type RunLogTerminalProps = {
  logs: BackupRunLogEvent[];
  className?: string;
};

function levelClass(level: BackupRunLogEvent['level']): string {
  if (level === 'error') {
    return 'text-rose-300';
  }
  if (level === 'warn') {
    return 'text-amber-300';
  }
  return 'text-emerald-200';
}

export function RunLogTerminal({ logs, className = '' }: RunLogTerminalProps) {
  const { t } = useTranslation('runs');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (!pinned || !scrollerRef.current) {
      return;
    }
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [logs, pinned]);

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-800 bg-slate-950 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <p className="font-mono text-xs text-slate-400">{t('log.title')}</p>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(event) => setPinned(event.target.checked)}
          />
          {t('log.autoScroll')}
        </label>
      </div>
      <div
        ref={scrollerRef}
        onScroll={() => {
          const el = scrollerRef.current;
          if (!el) {
            return;
          }
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          setPinned(atBottom);
        }}
        className="max-h-72 overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
        {logs.length === 0 ? (
          <p className="text-slate-500">{t('log.waiting')}</p>
        ) : (
          logs.map((log, index) => (
            <p key={`${log.at}-${index}`} className={levelClass(log.level)}>
              <span className="text-slate-500">{log.at.slice(11, 19)} </span>
              {log.message}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
