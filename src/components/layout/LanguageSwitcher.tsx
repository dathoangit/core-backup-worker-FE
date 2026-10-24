import { useTranslation } from 'react-i18next';
import type { AppLocale } from 'src/i18n';
import { changeAppLocale } from 'src/i18n/I18nProvider';
import { APP_BRAND_THEME } from 'src/constants/branding';

type LanguageSwitcherProps = {
  /** Dark wallboard / login overlays use light text on dark bg. */
  variant?: 'header' | 'dark' | 'light';
};

const VARIANT_CLASS: Record<
  NonNullable<LanguageSwitcherProps['variant']>,
  { wrap: string; active: string; idle: string }
> = {
  header: {
    wrap: 'border-white/30 bg-white/10',
    active: 'bg-white/25 text-white',
    idle: `${APP_BRAND_THEME.header.subtle} hover:bg-white/10 hover:text-white`,
  },
  dark: {
    wrap: 'border-slate-600 bg-slate-800',
    active: 'bg-slate-600 text-white',
    idle: 'text-slate-300 hover:bg-slate-700 hover:text-white',
  },
  light: {
    wrap: 'border-slate-200 bg-white',
    active: 'bg-sky-600 text-white',
    idle: 'text-slate-600 hover:bg-slate-50',
  },
};

export function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('layout');
  const styles = VARIANT_CLASS[variant];
  const current: AppLocale = i18n.language === 'en' ? 'en' : 'vi';

  const setLocale = (locale: AppLocale) => {
    if (locale === current) {
      return;
    }
    void changeAppLocale(locale);
  };

  return (
    <div
      role="group"
      aria-label={t('language.aria')}
      className={`inline-flex shrink-0 overflow-hidden rounded-lg border text-xs font-semibold ${styles.wrap}`}>
      <button
        type="button"
        aria-pressed={current === 'vi'}
        onClick={() => setLocale('vi')}
        className={`px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-2.5 ${
          current === 'vi' ? styles.active : styles.idle
        }`}>
        VI
      </button>
      <button
        type="button"
        aria-pressed={current === 'en'}
        onClick={() => setLocale('en')}
        className={`px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-2.5 ${
          current === 'en' ? styles.active : styles.idle
        }`}>
        EN
      </button>
    </div>
  );
}
