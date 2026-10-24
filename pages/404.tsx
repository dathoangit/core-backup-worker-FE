import { useTranslation } from 'react-i18next';

export default function Custom404() {
  const { t } = useTranslation('common');

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <h1 className="text-center text-3xl font-bold text-gray-700">
        {t('notFound.title')}
      </h1>
    </main>
  );
}
