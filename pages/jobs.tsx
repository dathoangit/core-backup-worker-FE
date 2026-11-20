import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { JobsOperationsPanel } from 'src/components/backup/JobsOperationsPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function JobsPage() {
  const { t } = useTranslation('runs');

  return (
    <AdminPageGate>
      <Head>
        <title>{t('jobsPage.metaTitle')}</title>
        <meta name="description" content={t('jobsPage.metaDescription')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <JobsOperationsPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
