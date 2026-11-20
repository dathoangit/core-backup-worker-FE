import { useTranslation } from 'react-i18next';
import type { WallboardThemeMode } from './wallboard-theme';

type WallboardThemeToggleProps = {
  theme: WallboardThemeMode;
  onChange: (theme: WallboardThemeMode) => void;
};

export function WallboardThemeToggle({
  theme,
  onChange,
}: WallboardThemeToggleProps) {
  const { t } = useTranslation('wallboard');

  return (
    <div
      role="group"
      aria-label={t('theme.aria')}
      className="inline-flex shrink-0 overflow-hidden rounded-lg border border-white/30 bg-white/10 text-xs font-semibold">
      <button
        type="button"
        aria-pressed={theme === 'light'}
        onClick={() => onChange('light')}
        className={`px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-2.5 ${
          theme === 'light'
            ? 'bg-white/25 text-white'
            : 'text-sky-100 hover:bg-white/10 hover:text-white'
        }`}>
        {t('theme.light')}
      </button>
      <button
        type="button"
        aria-pressed={theme === 'dark'}
        onClick={() => onChange('dark')}
        className={`px-2 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:px-2.5 ${
          theme === 'dark'
            ? 'bg-white/25 text-white'
            : 'text-sky-100 hover:bg-white/10 hover:text-white'
        }`}>
        {t('theme.dark')}
      </button>
    </div>
  );
}
