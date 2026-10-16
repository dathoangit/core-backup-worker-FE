import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** Legacy route → home dashboard. */
export default function AdminBackupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">Đang chuyển hướng...</p>
    </main>
  );
}
