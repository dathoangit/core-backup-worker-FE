import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'src/auth/context';
import { UserManagementPanel } from 'src/components/admin/users/UserManagementPanel';
import { AppShell } from 'src/components/layout/AppShell';

export default function AdminUsersPage() {
  const { t } = useTranslation(['users', 'layout']);
  const router = useRouter();
  const { isBootstrapping, role } = useAuth();

  useEffect(() => {
    if (isBootstrapping || role === 'admin') {
      return;
    }

    void router.replace('/');
  }, [isBootstrapping, role, router]);

  if (isBootstrapping || role !== 'admin') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-slate-600">{t('layout:authGate.checkingAccess')}</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{t('users:meta.title')}</title>
        <meta name="description" content={t('users:meta.description')} />
      </Head>
      <AppShell>
        <section className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
          <UserManagementPanel />
        </section>
      </AppShell>
    </>
  );
}
