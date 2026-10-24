import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { DatabaseDetailPanel } from 'src/components/backup/DatabaseDetailPanel';
import { AdminPageGate } from 'src/components/layout/AdminPageGate';
import { AppShell } from 'src/components/layout/AppShell';
import type { SourceGroup } from 'src/types/backup';

const SOURCE_GROUPS: SourceGroup[] = ['HIS', 'EMR', 'BADL', 'LIS', 'PACS'];

function isSourceGroup(value: string): value is SourceGroup {
  return SOURCE_GROUPS.includes(value as SourceGroup);
}

export default function DatabaseDetailPage() {
  const { t } = useTranslation(['runs', 'common']);
  const router = useRouter();
  const groupParam = router.query.group;
  const databaseParam = router.query.database;
  const group = typeof groupParam === 'string' ? groupParam.toUpperCase() : '';
  const database =
    typeof databaseParam === 'string' ? decodeURIComponent(databaseParam) : '';

  if (!router.isReady || !group || !database) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">{t('common:loading.generic')}</p>
      </main>
    );
  }

  if (!isSourceGroup(group)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">{t('runs:databaseDetail.invalidGroup')}</p>
      </main>
    );
  }

  return (
    <AdminPageGate>
      <Head>
        <title>{t('runs:databaseDetail.metaTitle', { database, group })}</title>
        <meta
          name="description"
          content={t('runs:databaseDetail.metaDescription', { database, group })}
        />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <DatabaseDetailPanel group={group} database={database} />
        </section>
      </AppShell>
    </AdminPageGate>
  );
}
