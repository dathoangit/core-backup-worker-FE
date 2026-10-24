import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import authEn from './locales/en/auth.json';
import commonEn from './locales/en/common.json';
import filesEn from './locales/en/files.json';
import homeEn from './locales/en/home.json';
import layoutEn from './locales/en/layout.json';
import runsEn from './locales/en/runs.json';
import settingsEn from './locales/en/settings.json';
import usersEn from './locales/en/users.json';
import wallboardEn from './locales/en/wallboard.json';

import authVi from './locales/vi/auth.json';
import commonVi from './locales/vi/common.json';
import filesVi from './locales/vi/files.json';
import homeVi from './locales/vi/home.json';
import layoutVi from './locales/vi/layout.json';
import runsVi from './locales/vi/runs.json';
import settingsVi from './locales/vi/settings.json';
import usersVi from './locales/vi/users.json';
import wallboardVi from './locales/vi/wallboard.json';

export const LOCALE_STORAGE_KEY = 'app_locale';
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'vi';

export const NAMESPACES = [
  'common',
  'layout',
  'auth',
  'home',
  'wallboard',
  'runs',
  'files',
  'settings',
  'users',
] as const;

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'vi' || value === 'en';
}

export function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore quota / private mode */
  }
}

export function localeToBcp47(locale: string): string {
  return locale === 'en' ? 'en-US' : 'vi-VN';
}

const resources = {
  vi: {
    common: commonVi,
    layout: layoutVi,
    auth: authVi,
    home: homeVi,
    wallboard: wallboardVi,
    runs: runsVi,
    files: filesVi,
    settings: settingsVi,
    users: usersVi,
  },
  en: {
    common: commonEn,
    layout: layoutEn,
    auth: authEn,
    home: homeEn,
    wallboard: wallboardEn,
    runs: runsEn,
    files: filesEn,
    settings: settingsEn,
    users: usersEn,
  },
};

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    ns: [...NAMESPACES],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
