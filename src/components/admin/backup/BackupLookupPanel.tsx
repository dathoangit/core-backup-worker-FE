import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBackupLookup } from 'src/auth/backup-api';
import type { BackupLookupResponse } from 'src/types/backup';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

const FIELD_ORDER = [
  'his_patienthistory_id',
  'his_patientdocument',
  'value',
  'name',
  'id_no',
  'birthday',
  'his_gender',
  'age',
  'his_patienttype',
  'isinpatient',
  'patientstate',
  'medicalrecordtype',
  'his_department_id',
  'regdate',
  'accepteddate',
  'timegoin',
  'created',
  'updated',
  'first_diagnostic',
  'inhospital_diagdiseasetext',
  'assurancenumber',
  'assurancepercent',
  'address1',
  'address2',
  'guardianname',
  'weight',
  'height',
  'pulse',
  'temperature',
  'bloodpressure',
] as const;

export function BackupLookupPanel() {
  const { t } = useTranslation(['runs', 'common']);
  const [query, setQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState('');
  const [hideEmpty, setHideEmpty] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackupLookupResponse | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchBackupLookup(q, true);
      setResult(next);
    } catch (err) {
      setResult(null);
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const diffFields = new Set(result?.diff.map((d) => d.field) ?? []);

  const allFieldKeys = result
    ? mergeFieldKeys(result.backup.fields, result.live?.fields)
    : [];
  const filledCount = result
    ? allFieldKeys.filter(
        (field) =>
          hasValue(result.backup.fields[field]) ||
          hasValue(result.live?.fields[field]),
      ).length
    : 0;
  const needle = fieldFilter.trim().toLowerCase();
  const fieldKeys = allFieldKeys.filter((field) => {
    if (needle && !field.toLowerCase().includes(needle)) {
      return false;
    }

    if (!result || !hideEmpty) {
      return true;
    }

    return (
      hasValue(result.backup.fields[field]) ||
      hasValue(result.live?.fields[field])
    );
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-slate-700">
          <span className="mb-1 block font-medium">
            {t('runs:lookup.queryLabel')}
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder={t('runs:lookup.placeholder')}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
          {loading ? t('runs:lookup.loading') : t('runs:lookup.submit')}
        </button>
      </form>

      <p className="text-xs text-slate-500">{t('runs:lookup.hint')}</p>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <>
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
            <p className="font-medium">
              {t('runs:lookup.savedBanner', {
                savedAt: result.backup.savedAt,
                runId: result.backup.runId,
                rowUpdatedAt: result.backup.rowUpdatedAt ?? '—',
              })}
            </p>
            <p className="mt-1 text-xs text-sky-800">
              {t('runs:lookup.matchedBy', { matchedBy: result.matchedBy })} ·{' '}
              {result.backup.kind} · {result.backup.relativePath}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="block flex-1 text-sm text-slate-700">
              <span className="mb-1 block font-medium">
                {t('runs:lookup.fieldFilter')}
              </span>
              <input
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={t('runs:lookup.fieldFilterPlaceholder')}
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hideEmpty}
                onChange={(e) => setHideEmpty(e.target.checked)}
              />
              {t('runs:lookup.hideEmpty')}
            </label>
          </div>

          <p className="text-xs text-slate-500">
            {t('runs:lookup.fieldCount', {
              shown: fieldKeys.length,
              filled: filledCount,
              total: allFieldKeys.length,
            })}
          </p>

          <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    {t('runs:lookup.table.field')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    {t('runs:lookup.table.backup')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-slate-700">
                    {t('runs:lookup.table.live')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {fieldKeys.map((field) => {
                  const changed = diffFields.has(field);
                  return (
                    <tr
                      key={field}
                      className={changed ? 'bg-amber-50' : undefined}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {field}
                      </td>
                      <td className="max-w-md whitespace-pre-wrap break-words px-3 py-2 text-slate-800">
                        {result.backup.fields[field] ?? '—'}
                      </td>
                      <td className="max-w-md whitespace-pre-wrap break-words px-3 py-2 text-slate-800">
                        {result.live?.fields[field] ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {fieldKeys.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500">
                {t('runs:lookup.noFields')}
              </p>
            ) : null}
          </div>

          {result.diff.length > 0 ? (
            <p className="text-xs text-amber-800">
              {t('runs:lookup.diffCount', { count: result.diff.length })}
            </p>
          ) : (
            <p className="text-xs text-emerald-700">
              {t('runs:lookup.noDiff')}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

function hasValue(value: string | null | undefined): boolean {
  return value !== undefined && value !== null && value !== '';
}

function mergeFieldKeys(
  backup: Record<string, string | null>,
  live: Record<string, string | null> | undefined,
): string[] {
  const rest = new Set<string>([
    ...Object.keys(backup),
    ...Object.keys(live ?? {}),
  ]);

  const ordered = FIELD_ORDER.filter((key) => {
    if (!rest.has(key)) {
      return false;
    }

    rest.delete(key);
    return true;
  });

  return [...ordered, ...rest];
}
