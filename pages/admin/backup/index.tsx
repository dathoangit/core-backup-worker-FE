import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Legacy route → home dashboard. */
export default function AdminBackupRedirectPage() {
  const router = useRouter();
  const { t } = useTranslation('layout');

  useEffect(() => {
    void router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">{t('authGate.redirectGeneric')}</p>
    </main>
  );
}
