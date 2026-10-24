import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendAlertTest } from 'src/auth/alerts-api';
import { useToast } from 'src/components/ui/ToastProvider';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

export function AlertTestPanel() {
  const { t } = useTranslation('settings');
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<'telegram' | 'email' | null>(null);

  const runTest = async (channel: 'telegram' | 'email') => {
    setBusy(channel);
    try {
      await sendAlertTest(channel);
      pushToast({
        tone: 'success',
        title: t('alertTest.toastSuccessTitle'),
        message:
          channel === 'telegram'
            ? t('alertTest.toastTelegramBody')
            : t('alertTest.toastEmailBody'),
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: t('alertTest.toastErrorTitle'),
        message: resolveApiErrorMessage(error),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{t('alertTest.title')}</h3>
      <p className="mt-1 text-xs text-slate-600">{t('alertTest.hint')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runTest('telegram')}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50">
          {busy === 'telegram' ? t('alertTest.sending') : t('alertTest.sendTelegram')}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runTest('email')}
          className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50">
          {busy === 'email' ? t('alertTest.sending') : t('alertTest.sendEmail')}
        </button>
      </div>
    </div>
  );
}
