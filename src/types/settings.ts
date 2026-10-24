export type SettingCategory =
  | 'backup'
  | 'his'
  | 'emr'
  | 'badl'
  | 'lis'
  | 'alerts';

export type AppSetting = {
  id: string;
  key: string;
  value: string | null;
  isSecret: boolean;
  hasValue: boolean;
  category: SettingCategory;
  createdAt: string;
  updatedAt: string;
};

export type CreateSettingRequest = {
  key: string;
  value?: string | null;
  category?: SettingCategory;
  isSecret?: boolean;
};

export type UpdateSettingRequest = {
  value?: string | null;
};

export const SETTING_SCHEDULE_ENABLED_KEY = 'BACKUP_SCHEDULE_ENABLED';

const PER_DB_INCREMENTAL_CRON_KEYS = [
  'BACKUP_INCREMENTAL_CRON_produce',
  'BACKUP_INCREMENTAL_CRON_signer',
  'BACKUP_INCREMENTAL_CRON_file_service',
  'BACKUP_INCREMENTAL_CRON_vital_signs',
  'BACKUP_INCREMENTAL_CRON_research_management',
  'BACKUP_INCREMENTAL_CRON_medical_incident',
  'BACKUP_INCREMENTAL_CRON_html_editor',
  'BACKUP_INCREMENTAL_CRON_phat_thuoc',
] as const;

/** Cron/timezone keys require backend restart; blocked while a backup is running. */
export const RESTART_REQUIRED_SETTING_KEYS = new Set<string>([
  'BACKUP_INCREMENTAL_CRON',
  'BACKUP_SCHEDULE_CRON',
  'BACKUP_HIS_INCREMENTAL_CRON',
  'BACKUP_EMR_INCREMENTAL_CRON',
  'BACKUP_HIS_FULL_CRON',
  'BACKUP_EMR_FULL_CRON',
  'BACKUP_LIS_INCREMENTAL_CRON',
  'BACKUP_LIS_FULL_CRON',
  'BACKUP_TIMEZONE',
  ...PER_DB_INCREMENTAL_CRON_KEYS,
]);

export function isRestartRequiredSettingKey(key: string): boolean {
  if (RESTART_REQUIRED_SETTING_KEYS.has(key)) {
    return true;
  }

  return /^BACKUP_INCREMENTAL_CRON_[A-Za-z][A-Za-z0-9_]*$/.test(key);
}

/** Category ids for filters; display labels via i18n `settings:category.*`. */
export const SETTING_CATEGORY_LABELS: Record<SettingCategory, SettingCategory> = {
  backup: 'backup',
  his: 'his',
  emr: 'emr',
  badl: 'badl',
  lis: 'lis',
  alerts: 'alerts',
};

export const ALLOWLISTED_SETTING_KEYS: Array<{
  key: string;
  category: SettingCategory;
  isSecret: boolean;
}> = [
  { key: 'BACKUP_DIR', category: 'backup', isSecret: false },
  { key: 'BACKUP_ROOT', category: 'backup', isSecret: false },
  { key: 'BACKUP_VOLUME_META', category: 'backup', isSecret: false },
  { key: 'BACKUP_VOLUME_HIS', category: 'backup', isSecret: false },
  { key: 'BACKUP_VOLUME_EMR', category: 'backup', isSecret: false },
  { key: 'BACKUP_VOLUME_LIS', category: 'backup', isSecret: false },
  { key: 'BACKUP_SCHEDULE_ENABLED', category: 'backup', isSecret: false },
  { key: 'BACKUP_INCREMENTAL_CRON', category: 'backup', isSecret: false },
  { key: 'BACKUP_SCHEDULE_CRON', category: 'backup', isSecret: false },
  { key: 'BACKUP_TIMEZONE', category: 'backup', isSecret: false },
  { key: 'BACKUP_HISTORY_ENABLED', category: 'backup', isSecret: false },
  { key: 'BACKUP_RETENTION_DAYS', category: 'backup', isSecret: false },
  { key: 'BACKUP_FRESHNESS_MAX_AGE_HOURS', category: 'backup', isSecret: false },
  { key: 'BACKUP_ARCHIVE_TARGET', category: 'backup', isSecret: false },
  { key: 'BACKUP_CHUNK_SIZE', category: 'backup', isSecret: false },
  { key: 'BACKUP_STATEMENT_TIMEOUT_MS', category: 'backup', isSecret: false },
  { key: 'BACKUP_DEV_ROW_LIMIT', category: 'backup', isSecret: false },
  { key: 'BACKUP_HIS_INCREMENTAL_CRON', category: 'his', isSecret: false },
  { key: 'BACKUP_HIS_FULL_CRON', category: 'his', isSecret: false },
  { key: 'HIS_HOST', category: 'his', isSecret: false },
  { key: 'HIS_PORT', category: 'his', isSecret: false },
  { key: 'HIS_USER', category: 'his', isSecret: false },
  { key: 'HIS_PASSWORD', category: 'his', isSecret: true },
  { key: 'HIS_DATABASES', category: 'his', isSecret: false },
  { key: 'BACKUP_INCREMENTAL_CRON_produce', category: 'his', isSecret: false },
  { key: 'BACKUP_EMR_INCREMENTAL_CRON', category: 'emr', isSecret: false },
  { key: 'BACKUP_EMR_FULL_CRON', category: 'emr', isSecret: false },
  { key: 'EMR_HOST', category: 'emr', isSecret: false },
  { key: 'EMR_PORT', category: 'emr', isSecret: false },
  { key: 'EMR_USER', category: 'emr', isSecret: false },
  { key: 'EMR_PASSWORD', category: 'emr', isSecret: true },
  { key: 'EMR_DATABASES', category: 'emr', isSecret: false },
  { key: 'BACKUP_INCREMENTAL_CRON_signer', category: 'emr', isSecret: false },
  {
    key: 'BACKUP_INCREMENTAL_CRON_file_service',
    category: 'emr',
    isSecret: false,
  },
  {
    key: 'BACKUP_INCREMENTAL_CRON_vital_signs',
    category: 'emr',
    isSecret: false,
  },
  {
    key: 'BACKUP_INCREMENTAL_CRON_research_management',
    category: 'emr',
    isSecret: false,
  },
  {
    key: 'BACKUP_INCREMENTAL_CRON_medical_incident',
    category: 'emr',
    isSecret: false,
  },
  {
    key: 'BACKUP_INCREMENTAL_CRON_html_editor',
    category: 'emr',
    isSecret: false,
  },
  { key: 'BACKUP_INCREMENTAL_CRON_phat_thuoc', category: 'emr', isSecret: false },
  { key: 'BACKUP_LIS_INCREMENTAL_CRON', category: 'lis', isSecret: false },
  { key: 'BACKUP_LIS_FULL_CRON', category: 'lis', isSecret: false },
  { key: 'LIS_HOST', category: 'lis', isSecret: false },
  { key: 'LIS_PORT', category: 'lis', isSecret: false },
  { key: 'LIS_USER', category: 'lis', isSecret: false },
  { key: 'LIS_PASSWORD', category: 'lis', isSecret: true },
  { key: 'LIS_DATABASES', category: 'lis', isSecret: false },
  {
    key: 'BACKUP_INCREMENTAL_CRON_BloodStorage_XanhPon',
    category: 'lis',
    isSecret: false,
  },
  { key: 'BACKUP_INCREMENTAL_CRON_Labconnect_Card', category: 'lis', isSecret: false },
  { key: 'BACKUP_INCREMENTAL_CRON_LabconnXP', category: 'lis', isSecret: false },
  { key: 'BACKUP_INCREMENTAL_CRON_LabInventory_XP', category: 'lis', isSecret: false },
  { key: 'BADL_HOST', category: 'badl', isSecret: false },
  { key: 'BADL_PORT', category: 'badl', isSecret: false },
  { key: 'BADL_USER', category: 'badl', isSecret: false },
  { key: 'BADL_PASSWORD', category: 'badl', isSecret: true },
  { key: 'BADL_DATABASES', category: 'badl', isSecret: false },
  { key: 'ALERT_TELEGRAM_ENABLED', category: 'alerts', isSecret: false },
  { key: 'ALERT_TELEGRAM_BOT_TOKEN', category: 'alerts', isSecret: true },
  { key: 'ALERT_TELEGRAM_CHAT_ID', category: 'alerts', isSecret: false },
  { key: 'ALERT_EMAIL_ENABLED', category: 'alerts', isSecret: false },
  { key: 'ALERT_SMTP_HOST', category: 'alerts', isSecret: false },
  { key: 'ALERT_SMTP_PORT', category: 'alerts', isSecret: false },
  { key: 'ALERT_SMTP_SECURE', category: 'alerts', isSecret: false },
  { key: 'ALERT_SMTP_USER', category: 'alerts', isSecret: false },
  { key: 'ALERT_SMTP_PASSWORD', category: 'alerts', isSecret: true },
  { key: 'ALERT_EMAIL_FROM', category: 'alerts', isSecret: false },
  { key: 'ALERT_EMAIL_TO', category: 'alerts', isSecret: false },
  {
    key: 'ALERT_DISK_FREE_THRESHOLD_PERCENT',
    category: 'alerts',
    isSecret: false,
  },
];
