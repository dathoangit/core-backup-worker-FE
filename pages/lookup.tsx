import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { BackupLookupPanel } from 'src/components/admin/backup/BackupLookupPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function LookupPage() {
  const { t } = useTranslation('runs');

  return (
    <AdminPageGate>
      <Head>
        <title>{t('lookup.metaTitle')}</title>
        <meta name="description" content={t('lookup.metaDescription')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h1 className="text-xl font-semibold text-slate-900">
              {t('lookup.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{t('lookup.subtitle')}</p>
            <div className="mt-6">
              <BackupLookupPanel />
            </div>
          </div>
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
