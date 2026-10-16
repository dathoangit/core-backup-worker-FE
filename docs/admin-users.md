# Admin users (UI)

Admin-only CRUD at `/admin/users`. Entry from header menu when `useAuth().role === 'admin'`.

Backend: [`../../BE-nestJs/docs/admin-users.md`](../../BE-nestJs/docs/admin-users.md). Auth gate: [auth.md](./auth.md).

---

## Where logic lives

| Concern | File |
|---------|------|
| Page route + admin role check | `pages/admin/users.tsx` |
| List / create / edit / deactivate orchestration | `src/components/admin/users/UserManagementPanel.tsx` |
| Create / edit modal form | `src/components/admin/users/UserFormModal.tsx` |
| HTTP client → `/admin/users` | `src/auth/admin-api.ts` |
| Admin DTOs | `src/types/admin.ts` |
| VN role labels | `src/constants/role-labels.ts` |
| Menu link “Quản lý người dùng” | `src/components/layout/UserAccountMenu.tsx` |

**Change table/cards UX →** `UserManagementPanel.tsx`.  
**Change form fields →** `UserFormModal.tsx` + `types/admin.ts` + BE DTOs.  
**Change API paths/payloads →** `admin-api.ts` (keep in sync with BE).

---

## Features ↔ APIs

| Action | UI | Backend |
|--------|-----|---------|
| List | Table (md+) / cards (mobile) | `GET /admin/users` |
| Create | Modal | `POST /admin/users` |
| Update | Modal | `PATCH /admin/users/:id` |
| Deactivate | Confirm | `DELETE /admin/users/:id` (soft) |

Cannot deactivate self. All calls send `Authorization: Bearer` from `useAuth().accessToken`.

### Form fields

| Field | Create | Edit |
|-------|--------|------|
| Username | Required | Optional |
| Email | Optional | Optional |
| Password | Required (min 8) | Optional (blank = keep) |
| Role | `admin` / `doctor` / `nurse` | Optional |
| Active | Checkbox | Checkbox |

Errors: `ApiError` from `src/utils/api.ts` — see [api-client.md](./api-client.md).
