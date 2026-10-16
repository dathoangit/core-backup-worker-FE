import type { ReactNode } from 'react';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';

type AppShellProps = {
  children: ReactNode;
  /** When false, header and footer are omitted (e.g. login). */
  showChrome?: boolean;
};

export function AppShell({ children, showChrome = true }: AppShellProps) {
  if (!showChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AppHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <AppFooter />
    </div>
  );
}
