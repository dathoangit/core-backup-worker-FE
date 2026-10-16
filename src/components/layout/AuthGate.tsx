import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';
import { isAdminOnlyPath } from 'src/auth/admin-paths';
import { useAuth } from 'src/auth/context';
import { getDefaultLandingPath } from 'src/auth/role-routing';

const PUBLIC_PATHS = ['/login', '/404', '/dashboard'];

function isPathPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/');
}

function isPathProtected(pathname: string): boolean {
  return !isPathPublic(pathname);
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">{message}</p>
    </main>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const path = router.pathname;
  const isPublic = isPathPublic(path);
  const isProtected = isPathProtected(path);
  const needsAdmin = isAdminOnlyPath(path);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isAuthenticated && isProtected) {
      void router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublic && path === '/login') {
      if (!user) {
        return;
      }
      void router.replace(getDefaultLandingPath(user.role));
      return;
    }

    if (isAuthenticated && needsAdmin && user?.role !== 'admin') {
      void router.replace('/');
    }
  }, [
    isAuthenticated,
    isBootstrapping,
    isProtected,
    isPublic,
    needsAdmin,
    path,
    router,
    user,
  ]);

  if (isBootstrapping) {
    return <AuthLoadingScreen message="Checking auth session..." />;
  }

  if (!isAuthenticated && isProtected) {
    return <AuthLoadingScreen message="Redirecting to login..." />;
  }

  if (isAuthenticated && path === '/login') {
    return <AuthLoadingScreen message="Redirecting to home..." />;
  }

  if (isAuthenticated && needsAdmin && user?.role !== 'admin') {
    return <AuthLoadingScreen message="Redirecting..." />;
  }

  return <>{children}</>;
}
