import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBackupFiles, fetchBackupFolders } from 'src/auth/files-api';
import { useAuth } from 'src/auth/context';
import { formatBytes } from 'src/components/admin/backup/backup-status';
import type {
  BackupFileEntry,
  BackupFolderEntry,
} from 'src/types/backup-files';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

const TZ = 'Asia/Ho_Chi_Minh';

function formatDateTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function folderKey(folder: BackupFolderEntry): string {
  return `${folder.runId}|${folder.database}|${folder.kind}`;
}

export function FileExplorerPanel() {
  const { t, i18n: i18nInstance } = useTranslation(['files', 'common']);
  const { role } = useAuth();
  const [folders, setFolders] = useState<BackupFolderEntry[]>([]);
  const [selection, setSelection] = useState<BackupFolderEntry | null>(null);
  const [files, setFiles] = useState<BackupFileEntry[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    if (role !== 'admin') {
      setLoadingFolders(false);
      return;
    }
    setLoadingFolders(true);
    try {
      const next = await fetchBackupFolders();
      setFolders(next);
      setError(null);
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoadingFolders(false);
    }
  }, [role]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  const selectFolder = async (folder: BackupFolderEntry) => {
    setSelection(folder);
    setLoadingFiles(true);
    try {
      const list = await fetchBackupFiles({ database: folder.database });
      setFiles(
        list.filter(
          (file) =>
            file.runId === folder.runId &&
            file.database === folder.database &&
            file.kind === folder.kind,
        ),
      );
      setError(null);
    } catch (err) {
      setError(resolveApiErrorMessage(err));
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const contentLabel = (folder: BackupFolderEntry): string => {
    const parts = [
      folder.sourceGroup,
      folder.database,
      t(`files:kind.${folder.kind}`),
    ];

    if (folder.kind === 'logical') {
      parts.push(t('files:content.fullDump'));
    } else if (folder.tables.length > 0) {
      parts.push(
        t('files:content.tableCount', { count: folder.tables.length }),
      );
      parts.push(folder.tables.slice(0, 8).join(', '));
      if (folder.tables.length > 8) {
        parts.push(
          t('files:content.moreTables', {
            count: folder.tables.length - 8,
          }),
        );
      }
    }

    if (folder.rowCount > 0) {
      parts.push(
        t('files:content.rowCount', {
          count: folder.rowCount.toLocaleString(i18nInstance.language),
        }),
      );
    }

    return parts.join(' · ');
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t('files:title')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('files:subtitle')}</p>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loadingFolders ? (
          <p className="p-6 text-sm text-slate-600">{t('files:loading.folders')}</p>
        ) : folders.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">{t('files:empty.folders')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t('files:table.datetime')}</th>
                  <th className="px-4 py-3">{t('files:table.content')}</th>
                  <th className="px-4 py-3">{t('files:table.size')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {folders.map((folder) => {
                  const active =
                    selection !== null &&
                    folderKey(selection) === folderKey(folder);
                  return (
                    <tr
                      key={folderKey(folder)}
                      className={`cursor-pointer align-top hover:bg-sky-50 ${
                        active ? 'bg-sky-100' : ''
                      }`}
                      onClick={() => void selectFolder(folder)}>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-800">
                        <p className="font-medium">
                          {formatDateTime(
                            folder.startedAt,
                            i18nInstance.language,
                          )}
                        </p>
                        {folder.finishedAt ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {t('files:row.finished', {
                              time: formatDateTime(
                                folder.finishedAt,
                                i18nInstance.language,
                              ),
                            })}
                          </p>
                        ) : null}
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {folder.folder}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p>{contentLabel(folder)}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {t('files:row.fileCount', {
                            count: folder.fileCount,
                            runId: folder.runId,
                          })}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums font-medium text-slate-800">
                        {formatBytes(folder.sizeBytes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selection ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('files:detail.title')}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">
              {selection.folder}
            </p>
          </div>
          {loadingFiles ? (
            <p className="p-6 text-sm text-slate-600">{t('files:loading.files')}</p>
          ) : files.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">{t('files:empty.files')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t('files:table.file')}</th>
                    <th className="px-4 py-3">{t('files:table.kind')}</th>
                    <th className="px-4 py-3">{t('files:table.size')}</th>
                    <th className="px-4 py-3">{t('files:table.rows')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => (
                    <tr key={file.relativePath} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-800">
                          {file.relativePath}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase text-slate-600">
                        {file.kind}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {formatBytes(file.sizeBytes)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {file.rowCount.toLocaleString(i18nInstance.language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
