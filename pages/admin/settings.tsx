import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** Legacy route → /config. */
export default function AdminSettingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    void router.replace('/config');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">Đang chuyển hướng...</p>
    </main>
  );
}
