import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { RestorePlan } from 'src/types/backup';

type RestorePlanPanelProps = {
  plan: RestorePlan | null;
  loading: boolean;
  error: string | null;
  onLoad: (database: string) => Promise<void>;
};

export function RestorePlanPanel({
  plan,
  loading,
  error,
  onLoad,
}: RestorePlanPanelProps) {
  const { t } = useTranslation(['runs', 'common']);
  const [database, setDatabase] = useState(plan?.database ?? 'produce');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = database.trim();
    if (!next) {
      return;
    }
    await onLoad(next);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm text-slate-700">
          <span className="mb-1 block font-medium">{t('runs:restore.database')}</span>
          <input
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder={t('runs:restore.placeholder')}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
          {loading ? t('runs:restore.loading') : t('runs:restore.loadButton')}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {plan ? (
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">{t('runs:restore.disclaimer')}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {plan.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">{t('runs:restore.table.index')}</th>
                  <th className="px-3 py-2 font-medium">{t('runs:restore.table.kind')}</th>
                  <th className="px-3 py-2 font-medium">{t('runs:restore.table.run')}</th>
                  <th className="px-3 py-2 font-medium">{t('runs:restore.table.path')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.steps.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      {t('runs:restore.emptySteps')}
                    </td>
                  </tr>
                ) : (
                  plan.steps.map((step) => (
                    <tr key={`${step.order}-${step.relativePath}`}>
                      <td className="px-3 py-3 text-slate-600">{step.order}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {step.kind}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {step.runId}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-600">
                        {step.relativePath}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : !loading && !error ? (
        <p className="text-sm text-slate-500">{t('runs:restore.prompt')}</p>
      ) : null}
    </div>
  );
}
