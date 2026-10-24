import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { FileExplorerPanel } from 'src/components/backup/FileExplorerPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';

export default function FilesPage() {
  const { t } = useTranslation('files');

  return (
    <AdminPageGate>
      <Head>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-10">
          <FileExplorerPanel />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
