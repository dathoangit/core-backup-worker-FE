import { useCallback, useEffect, useRef, useState } from 'react';
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

  return 'Đã xảy ra lỗi.';
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
  const isSelf = user.id === currentUserId;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onEdit(user)}
        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:text-sm">
        Sửa
      </button>
      <button
        type="button"
        disabled={!user.isActive || isSelf}
        onClick={() => onDeactivate(user)}
        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">
        Vô hiệu hóa
      </button>
    </div>
  );
}

export function UserManagementPanel() {
  const { accessToken, role, user: currentUser } = useAuth();
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
    if (!accessToken || role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const nextUsers = await fetchAdminUsers(accessToken);
      setUsers(nextUsers);
      setPanelError(null);
    } catch (error) {
      setPanelError(resolveErrorMessage(error));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [accessToken, role]);

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
    if (!accessToken) {
      return;
    }

    setFormPending(true);
    setFormError(null);

    try {
      await createAdminUser(accessToken, payload);
      setFormOpen(false);
      await loadData();
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  };

  const handleUpdate = async (userId: string, payload: UpdateAdminUserRequest) => {
    if (!accessToken) {
      return;
    }

    setFormPending(true);
    setFormError(null);

    try {
      await updateAdminUser(accessToken, userId, payload);
      setFormOpen(false);
      await loadData();
    } catch (error) {
      setFormError(resolveErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  };

  const handleDeactivate = async (user: AdminUser) => {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(
      `Vô hiệu hóa tài khoản "${user.username}"? Người dùng sẽ không đăng nhập được.`,
    );

    if (!confirmed) {
      return;
    }

    setPanelError(null);

    try {
      await deactivateAdminUser(accessToken, user.id);
      await loadData();
    } catch (error) {
      setPanelError(resolveErrorMessage(error));
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Quản lý người dùng</h2>
          <p className="mt-1 text-sm text-slate-600">
            Thêm, sửa, vô hiệu hóa user và gán vai trò.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Thêm user
        </button>
      </div>

      {panelError ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {panelError}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-600">Đang tải danh sách...</p>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Vai trò</th>
                  <th className="px-3 py-2 font-medium">Trạng thái</th>
                  <th className="px-3 py-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">{user.username}</td>
                    <td className="px-3 py-3 text-slate-600">{user.email ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{getRoleLabel(user.role)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                        {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
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
                    <p className="mt-1 text-xs text-slate-600">{user.email ?? 'Không có email'}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                    {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </div>
                <dl className="mt-3 space-y-1 text-xs text-slate-600">
                  <div>
                    <dt className="inline font-medium">Vai trò: </dt>
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
