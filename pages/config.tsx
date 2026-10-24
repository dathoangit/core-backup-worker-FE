import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { SettingsManagementPanel } from 'src/components/admin/settings/SettingsManagementPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function ConfigPage() {
  const { t } = useTranslation('settings');

  return (
    <AdminPageGate>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <SettingsManagementPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
