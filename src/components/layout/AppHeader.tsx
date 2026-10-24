import { useRouter } from 'next/router';
import { APP_BRAND_THEME, APP_ORG_NAME } from 'src/constants/branding';
import { useAuth } from 'src/auth/context';
import { AdminNav } from './AdminNav';
import { AlertBell } from './AlertBell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AppHeaderBrandLink, UserAccountMenu } from './UserAccountMenu';

export function AppHeader() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();
  const isLoginPage = router.pathname === '/login';

  if (isLoginPage || !isAuthenticated) {
    return null;
  }

  return (
    <header
      className={`print:hidden sticky top-0 z-40 w-full border-b ${APP_BRAND_THEME.header.border} ${APP_BRAND_THEME.header.bg} ${APP_BRAND_THEME.header.text}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0 shrink-0">
          <AppHeaderBrandLink />
          <p
            className={`mt-0.5 hidden truncate text-xs sm:block ${APP_BRAND_THEME.header.subtle}`}>
            {APP_ORG_NAME}
          </p>
        </div>

        {role === 'admin' ? <AdminNav /> : <div className="flex-1" />}

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher variant="header" />
          <AlertBell />
          <UserAccountMenu />
        </div>
      </div>
    </header>
  );
}
