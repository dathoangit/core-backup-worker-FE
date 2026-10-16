import type { ReactNode } from 'react';
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
  const primary = zones?.primary;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card title="Lịch tự động" className="pl-6">
        {scheduleEnabled === null ? (
          <p className="text-slate-500">Chưa rõ</p>
        ) : (
          <p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                scheduleEnabled
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
              {scheduleEnabled ? 'Đang bật' : 'Đã tắt'}
            </span>
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Quản lý tại mục Cấu hình.
        </p>
      </Card>

      <Card title="Primary zone">
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
              {primary.volumes?.meta || primary.backupDir || '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {primary.exists ? 'Thư mục tồn tại' : 'Chưa có thư mục'} · {primary.runCount}{' '}
              run
              {primary.volumes
                ? ` · HIS/EMR/LIS volumes`
                : ''}
            </p>
            {primary.freeHint ? (
              <FreeHintText hint={primary.freeHint} />
            ) : null}
          </>
        ) : (
          <p className="text-slate-500">Đang tải...</p>
        )}
      </Card>

      <Card title="Lock">
        {primary ? (
          primary.lockHeld ? (
            <p>
              <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Đang giữ lock
              </span>
              {primary.lockPid != null ? (
                <span className="mt-1 block text-xs text-slate-500">
                  PID {primary.lockPid}
                </span>
              ) : null}
            </p>
          ) : (
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Rảnh
            </span>
          )
        ) : (
          <p className="text-slate-500">Đang tải...</p>
        )}
      </Card>

      <Card title="Isolated copy">
        {zones ? (
          <>
            <p className="font-medium">{zones.isolatedCopy.target}</p>
            <p className="mt-1 text-xs text-slate-500">
              {zones.isolatedCopy.configured ? 'Đã cấu hình' : 'Chưa cấu hình'}
            </p>
          </>
        ) : (
          <p className="text-slate-500">Đang tải...</p>
        )}
      </Card>
    </div>
  );
}
