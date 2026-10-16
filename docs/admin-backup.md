# Admin backup (UI)

Admin-only backup operations at `/admin/backup` and run detail at `/admin/backup/runs/[runId]`. Entry from header menu when `useAuth().role === 'admin'`.

Backend: [`../../core-backup-worker-BE/docs/backup-runbook.md`](../../core-backup-worker-BE/docs/backup-runbook.md). Auth gate: [auth.md](./auth.md).

---

## Where logic lives

| Concern | File |
|---------|------|
| Page route + admin role check | `pages/admin/backup/index.tsx` |
| Run detail page | `pages/admin/backup/runs/[runId].tsx` |
| Hub orchestration (tabs, refresh, trigger) | `src/components/admin/backup/BackupAdminPanel.tsx` |
| Overview cards | `src/components/admin/backup/BackupOverviewCards.tsx` |
| Runs table + manual trigger | `src/components/admin/backup/BackupRunsTable.tsx` |
| Sources / zones / restore | `BackupSourcesPanel`, `BackupZonesPanel`, `RestorePlanPanel` |
| Run detail | `src/components/admin/backup/BackupRunDetail.tsx` |
| HTTP client → `/admin/backup/*` | `src/auth/backup-api.ts` |
| DTOs | `src/types/backup.ts` |
| Menu link “Quản lý backup” | `src/components/layout/UserAccountMenu.tsx` |

**Change table/cards UX →** panels under `src/components/admin/backup/`.  
**Change API paths/payloads →** `backup-api.ts` (keep in sync with BE).

---

## Features ↔ APIs

| Action | UI | Backend |
|--------|-----|---------|
| Overview | Cards (schedule, zone, lock, archive) | `GET /admin/backup/zones` + settings |
| List runs | Table / cards | `GET /admin/backup/runs?limit=50` |
| Run detail | Detail page | `GET /admin/backup/runs/:runId` |
| Trigger | Form (mode + groups + optional databases) | `POST /admin/backup/runs?mode=&groups=&databases=` |
| Sources | Cards | `GET /admin/backup/sources` |
| Zones | Cards | `GET /admin/backup/zones` |
| Restore plan | Form + steps table | `GET /admin/backup/restore-plan?database=` |

There is **no** API to delete or edit historical runs. Disable schedule via [admin-settings.md](./admin-settings.md).

Auto-refresh every 5s while any run has `status === 'running'`. All calls send `Authorization: Bearer` from `useAuth().accessToken`.
