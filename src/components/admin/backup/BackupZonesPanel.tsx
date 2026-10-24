import { useTranslation } from 'react-i18next';
import type { BackupZones } from 'src/types/backup';

type BackupZonesPanelProps = {
  zones: BackupZones | null;
};

export function BackupZonesPanel({ zones }: BackupZonesPanelProps) {
  const { t } = useTranslation(['runs', 'common']);

  if (!zones) {
    return <p className="text-sm text-slate-500">{t('runs:zones.empty')}</p>;
  }

  const { primary, isolatedCopy } = zones;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">{t('runs:zones.primary')}</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('runs:zones.metaLock')}</dt>
            <dd className="mt-0.5 break-all font-mono text-xs">
              {primary.volumes?.meta || primary.backupDir || t('common:emDash')}
            </dd>
          </div>
          {primary.volumes ? (
            <>
              <div>
                <dt className="text-xs font-medium text-slate-500">{t('runs:zones.hisVolume')}</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.his || t('common:emDash')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">{t('runs:zones.emrVolume')}</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.emr || t('common:emDash')}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">{t('runs:zones.lisVolume')}</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.lis || t('common:emDash')}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex gap-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">{t('runs:zones.exists')}</dt>
              <dd>{primary.exists ? t('common:yesNo.yes') : t('common:yesNo.no')}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{t('runs:zones.runCount')}</dt>
              <dd>{primary.runCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">{t('runs:zones.lock')}</dt>
              <dd>
                {primary.lockHeld
                  ? primary.lockPid != null
                    ? t('runs:zones.lockHeld', { pid: primary.lockPid })
                    : t('runs:zones.lockHeld', { pid: '?' })
                  : t('runs:zones.lockFree')}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('runs:zones.stateDatabases')}</dt>
            <dd className="mt-0.5">
              {primary.stateDatabases.length > 0
                ? primary.stateDatabases.join(', ')
                : t('common:emDash')}
            </dd>
          </div>
          {primary.freeHint ? (
            <p className="text-xs text-amber-700">{primary.freeHint}</p>
          ) : null}
        </dl>
      </article>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">{t('runs:zones.isolated')}</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('runs:zones.target')}</dt>
            <dd className="mt-0.5">{isolatedCopy.target}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">{t('runs:zones.configured')}</dt>
            <dd className="mt-0.5">
              {isolatedCopy.configured
                ? t('common:configured.yes')
                : t('common:configured.no')}
            </dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
