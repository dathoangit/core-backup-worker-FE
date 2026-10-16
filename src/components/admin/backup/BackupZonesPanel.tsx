import type { BackupZones } from 'src/types/backup';

type BackupZonesPanelProps = {
  zones: BackupZones | null;
};

export function BackupZonesPanel({ zones }: BackupZonesPanelProps) {
  if (!zones) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu zone.</p>;
  }

  const { primary, isolatedCopy } = zones;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">Primary</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="text-xs font-medium text-slate-500">Meta (lock)</dt>
            <dd className="mt-0.5 break-all font-mono text-xs">
              {primary.volumes?.meta || primary.backupDir || '—'}
            </dd>
          </div>
          {primary.volumes ? (
            <>
              <div>
                <dt className="text-xs font-medium text-slate-500">HIS volume</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.his || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">EMR volume</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.emr || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">LIS volume</dt>
                <dd className="mt-0.5 break-all font-mono text-xs">
                  {primary.volumes.lis || '—'}
                </dd>
              </div>
            </>
          ) : null}
          <div className="flex gap-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">Exists</dt>
              <dd>{primary.exists ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Run count</dt>
              <dd>{primary.runCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Lock</dt>
              <dd>
                {primary.lockHeld
                  ? `Held${primary.lockPid != null ? ` (PID ${primary.lockPid})` : ''}`
                  : 'Free'}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">State databases</dt>
            <dd className="mt-0.5">
              {primary.stateDatabases.length > 0
                ? primary.stateDatabases.join(', ')
                : '—'}
            </dd>
          </div>
          {primary.freeHint ? (
            <p className="text-xs text-amber-700">{primary.freeHint}</p>
          ) : null}
        </dl>
      </article>

      <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-900">Isolated copy</h3>
        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          <div>
            <dt className="text-xs font-medium text-slate-500">Target</dt>
            <dd className="mt-0.5">{isolatedCopy.target}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Configured</dt>
            <dd className="mt-0.5">{isolatedCopy.configured ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
