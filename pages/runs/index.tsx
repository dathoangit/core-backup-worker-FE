import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { RunsHistoryPanel } from 'src/components/backup/RunsHistoryPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function RunsPage() {
  const { t } = useTranslation('runs');

  return (
    <AdminPageGate>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <RunsHistoryPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
