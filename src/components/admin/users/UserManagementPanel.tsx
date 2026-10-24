import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'src/i18n';
import {
  createAdminUser,
  deactivateAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from 'src/auth/admin-api';
import { useAuth } from 'src/auth/context';
import { getRoleLabel } from 'src/constants/role-labels';
import type {
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from 'src/types/admin';
import { ApiError, formatApiErrorPayload } from 'src/utils/api';
import { UserFormModal } from './UserFormModal';

function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return formatApiErrorPayload(error.payload) ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('common:errors.generic');
}

function UserActions({
  user,
  currentUserId,
  onEdit,
  onDeactivate,
}: {
  user: AdminUser;
  currentUserId?: string;
  onEdit: (user: AdminUser) => void;
  onDeactivate: (user: AdminUser) => void;
}) {
  const { t } = useTranslation(['users', 'common']);
  const isSelf = user.id === currentUserId;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">
        {t('users:actions.edit')}
      </button>
      <button
        type="button"
        disabled={!user.isActive || isSelf}
        onClick={() => onDeactivate(user)}
        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">
        {t('users:actions.deactivate')}
      </button>
    </div>
  );
}

export function UserManagementPanel() {
  const { t } = useTranslation(['users', 'common']);
  const { role, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formOpen, setFormOpen] = useState(false);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const loadData = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const nextUsers = await fetchAdminUsers();
      setUsers(nextUsers);
      setPanelError(null);
    } catch (error) {
      setPanelError(resolveErrorMessage(error));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingUser(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (user: AdminUser) => {
    setFormMode('edit');
    setEditingUser(user);
    setFormError(null);
    setFormOpen(true);
  };

  const handleCreate = async (payload: CreateAdminUserRequest) => {
    if (role !== 'admin') {
      return;
    }

    setFormPending(true);
    setFormError(null);

    try {
      await createAdminUser(payload);
      setFormOpen(false);
      await loadData();
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  };

  const handleUpdate = async (userId: string, payload: UpdateAdminUserRequest) => {
    if (role !== 'admin') {
      return;
    }

    setFormPending(true);
    setFormError(null);

    try {
      await updateAdminUser(userId, payload);
      setFormOpen(false);
      await loadData();
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (role !== 'admin') {
      return;
    }

    const confirmed = window.confirm(
      t('users:confirm.deactivate', { username: user.username }),
    );

    if (!confirmed) {
      return;
    }

    setPanelError(null);

    try {
      await deactivateAdminUser(user.id);
      await loadData();
    } catch (error) {
      setPanelError(resolveErrorMessage(error));
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t('users:title')}</h2>
          <p className="mt-1 text-sm text-slate-600">{t('users:subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          {t('users:addUser')}
        </button>
      </div>

      {panelError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {panelError}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-600">{t('users:loading')}</p>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">{t('users:table.username')}</th>
                  <th className="px-3 py-2 font-medium">{t('users:table.email')}</th>
                  <th className="px-3 py-2 font-medium">{t('users:table.role')}</th>
                  <th className="px-3 py-2 font-medium">{t('users:table.status')}</th>
                  <th className="px-3 py-2 font-medium">{t('users:table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">{user.username}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {user.email ?? t('common:emDash')}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{getRoleLabel(user.role)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                        {user.isActive
                          ? t('users:status.active')
                          : t('users:status.inactive')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <UserActions
                        user={user}
                        currentUserId={currentUser?.id}
                        onEdit={openEditForm}
                        onDeactivate={handleDeactivate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-900">{user.username}</h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {user.email ?? t('users:noEmail')}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                    {user.isActive
                      ? t('users:status.active')
                      : t('users:status.inactive')}
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-slate-600">
                  <div>
                    <dt className="inline font-medium">{t('users:mobile.rolePrefix')} </dt>
                    <dd className="inline">{getRoleLabel(user.role)}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <UserActions
                    user={user}
                    currentUserId={currentUser?.id}
                    onEdit={openEditForm}
                    onDeactivate={handleDeactivate}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <UserFormModal
        mode={formMode}
        user={editingUser}
        open={formOpen}
        pending={formPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
      />
    </section>
  );
}
