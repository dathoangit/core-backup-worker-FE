import Link from 'next/link';
import { useRouter } from 'next/router';
import { APP_BRAND_THEME } from 'src/constants/branding';

const NAV_ITEMS = [
  { href: '/', label: 'Tổng quan', match: (path: string) => path === '/' },
  {
    href: '/dashboard',
    label: 'Màn hình trung tâm',
    match: (path: string) => path === '/dashboard',
  },
  {
    href: '/runs',
    label: 'Lịch sử',
    match: (path: string) => path === '/runs' || path.startsWith('/runs/'),
  },
  {
    href: '/files',
    label: 'Tra cứu file',
    match: (path: string) => path === '/files' || path.startsWith('/files/'),
  },
  {
    href: '/config',
    label: 'Cấu hình',
    match: (path: string) => path === '/config' || path.startsWith('/config'),
  },
] as const;

export function AdminNav() {
  const router = useRouter();
  const path = router.pathname;

  return (
    <nav
      aria-label="Điều hướng chính"
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
