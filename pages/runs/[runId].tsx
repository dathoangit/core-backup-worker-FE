import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { BackupRunDetail } from 'src/components/admin/backup/BackupRunDetail';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function RunDetailPage() {
  const { t } = useTranslation(['runs', 'common']);
  const router = useRouter();
  const runIdParam = router.query.runId;
  const runId = typeof runIdParam === 'string' ? runIdParam : '';

  if (!router.isReady || !runId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">{t('common:loading.generic')}</p>
      </main>
    );
  }

  return (
    <AdminPageGate>
      <Head>
        <title>{t('runs:detail.metaTitle', { runId })}</title>
        <meta
          name="description"
          content={t('runs:detail.metaDescription', { runId })}
        />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <BackupRunDetail runId={runId} />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
