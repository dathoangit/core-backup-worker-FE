/** Hospital / app favicon (served from `public/favicon/`). */
export const APP_FAVICON_SRC = '/favicon/favicon.png';

export const APP_LOGO_SRC = '/favicon/favicon.png';

export const APP_LOGO_TEXT_SRC = '/images/logo.png';

/** Wordmark on the login card (`text.png`). */
export const APP_LOGIN_TEXT_SRC = '/images/logo.png';

export const APP_LOGIN_BG_SRC = '/images/logo.png';

export const APP_BRAND_SHORT_NAME = 'Base Application';

export const APP_ORG_NAME = 'Bệnh viện Đa khoa Xanh Pôn';

/** Brand chrome aligned with logo (red header, blue footer). */
export const APP_BRAND_THEME = {
  header: {
    bg: 'bg-red-700',
    border: 'border-red-800',
    text: 'text-white',
    subtle: 'text-red-100',
  },
  footer: {
    bg: 'bg-sky-800',
    border: 'border-sky-900',
    text: 'text-sky-50',
    muted: 'text-sky-200',
    accent: 'text-sky-100',
    divider: 'border-sky-600/50',
    linkHover: 'hover:text-white',
  },
} as const;
