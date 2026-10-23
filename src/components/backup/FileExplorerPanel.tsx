import { useCallback, useEffect, useState } from 'react';
import {
  computeBackupFileChecksum,
  fetchBackupFiles,
  fetchBackupFilesTree,
} from 'src/auth/files-api';
import { useAuth } from 'src/auth/context';
import { formatBytes } from 'src/components/admin/backup/backup-status';
import type { BackupFileEntry, BackupFilesTreeNode } from 'src/types/backup-files';
import { resolveApiErrorMessage } from 'src/utils/resolve-api-error';

type Selection = {
  date: string;
  group: string;
  database: string;
};

function shortHash(value: string | null): string {
  if (!value) {
    return '—';
  }
  if (value.length <= 16) {
    return value;
  }
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* ignore */
  }
}

export function FileExplorerPanel() {
  const { role } = useAuth();
  const [tree, setTree] = useState<BackupFilesTreeNode[]>([]);
  const [files, setFiles] = useState<BackupFileEntry[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [hashingPath, setHashingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    if (role !== 'admin') {
      setLoadingTree(false);
      return;
    }
    setLoadingTree(true);
    try {
      const next = await fetchBackupFilesTree();
      setTree(next);
      setError(null);
      if (next[0]) {
        setExpandedDates(new Set([next[0].date]));
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setLoadingTree(false);
    }
  }, [role]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  const selectDatabase = async (next: Selection) => {
    setSelection(next);
    setLoadingFiles(true);
    try {
      const list = await fetchBackupFiles({
        date: next.date,
        database: next.database,
      });
      setFiles(
        list.filter(
          (file) =>
            file.sourceGroup === next.group && file.database === next.database,
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

  const handleChecksum = async (relativePath: string) => {
    setHashingPath(relativePath);
    try {
      const result = await computeBackupFileChecksum(relativePath);
      setFiles((prev) =>
        prev.map((file) =>
          file.relativePath === relativePath
            ? {
                ...file,
                sha256: result.sha256,
                md5: result.md5,
                sizeBytes: result.sizeBytes,
              }
            : file,
        ),
      );
    } catch (err) {
      setError(resolveApiErrorMessage(err));
    } finally {
      setHashingPath(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Tra cứu file backup</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cây thư mục `.csv.gz` theo ngày / nhóm DB, kèm dung lượng và checksum
          MD5/SHA-256.
        </p>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {loadingTree ? (
            <p className="p-2 text-sm text-slate-600">Đang tải cây thư mục...</p>
          ) : tree.length === 0 ? (
            <p className="p-2 text-sm text-slate-600">Chưa có file backup.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {tree.map((node) => {
                const open = expandedDates.has(node.date);
                return (
                  <li key={node.date}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-medium text-slate-800 hover:bg-slate-50"
                      onClick={() => {
                        setExpandedDates((prev) => {
                          const next = new Set(prev);
                          if (next.has(node.date)) {
                            next.delete(node.date);
                          } else {
                            next.add(node.date);
                          }
                          return next;
                        });
                      }}>
                      <span className="text-slate-400">{open ? '▾' : '▸'}</span>
                      {node.date}
                    </button>
                    {open ? (
                      <ul className="ml-4 mt-1 space-y-1 border-l border-slate-100 pl-2">
                        {node.groups.map((group) => (
                          <li key={`${node.date}-${group.group}`}>
                            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {group.group}
                            </p>
                            <ul className="space-y-0.5">
                              {group.databases.map((db) => {
                                const active =
                                  selection?.date === node.date &&
                                  selection.group === group.group &&
                                  selection.database === db.database;
                                return (
                                  <li key={db.database}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void selectDatabase({
                                          date: node.date,
                                          group: group.group,
                                          database: db.database,
                                        })
                                      }
                                      className={`w-full rounded-lg px-2 py-1.5 text-left hover:bg-sky-50 ${
                                        active
                                          ? 'bg-sky-100 text-sky-900'
                                          : 'text-slate-700'
                                      }`}>
                                      <span className="font-medium">
                                        {db.database}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-slate-500">
                                        {db.fileCount} file ·{' '}
                                        {formatBytes(db.totalBytes)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {!selection ? (
            <p className="p-6 text-sm text-slate-600">
              Chọn một database ở cây bên trái để xem danh sách file.
            </p>
          ) : loadingFiles ? (
            <p className="p-6 text-sm text-slate-600">Đang tải file...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Kind</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Rows</th>
                    <th className="px-4 py-3">SHA-256</th>
                    <th className="px-4 py-3">MD5</th>
                    <th className="px-4 py-3"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => (
                    <tr key={file.relativePath} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-800">
                          {file.relativePath}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          run {file.runId}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase text-slate-600">
                        {file.kind}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {formatBytes(file.sizeBytes)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">
                        {file.rowCount.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-mono text-xs text-sky-700 hover:underline"
                          title={file.sha256 ?? undefined}
                          onClick={() =>
                            file.sha256 ? void copyText(file.sha256) : undefined
                          }>
                          {shortHash(file.sha256)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="font-mono text-xs text-sky-700 hover:underline"
                          title={file.md5 ?? undefined}
                          onClick={() =>
                            file.md5 ? void copyText(file.md5) : undefined
                          }>
                          {shortHash(file.md5)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {!file.sha256 || !file.md5 ? (
                          <button
                            type="button"
                            disabled={hashingPath === file.relativePath}
                            onClick={() => void handleChecksum(file.relativePath)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            {hashingPath === file.relativePath
                              ? '...'
                              : 'Tính checksum'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {files.length === 0 ? (
                <p className="p-6 text-sm text-slate-600">Không có file.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
