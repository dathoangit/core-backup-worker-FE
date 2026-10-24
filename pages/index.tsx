import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { AppShell } from 'src/components/layout/AppShell';
import { HomePageContent } from 'src/components/home/HomePageContent';

export default function IndexPage() {
  const { t } = useTranslation('home');

  return (
    <>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Head>
      <AppShell>
        <HomePageContent />
      </AppShell>
    </>
  );
}
