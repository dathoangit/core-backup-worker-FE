import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { AppShell } from 'src/components/layout/AppShell';
import { WallboardDashboard } from 'src/components/wallboard/WallboardDashboard';

export default function DashboardPage() {
  const { t } = useTranslation('wallboard');

  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Head>
      <AppShell showChrome={false}>
        <WallboardDashboard />
      </AppShell>
    </>
  );
}
