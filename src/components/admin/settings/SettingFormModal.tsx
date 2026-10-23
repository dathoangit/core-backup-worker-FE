import { useEffect, useState, type FormEvent } from 'react';
import type { AppSetting, UpdateSettingRequest } from 'src/types/settings';
import { isRestartRequiredSettingKey } from 'src/types/settings';

type SettingFormModalProps = {
  setting: AppSetting | null;
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitUpdate: (key: string, payload: UpdateSettingRequest) => Promise<void>;
};

export function SettingFormModal({
  setting,
  open,
  pending,
  error,
  onClose,
  onSubmitUpdate,
}: SettingFormModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open || !setting) {
      return;
    }

    setValue(setting.isSecret ? '' : setting.value ?? '');
  }, [open, setting]);

  if (!open || !setting) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (setting.isSecret && value.trim() === '') {
      return;
    }

    await onSubmitUpdate(setting.key, {
      value: value.trim() === '' ? null : value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setting-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="setting-form-title" className="text-lg font-semibold text-slate-900">
            Sửa setting
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
            Đóng
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Key</p>
            <p className="mt-1 font-mono text-sm text-slate-900">{setting.key}</p>
          </div>

          <div>
            <label htmlFor="setting-value" className="block text-sm font-medium text-slate-700">
              {setting.isSecret
                ? 'Giá trị mới (bắt buộc khi lưu secret)'
                : 'Giá trị'}
            </label>
            <input
              id="setting-value"
              type={setting.isSecret ? 'password' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoComplete="off"
              placeholder={
                setting.isSecret && setting.hasValue
                  ? '•••••••• (đã có giá trị)'
                  : undefined
              }
            />
            {setting.isSecret ? (
              <p className="mt-1 text-xs text-slate-500">
                Secret không trả về plaintext.{' '}
                {setting.hasValue
                  ? 'Hiện đã có giá trị — nhập mới để ghi đè.'
                  : 'Chưa có giá trị — nhập password rồi Lưu (không cần sửa env).'}
              </p>
            ) : null}
            {isRestartRequiredSettingKey(setting.key) ? (
              <p className="mt-1 text-xs text-amber-700">
                Key này cần restart backend sau khi lưu. Chỉ sửa khi không đang
                backup.
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
              {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
