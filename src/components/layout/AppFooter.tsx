import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  APP_BRAND_SHORT_NAME,
  APP_BRAND_THEME,
  APP_LOGO_SRC,
  APP_ORG_NAME,
} from 'src/constants/branding';
import { HOME_PATH } from 'src/auth/role-routing';

const footerLinkClass = `text-sm ${APP_BRAND_THEME.footer.accent} transition ${APP_BRAND_THEME.footer.linkHover}`;

export function AppFooter() {
  const { t } = useTranslation('layout');
  const year = new Date().getFullYear();

  return (
    <footer
      className={`print:hidden mt-auto w-full border-t ${APP_BRAND_THEME.footer.border} ${APP_BRAND_THEME.footer.bg} ${APP_BRAND_THEME.footer.text}`}>
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 md:py-10">
        <div className="md:hidden">
          <Link
            href={HOME_PATH}
            className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-800">
            <Image
              src={APP_LOGO_SRC}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg bg-white/95 object-contain p-0.5"
            />
            <span className="text-sm font-semibold text-white">
              {APP_BRAND_SHORT_NAME}
            </span>
          </Link>
          <nav
            className="mt-3 flex flex-wrap gap-x-4 gap-y-1"
            aria-label={t('footer.ariaNav')}>
            <Link href={HOME_PATH} className={`text-xs ${footerLinkClass}`}>
              {t('footer.home')}
            </Link>
          </nav>
          <p
            className={`mt-3 text-[11px] leading-snug ${APP_BRAND_THEME.footer.muted}`}>
            {t('footer.copyrightCompact', {
              year,
              org: APP_ORG_NAME,
              brand: APP_BRAND_SHORT_NAME,
            })}
          </p>
        </div>

        <div className="hidden gap-8 md:grid md:grid-cols-12">
          <div className="md:col-span-5">
            <Link
              href={HOME_PATH}
              className="inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-800">
              <Image
                src={APP_LOGO_SRC}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg bg-white/95 object-contain p-0.5"
              />
              <span className="text-lg font-semibold text-white">
                {APP_BRAND_SHORT_NAME}
              </span>
            </Link>
            <p
              className={`mt-4 max-w-sm text-sm leading-relaxed ${APP_BRAND_THEME.footer.muted}`}>
              {t('footer.tagline', { org: APP_ORG_NAME })}
            </p>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t('footer.navSection')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href={HOME_PATH} className={footerLinkClass}>
                  {t('footer.home')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              {t('footer.operatorSection')}
            </h2>
            <dl
              className={`mt-4 space-y-3 text-sm ${APP_BRAND_THEME.footer.accent}`}>
              <div>
                <dt className={`text-xs ${APP_BRAND_THEME.footer.muted}`}>
                  {t('footer.facility')}
                </dt>
                <dd className="mt-0.5 font-medium text-white">{APP_ORG_NAME}</dd>
              </div>
              <div>
                <dt className={`text-xs ${APP_BRAND_THEME.footer.muted}`}>
                  {t('footer.platform')}
                </dt>
                <dd className="mt-0.5 font-medium text-white">
                  {APP_BRAND_SHORT_NAME}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div
          className={`hidden border-t pt-6 text-xs md:mt-10 md:flex md:flex-row md:items-center md:justify-between ${APP_BRAND_THEME.footer.divider} ${APP_BRAND_THEME.footer.muted}`}>
          <p>{t('footer.copyrightFull', { year, org: APP_ORG_NAME })}</p>
          <p className="md:text-right">
            {t('footer.internalVersion', { brand: APP_BRAND_SHORT_NAME })}
          </p>
        </div>
      </div>
    </footer>
  );
}
