export type BackupFileKind = 'full' | 'append' | 'cdc' | 'snapshot';

export type BackupFileEntry = {
  relativePath: string;
  absolutePath: string;
  runId: string;
  database: string;
  sourceGroup: string;
  kind: BackupFileKind;
  sizeBytes: number;
  rowCount: number;
  sha256: string | null;
  md5: string | null;
  modifiedAt: string;
  date: string;
};

export type BackupFilesTreeNode = {
  date: string;
  groups: Array<{
    group: string;
    databases: Array<{
      database: string;
      fileCount: number;
      totalBytes: number;
    }>;
  }>;
};

export type BackupFileChecksumResult = {
  relativePath: string;
  sha256: string;
  md5: string;
  sizeBytes: number;
};
