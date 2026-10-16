import type { ReactNode } from 'react';

type WallboardPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function WallboardPanel({
  title,
  subtitle,
  children,
  className = '',
}: WallboardPanelProps) {
  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm xl:p-3 ${className}`}>
      <header className="mb-1.5 shrink-0">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 xl:text-base">
          {title}
        </h2>
        {subtitle ? (
          <p className="truncate text-[11px] text-slate-500 xl:text-xs">
            {subtitle}
          </p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
