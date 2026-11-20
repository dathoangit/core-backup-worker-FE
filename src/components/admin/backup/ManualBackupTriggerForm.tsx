import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BackupMode, SourceGroup } from 'src/types/backup';

const SOURCE_GROUPS: SourceGroup[] = ['HIS', 'EMR', 'BADL', 'LIS', 'PACS'];

type ManualBackupTriggerFormProps = {
  triggering: boolean;
  onTrigger: (options: {
    mode: BackupMode;
    groups: SourceGroup[];
    databases?: string[];
  }) => Promise<void>;
};

export function ManualBackupTriggerForm({
  triggering,
  onTrigger,
}: ManualBackupTriggerFormProps) {
  const { t } = useTranslation(['runs', 'common']);
  const [mode, setMode] = useState<BackupMode>('incremental');
  const [groups, setGroups] = useState<SourceGroup[]>(['HIS', 'EMR', 'LIS']);
  const [databasesRaw, setDatabasesRaw] = useState('');

  const toggleGroup = (group: SourceGroup) => {
    setGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const handleTrigger = async () => {
    const databases = databasesRaw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    await onTrigger({
      mode,
      groups,
      databases: databases.length > 0 ? databases : undefined,
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {t('runs:manual.title')}
      </h3>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="block text-sm text-slate-700">
            <span className="mb-1 block font-medium">
              {t('runs:manual.modeLabel')}
            </span>
            <span className="relative block">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as BackupMode)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm leading-5">
                <option value="incremental">
                  {t('common:mode.incremental')}
                </option>
                <option value="full">{t('common:mode.full')}</option>
                <option value="logical">{t('common:mode.logical')}</option>
              </select>
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500">
                <path
                  fill="currentColor"
                  d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
                />
              </svg>
            </span>
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-slate-700">
              {t('runs:manual.groupsLegend')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {SOURCE_GROUPS.map((group) => (
                <label
                  key={group}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={groups.includes(group)}
                    onChange={() => toggleGroup(group)}
                    className="rounded border-slate-300"
                  />
                  {group}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <label className="block text-sm text-slate-700">
          <span className="mb-1 block font-medium">
            {t('runs:manual.databasesLabel')}
          </span>
          <input
            type="text"
            value={databasesRaw}
            onChange={(e) => setDatabasesRaw(e.target.value)}
            placeholder={t('runs:manual.databasesPlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            disabled={triggering || groups.length === 0}
            onClick={() => void handleTrigger()}
            className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
            {triggering
              ? t('runs:manual.queueing')
              : t('runs:manual.queueButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
