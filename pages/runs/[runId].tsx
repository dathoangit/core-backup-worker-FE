import Head from 'next/head';
import { useRouter } from 'next/router';
import { BackupRunDetail } from 'src/components/admin/backup/BackupRunDetail';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function RunDetailPage() {
  const router = useRouter();
  const runIdParam = router.query.runId;
  const runId = typeof runIdParam === 'string' ? runIdParam : '';

  if (!router.isReady || !runId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">Đang tải...</p>
      </main>
    );
  }

  return (
    <AdminPageGate>
      <Head>
        <title>Backup run {runId}</title>
        <meta name="description" content={`Chi tiết backup run ${runId}.`} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <BackupRunDetail runId={runId} />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
