import { useEffect, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n, {
  persistLocale,
  readStoredLocale,
} from 'src/i18n';
import type { AppLocale } from 'src/i18n';

function LocaleDocumentSync({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== i18nInstance.language) {
      void i18nInstance.changeLanguage(stored);
    }
  }, [i18nInstance]);

  useEffect(() => {
    const syncLang = (lng: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lng === 'en' ? 'en' : 'vi';
      }
      if (lng === 'vi' || lng === 'en') {
        persistLocale(lng);
      }
    };

    syncLang(i18nInstance.language);
    i18nInstance.on('languageChanged', syncLang);
    return () => {
      i18nInstance.off('languageChanged', syncLang);
    };
  }, [i18nInstance]);

  return <>{children}</>;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleDocumentSync>{children}</LocaleDocumentSync>
    </I18nextProvider>
  );
}

export async function changeAppLocale(locale: AppLocale): Promise<void> {
  persistLocale(locale);
  await i18n.changeLanguage(locale);
}
