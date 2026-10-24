import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuthRole } from 'src/auth/types';
import { getRoleLabel } from 'src/constants/role-labels';
import type { AdminUser, CreateAdminUserRequest, UpdateAdminUserRequest } from 'src/types/admin';

const ROLE_OPTIONS: AuthRole[] = ['admin', 'doctor', 'nurse'];

type UserFormModalProps = {
  mode: 'create' | 'edit';
  user?: AdminUser | null;
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitCreate: (payload: CreateAdminUserRequest) => Promise<void>;
  onSubmitUpdate: (userId: string, payload: UpdateAdminUserRequest) => Promise<void>;
};

export function UserFormModal({
  mode,
  user,
  open,
  pending,
  error,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: UserFormModalProps) {
  const { t } = useTranslation(['users', 'common']);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('nurse');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && user) {
      setUsername(user.username);
      setEmail(user.email ?? '');
      setPassword('');
      setRole(user.role);
      setIsActive(user.isActive);
      return;
    }

    setUsername('');
    setEmail('');
    setPassword('');
    setRole('nurse');
    setIsActive(true);
  }, [mode, open, user]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();

    if (mode === 'create') {
      if (!normalizedUsername || password.trim().length < 8) {
        return;
      }

      await onSubmitCreate({
        username: normalizedUsername,
        email: email.trim() || undefined,
        password,
        role,
        isActive,
      });
      return;
    }

    if (!user) {
      return;
    }

    const payload: UpdateAdminUserRequest = {
      username: normalizedUsername,
      email: email.trim(),
      role,
      isActive,
    };

    if (password.trim().length > 0) {
      payload.password = password;
    }

    await onSubmitUpdate(user.id, payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="user-form-title" className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? t('users:modal.createTitle') : t('users:modal.editTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">
            {t('common:actions.close')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="admin-user-username" className="block text-sm font-medium text-slate-700">
              {t('users:modal.username')}
            </label>
            <input
              id="admin-user-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="admin-user-email" className="block text-sm font-medium text-slate-700">
              {t('users:modal.email')}
            </label>
            <input
              id="admin-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="admin-user-password" className="block text-sm font-medium text-slate-700">
              {mode === 'create'
                ? t('users:modal.password')
                : t('users:modal.passwordNew')}
            </label>
            <input
              id="admin-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="admin-user-role" className="block text-sm font-medium text-slate-700">
              {t('users:modal.roleLabel')}
            </label>
            <select
              id="admin-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AuthRole)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {getRoleLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300"
            />
            {t('users:modal.activeCheckbox')}
          </label>

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
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
              {pending
                ? t('users:modal.saving')
                : mode === 'create'
                  ? t('users:modal.createSubmit')
                  : t('users:modal.editSubmit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
