import { useState } from 'react';
import { sendAlertTest } from 'src/auth/alerts-api';
import { useToast } from 'src/components/ui/ToastProvider';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

export function AlertTestPanel() {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<'telegram' | 'email' | null>(null);

  const runTest = async (channel: 'telegram' | 'email') => {
    setBusy(channel);
    try {
      await sendAlertTest(channel);
      pushToast({
        tone: 'success',
        title: 'Đã gửi thử',
        message:
          channel === 'telegram'
            ? 'Tin nhắn test Telegram đã được gửi.'
            : 'Email test đã được gửi.',
      });
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Gửi thử thất bại',
        message: resolveApiErrorMessage(error),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Gửi thử cảnh báo</h3>
      <p className="mt-1 text-xs text-slate-600">
        Lưu cấu hình Telegram/SMTP trước, rồi bấm gửi thử để xác nhận kênh hoạt
        động.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runTest('telegram')}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-50">
          {busy === 'telegram' ? 'Đang gửi...' : 'Gửi thử Telegram'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void runTest('email')}
          className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100 disabled:opacity-50">
          {busy === 'email' ? 'Đang gửi...' : 'Gửi thử Email'}
        </button>
      </div>
    </div>
  );
}