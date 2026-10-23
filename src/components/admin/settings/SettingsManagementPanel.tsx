import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchBackupRuns, fetchBackupZones } from 'src/auth/backup-api';
import { useAuth } from 'src/auth/context';
import { fetchSettings, updateSetting } from 'src/auth/settings-api';
import { useBackupStream } from 'src/hooks/useBackupStream';
import type {
  AppSetting,
  SettingCategory,
  UpdateSettingRequest,
} from 'src/types/settings';
import {
  isRestartRequiredSettingKey,
  SETTING_CATEGORY_LABELS,
  SETTING_SCHEDULE_ENABLED_KEY,
} from 'src/types/settings';
import { formatIsoAsLocalDateTime } from 'src/utils/date-vn';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';
import { AlertTestPanel } from './AlertTestPanel';
import { SettingFormModal } from './SettingFormModal';

type CategoryFilter = SettingCategory | 'all';

const CATEGORY_FILTERS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'backup', label: 'General' },
  { id: 'his', label: 'HIS' },
  { id: 'emr', label: 'EMR' },
  { id: 'badl', label: 'BADL' },
  { id: 'lis', label: 'LIS' },
  { id: 'alerts', label: 'Cảnh báo' },
];

const CATEGORY_FILTER_IDS = new Set<CategoryFilter>(
  CATEGORY_FILTERS.map((item) => item.id),
);

function parseCategoryFilter(value: unknown): CategoryFilter | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase() as CategoryFilter;
  return CATEGORY_FILTER_IDS.has(normalized) ? normalized : null;
}

function isTruthySetting(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function displaySettingValue(setting: AppSetting): string {
  if (setting.isSecret) {
    return setting.hasValue ? '••••••••' : '—';
  }
  if (setting.value === null || setting.value === '') {
    return '—';
  }
  return setting.value;
}

export function SettingsManagementPanel() {
  const router = useRouter();
  const { role } = useAuth();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [scheduleSetting, setScheduleSetting] = useState<AppSetting | null>(null);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [schedulePending, setSchedulePending] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<AppSetting | null>(null);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const fromQuery = parseCategoryFilter(router.query.category);
    if (fromQuery) {
      setCategory(fromQuery);
    }
  }, [router.isReady, router.query.category]);

  const loadData = useCallback(async () => {
    if (role !== 'admin') {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const [next, backupSettings, runsResult, zonesResult] = await Promise.all([
        fetchSettings(category === 'all' ? undefined : category),
        category === 'all' || category === 'backup'
          ? Promise.resolve(null)
          : fetchSettings('backup'),
        fetchBackupRuns(5).catch(() => null),
        fetchBackupZones().catch(() => null),
      ]);

      setSettings(next);

      const fromList = next.find((row) => row.key === SETTING_SCHEDULE_ENABLED_KEY);
      const fromBackup = backupSettings?.find(
        (row) => row.key === SETTING_SCHEDULE_ENABLED_KEY,
      );
      setScheduleSetting(fromList ?? fromBackup ?? null);

      const runBusy = Boolean(
        runsResult?.some((run) => run.status === 'running'),
      );
      const lockBusy = Boolean(zonesResult?.primary.lockHeld);
      setBackupInProgress(runBusy || lockBusy);
      setPanelError(null);
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [category, role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useBackupStream({
    enabled: role === 'admin',
    onOpen: () => {
      if (backupInProgress) {
        void loadData();
      }
    },
    onStatus: () => {
      void loadData();
    },
  });

  const selectCategory = (next: CategoryFilter) => {
    setCategory(next);
    const query =
      next === 'all'
        ? undefined
        : {
            category: next,
          };
    void router.replace({ pathname: '/config', query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const scheduleEnabled = scheduleSetting
    ? isTruthySetting(scheduleSetting.value)
    : false;

  const canEditSetting = (setting: AppSetting): boolean => {
    if (!isRestartRequiredSettingKey(setting.key)) {
      return true;
    }
    return !backupInProgress;
  };

  const openEditForm = (setting: AppSetting) => {
    if (!canEditSetting(setting)) {
      setPanelError(
        `Không thể sửa ${setting.key} khi đang có backup chạy. Đợi backup xong rồi sửa; sau đó restart backend để cron/timezone có hiệu lực.`,
      );
      return;
    }

    setEditingSetting(setting);
    setFormError(null);
    setFormOpen(true);
  };

  const handleUpdate = async (key: string, payload: UpdateSettingRequest) => {
    if (role !== 'admin') {
      return;
    }

    if (isRestartRequiredSettingKey(key) && backupInProgress) {
      setFormError(
        `Không thể sửa ${key} khi đang có backup chạy.`,
      );
      return;
    }

    if (isRestartRequiredSettingKey(key)) {
      const confirmed = window.confirm(
        `Đổi ${key} cần restart backend mới có hiệu lực. Tiếp tục lưu?`,
      );
      if (!confirmed) {
        return;
      }
    }

    setFormPending(true);
    setFormError(null);

    try {
      await updateSetting(key, payload);
      setFormOpen(false);
      await loadData();
    } catch (error) {
      setFormError(resolveApiErrorMessage(error));
    } finally {
      setFormPending(false);
    }
  };

  const handleToggleSchedule = async () => {
    if (role !== 'admin') {
      return;
    }

    const nextValue = scheduleEnabled ? 'false' : 'true';
    const confirmed = window.confirm(
      nextValue === 'true'
        ? 'Bật lịch backup tự động? Job đã đăng ký sẽ chạy đúng lịch cron (không cần restart).'
        : 'Tắt lịch backup tự động? Job cron vẫn giữ đăng ký nhưng sẽ bỏ qua khi tới giờ.',
    );
    if (!confirmed) {
      return;
    }

    setSchedulePending(true);
    setPanelError(null);

    try {
      await updateSetting(SETTING_SCHEDULE_ENABLED_KEY, {
        value: nextValue,
      });
      await loadData();
    } catch (error) {
      setPanelError(resolveApiErrorMessage(error));
    } finally {
      setSchedulePending(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cấu hình hệ thống</h2>
          <p className="mt-1 text-sm text-slate-600">
            General cho cấu hình chung; HIS/EMR/BADL cho từng nguồn dữ liệu.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Tổng quan
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Cấu hình backup (đường dẫn, nguồn, cron, số ngày giữ, cảnh báo) lưu trong
        DB — sửa tại đây; password được mã hoá. Runtime{' '}
        <span className="font-mono text-xs">.env</span> chỉ còn DB/Redis/JWT. Không
        sửa cron khi đang backup. Bật/tắt lịch qua nút bên dưới có hiệu lực ngay.
      </div>

      {backupInProgress ? (
        <div
          className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900"
          role="status">
          Đang có backup chạy — tạm khoá sửa cron/timezone. Các setting khác vẫn
          sửa được.
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Lịch backup tự động</p>
          <p className="mt-1 text-xs text-slate-600">
            {scheduleSetting
              ? `Hiện tại: ${scheduleEnabled ? 'Đang bật' : 'Đã tắt'}`
              : 'Chưa có setting trong DB — dùng env fallback.'}
          </p>
        </div>
        <button
          type="button"
          disabled={schedulePending}
          onClick={() => void handleToggleSchedule()}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
            scheduleEnabled
              ? 'bg-slate-700 hover:bg-slate-800'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}>
          {schedulePending
            ? 'Đang cập nhật...'
            : scheduleEnabled
              ? 'Tắt lịch'
              : 'Bật lịch'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectCategory(item.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              category === item.id
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {item.label}
          </button>
        ))}
      </div>

      {category === 'alerts' || category === 'all' ? (
        <div className="mt-4">
          <AlertTestPanel />
        </div>
      ) : null}

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
                  <th className="px-3 py-2 font-medium">Key</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Value</th>
                  <th className="px-3 py-2 font-medium">Cập nhật</th>
                  <th className="px-3 py-2 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      Chưa có setting nào.
                    </td>
                  </tr>
                ) : (
                  settings.map((setting) => (
                    <tr key={setting.key}>
                      <td className="px-3 py-3 font-mono text-xs font-medium text-slate-900">
                        {setting.key}
                        {setting.isSecret ? (
                          <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                            secret
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {SETTING_CATEGORY_LABELS[setting.category]}
                      </td>
                      <td className="max-w-xs truncate px-3 py-3 text-slate-600">
                        {displaySettingValue(setting)}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatIsoAsLocalDateTime(setting.updatedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          disabled={!canEditSetting(setting)}
                          title={
                            canEditSetting(setting)
                              ? undefined
                              : 'Đang backup — không sửa cron/timezone'
                          }
                          onClick={() => openEditForm(setting)}
                          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm">
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {settings.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có setting nào.</p>
            ) : (
              settings.map((setting) => (
                <article
                  key={setting.key}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-all font-mono text-xs font-semibold text-slate-900">
                      {setting.key}
                    </h3>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs text-slate-600">
                      {SETTING_CATEGORY_LABELS[setting.category]}
                    </span>
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-700">
                    {displaySettingValue(setting)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!canEditSetting(setting)}
                      title={
                        canEditSetting(setting)
                          ? undefined
                          : 'Đang backup — không sửa cron/timezone'
                      }
                      onClick={() => openEditForm(setting)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                      Sửa
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      <SettingFormModal
        setting={editingSetting}
        open={formOpen}
        pending={formPending}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmitUpdate={handleUpdate}
      />
    </section>
  );
}
