import { useTranslation } from 'react-i18next';
import type { BackupSource } from 'src/types/backup';
import { reachabilityClass } from './backup-status';

type BackupSourcesPanelProps = {
  sources: BackupSource[];
};

export function BackupSourcesPanel({ sources }: BackupSourcesPanelProps) {
  const { t } = useTranslation(['runs', 'common']);

  const reachabilityLabel = (reachability: BackupSource['reachability']) => {
    if (
      reachability === 'ready' ||
      reachability === 'unconfigured' ||
      reachability === 'unreachable'
    ) {
      return t(`common:reachability.${reachability}`);
    }
    return reachability;
  };

  if (sources.length === 0) {
    return <p className="text-sm text-slate-500">{t('runs:sources.empty')}</p>;
  }

  return (
    <div className="space-y-3">
      {sources.map((source) => (
        <article
          key={source.group}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{source.group}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {source.host}:{source.port}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${reachabilityClass(
                source.reachability,
              )}`}>
              {reachabilityLabel(source.reachability)}
            </span>
          </div>
          {source.reason ? (
            <p className="mt-2 text-xs text-amber-700">{source.reason}</p>
          ) : null}
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">
              {t('runs:sources.databasesLabel')}
            </p>
            <ul className="mt-1 space-y-1 text-sm text-slate-700">
              {source.databases.map((database) => (
                <li key={database} className="flex flex-wrap gap-2">
                  <span className="font-medium">{database}</span>
                  <span className="text-slate-500">
                    {t('runs:sources.watermarkPrefix')}{' '}
                    {source.watermarks[database] ?? t('common:emDash')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}
