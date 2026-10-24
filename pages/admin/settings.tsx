import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Legacy route → /config. */
export default function AdminSettingsRedirectPage() {
  const router = useRouter();
  const { t } = useTranslation('layout');

  useEffect(() => {
    void router.replace('/config');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p className="text-sm text-slate-600">{t('authGate.redirectGeneric')}</p>
    </main>
  );
}
