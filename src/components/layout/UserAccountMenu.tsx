import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from 'src/auth/context';
import {
  APP_BRAND_SHORT_NAME,
  APP_BRAND_THEME,
  APP_LOGO_SRC,
} from 'src/constants/branding';
import { getRoleLabel } from 'src/constants/role-labels';

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function UserAccountMenu() {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setOpen(false);
    logout();
    await router.replace('/login');
  }, [logout, router]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const roleLabel = getRoleLabel(user.role);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Tài khoản người dùng"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex max-w-[min(100vw-8rem,14rem)] items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1.5 text-sm font-medium ${APP_BRAND_THEME.header.text} transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:max-w-none sm:gap-2 sm:px-3 sm:py-2`}>
        <span className="truncate">{user.username}</span>
        <ChevronDownIcon open={open} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),18rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg sm:w-72">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-base font-semibold text-slate-900">
              {user.username}
            </p>
            <dl className="mt-2 space-y-1 text-sm text-slate-600">
              <div>
                <dt className="sr-only">Vai trò</dt>
                <dd>Vai trò: {roleLabel}</dd>
              </div>
              {user.email ? (
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd className="truncate">Email: {user.email}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="space-y-2 p-3">
            {role === 'admin' ? (
              <Link
                href="/admin/users"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                Quản lý người dùng
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
              Đăng xuất
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppHeaderBrandLink() {
  return (
    <Link
      href="/"
      className="inline-flex min-w-0 items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-red-700 sm:gap-3">
      <Image
        src={APP_LOGO_SRC}
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 rounded-lg bg-white/95 object-contain p-0.5 sm:h-10 sm:w-10"
      />
      <span className="truncate text-sm font-semibold sm:text-base">
        {APP_BRAND_SHORT_NAME}
      </span>
    </Link>
  );
}
