import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { APP_BRAND_THEME } from 'src/constants/branding';

const NAV_ITEMS = [
  { href: '/', labelKey: 'nav.overview', match: (path: string) => path === '/' },
  {
    href: '/dashboard',
    labelKey: 'nav.wallboard',
    match: (path: string) => path === '/dashboard',
  },
  {
    href: '/runs',
    labelKey: 'nav.runs',
    match: (path: string) => path === '/runs' || path.startsWith('/runs/'),
  },
  {
    href: '/files',
    labelKey: 'nav.files',
    match: (path: string) => path === '/files' || path.startsWith('/files/'),
  },
  {
    href: '/config',
    labelKey: 'nav.config',
    match: (path: string) => path === '/config' || path.startsWith('/config'),
  },
] as const;

export function AdminNav() {
  const router = useRouter();
  const path = router.pathname;
  const { t } = useTranslation('layout');

  return (
    <nav
      aria-label={t('nav.aria')}
      className="flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-2">
      {NAV_ITEMS.map((item) => {
        const active = item.match(path);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
              active
                ? 'bg-white/20 text-white'
                : `${APP_BRAND_THEME.header.subtle} hover:bg-white/10 hover:text-white`
            }`}>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
