import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { BackupZones } from 'src/types/backup';

type BackupOverviewCardsProps = {
  zones: BackupZones | null;
  scheduleEnabled: boolean | null;
};

/** Split long path hints at the last `/` so the tail wraps inside the card. */
function splitHintAtLastSlash(text: string): [string, string] | null {
  const slash = text.lastIndexOf('/');
  if (slash <= 0 || slash >= text.length - 1) {
    return null;
  }
  return [text.slice(0, slash), text.slice(slash)];
}

function FreeHintText({ hint }: { hint: string }) {
  const parts = splitHintAtLastSlash(hint);
  const className = 'mt-1 min-w-0 break-all text-xs text-amber-700';

  if (!parts) {
    return <p className={className}>{hint}</p>;
  }

  const [head, tail] = parts;
  return (
    <p className={className}>
      <span className="block">{head}</span>
      <span className="block">{tail}</span>
    </p>
  );
}

function Card({
  title,
  children,
  className = '',
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className="mt-2 min-w-0 text-sm text-slate-900">{children}</div>
    </article>
  );
}

export function BackupOverviewCards({
  zones,
  scheduleEnabled,
}: BackupOverviewCardsProps) {
  const { t } = useTranslation(['home', 'common']);
  const primary = zones?.primary;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card title={t('home:overview.scheduleTitle')} className="pl-6">
        {scheduleEnabled === null ? (
          <p className="text-slate-500">{t('home:overview.scheduleUnknown')}</p>
        ) : (
          <p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                scheduleEnabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
              {scheduleEnabled
                ? t('common:toggle.on')
                : t('common:toggle.off')}
            </span>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {t('home:overview.scheduleHint')}
        </p>
      </Card>

      <Card title={t('home:overview.primaryTitle')}>
        {primary ? (
          <>
            <p
              className="truncate font-medium"
              title={
                primary.volumes
                  ? `meta=${primary.volumes.meta}; his=${primary.volumes.his}; emr=${primary.volumes.emr}; lis=${primary.volumes.lis ?? ''}`
                  : primary.backupDir || undefined
              }
            >
              {primary.volumes?.meta || primary.backupDir || t('common:emDash')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {primary.exists
                ? t('home:overview.dirExists')
                : t('home:overview.dirMissing')}{' '}
              · {t('home:overview.runCount', { count: primary.runCount })}
              {primary.volumes ? t('home:overview.volumesHint') : ''}
            </p>
            {primary.freeHint ? (
              <FreeHintText hint={primary.freeHint} />
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">{t('common:loading.generic')}</p>
        )}
      </Card>

      <Card title={t('home:overview.lockTitle')}>
        {primary ? (
          primary.lockHeld ? (
            <p>
              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                {t('home:overview.lockHeld')}
              </span>
              {primary.lockPid != null ? (
                <span className="mt-1 block text-xs text-slate-500">
                  {t('home:overview.lockPid', { pid: primary.lockPid })}
                </span>
              ) : null}
            </p>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t('home:overview.lockFree')}
            </span>
          )
        ) : (
          <p className="text-slate-500">{t('common:loading.generic')}</p>
        )}
      </Card>

      <Card title={t('home:overview.isolatedTitle')}>
        {zones ? (
          <>
            <p className="font-medium">{zones.isolatedCopy.target}</p>
            <p className="mt-1 text-xs text-slate-500">
              {zones.isolatedCopy.configured
                ? t('common:configured.yes')
                : t('common:configured.no')}
            </p>
          </>
        ) : (
          <p className="text-slate-500">{t('common:loading.generic')}</p>
        )}
      </Card>
    </div>
  );
}
