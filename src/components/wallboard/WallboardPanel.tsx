import type { ReactNode } from 'react';
import { wbClass } from './wallboard-theme';

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
      className={`flex min-h-0 flex-col overflow-hidden ${wbClass.panel} ${className}`}>
      <header className="mb-1.5 shrink-0">
        <h2 className={wbClass.panelTitle}>{title}</h2>
        {subtitle ? (
          <p className={wbClass.panelSubtitle}>{subtitle}</p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
