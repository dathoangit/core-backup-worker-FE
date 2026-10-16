import { useRouter } from 'next/router';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from 'src/auth/context';

type AdminPageGateProps = {
  children: ReactNode;
};

/** Shared bootstrap + admin role check for page shells. */
export function AdminPageGate({ children }: AdminPageGateProps) {
  const router = useRouter();
  const { isBootstrapping, role } = useAuth();

  useEffect(() => {
    if (isBootstrapping || role === 'admin') {
      return;
    }

    void router.replace('/');
  }, [isBootstrapping, role, router]);

  if (isBootstrapping || role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">Đang kiểm tra quyền truy cập...</p>
      </main>
    );
  }

  return <>{children}</>;
}
