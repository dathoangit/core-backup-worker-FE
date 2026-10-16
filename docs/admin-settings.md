# Admin settings (UI)

Admin-only settings CRUD at `/admin/settings`. Entry from header menu when `useAuth().role === 'admin'`.

Backend: `GET/POST/PUT/DELETE /admin/settings` (allowlisted keys). Auth gate: [auth.md](./auth.md). Related: [admin-backup.md](./admin-backup.md).

---

## Where logic lives

| Concern | File |
|---------|------|
| Page route + admin role check | `pages/admin/settings.tsx` |
| List / create / edit / delete / schedule toggle | `src/components/admin/settings/SettingsManagementPanel.tsx` |
| Create / edit modal | `src/components/admin/settings/SettingFormModal.tsx` |
| HTTP client → `/admin/settings` | `src/auth/settings-api.ts` |
| DTOs + allowlist keys | `src/types/settings.ts` |
| `apiPut` helper | `src/utils/api.ts` |
| Menu link “Cấu hình hệ thống” | `src/components/layout/UserAccountMenu.tsx` |

---

## Features ↔ APIs

| Action | UI | Backend |
|--------|-----|---------|
| List | Table (md+) / cards (mobile), category filter | `GET /admin/settings?category=` |
| Create | Modal (allowlisted keys) | `POST /admin/settings` |
| Update | Modal | `PUT /admin/settings/:key` |
| Delete | Confirm | `DELETE /admin/settings/:key` (`204`) |
| Enable/disable schedule | Toggle for `BACKUP_SCHEDULE_ENABLED` | `PUT /admin/settings/BACKUP_SCHEDULE_ENABLED` |

Secrets: API returns `value: null` and `hasValue`. Edit form uses password input and never shows plaintext.

Banner notes: changing cron expressions requires **BE restart**; toggling `BACKUP_SCHEDULE_ENABLED` applies at runtime in the scheduler `runJob` guard.
