import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  BackupFileChecksumResult,
  BackupFileEntry,
  BackupFilesTreeNode,
} from 'src/types/backup-files';
import { apiGet, apiPost } from 'src/utils/api';

const apiBase = getPublicApiBaseUrl();

export function fetchBackupFilesTree(): Promise<BackupFilesTreeNode[]> {
  return apiGet<BackupFilesTreeNode[]>({
    api: apiBase,
    endPoint: '/admin/backup/files/tree',
  });
}

export function fetchBackupFiles(options?: {
  date?: string;
  database?: string;
}): Promise<BackupFileEntry[]> {
  return apiGet<BackupFileEntry[]>({
    api: apiBase,
    endPoint: '/admin/backup/files',
    params: {
      date: options?.date,
      database: options?.database,
    },
  });
}

export function computeBackupFileChecksum(
  relativePath: string,
): Promise<BackupFileChecksumResult> {
  return apiPost<BackupFileChecksumResult, { relativePath: string }>({
    api: apiBase,
    endPoint: '/admin/backup/files/checksum',
    body: { relativePath },
  });
}
