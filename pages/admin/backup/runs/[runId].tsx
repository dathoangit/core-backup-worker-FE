import { useRouter } from 'next/router';
import { useEffect } from 'react';

/** Legacy route → /runs/[runId]. */
export default function AdminBackupRunRedirectPage() {
  const router = useRouter();
  const runIdParam = router.query.runId;
  const runId = typeof runIdParam === 'string' ? runIdParam : '';

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (!runId) {
      void router.replace('/runs');
      return;
    }
    void router.replace(`/runs/${encodeURIComponent(runId)}`);
  }, [router, runId]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">Đang chuyển hướng...</p>
    </main>
  );
}
