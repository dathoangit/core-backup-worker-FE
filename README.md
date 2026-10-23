# FE-nextJs — Overview

Next.js **Pages Router** client shell: TypeScript, Tailwind, JWT auth (localStorage), admin user UI talking to Nest BE.

**Package manager:** `yarn` only.

---

## Agent index — start here

| I need to… | Open first | Deep dive |
|------------|------------|-----------|
| Understand the whole frontend | This file | [`docs/luong-he-thong.md`](./docs/luong-he-thong.md) |
| Login / session / route guards | [`docs/auth.md`](./docs/auth.md) | `src/auth/`, `src/components/layout/AuthGate.tsx` |
| Admin user management UI | [`docs/admin-users.md`](./docs/admin-users.md) | `src/components/admin/users/`, `src/auth/admin-api.ts` |
| Admin backup UI | [`docs/admin-backup.md`](./docs/admin-backup.md) | `src/components/admin/backup/`, `src/auth/backup-api.ts` |
| Admin settings UI | [`docs/admin-settings.md`](./docs/admin-settings.md) | `src/components/admin/settings/`, `src/auth/settings-api.ts` |
| App shell / header / branding | [`docs/layout-shell.md`](./docs/layout-shell.md) | `src/components/layout/`, `src/constants/branding.ts` |
| HTTP client & API base URL | [`docs/api-client.md`](./docs/api-client.md) | `src/utils/api.ts`, `src/config/public-api.ts` |
| React / Next performance rules | [`.cursor/skills/vercel-react-best-practices/SKILL.md`](./.cursor/skills/vercel-react-best-practices/SKILL.md) | — |

### Quick path map

```text
pages/
  _app.tsx                 # AuthProvider + AuthGate + global CSS
  _document.tsx            # HTML shell
  index.tsx                # Home (authenticated)
  login.tsx                # Login route
  admin/users.tsx          # Admin users page
  admin/backup/index.tsx   # Admin backup hub
  admin/backup/runs/[runId].tsx
  admin/settings.tsx       # Admin settings
  api/health.ts            # FE health
  404.tsx
src/
  auth/                    # context, storage, login/admin/backup/settings APIs
  components/
    layout/                # AppShell, AuthGate, header/footer/menu
    login/                 # Login UI
    home/                  # Home content
    admin/users/           # Admin user CRUD UI
    admin/backup/          # Backup hub UI
    admin/settings/        # Settings CRUD UI
  config/public-api.ts     # NEXT_PUBLIC_API_URL
  utils/api.ts             # apiGet/Post/Patch/Put/Delete + ApiError
  constants/               # branding, role labels
  types/                   # admin, backup, settings DTOs
  styles/global.css
```

Path alias: `src/*` → `./src/*` (see `tsconfig.json`).

---

## Runtime flow (short)

1. `_app.tsx` wraps app with `AuthProvider` + `AuthGate`.
2. Session restored from localStorage (`src/auth/storage.ts`).
3. Unauthenticated users → `/login`; admins can open `/admin/backup`, `/admin/settings`, `/admin/users`.
4. API calls use `NEXT_PUBLIC_API_URL` + Bearer token from `useAuth()`.

BE counterpart: [`../core-backup-worker-BE/README.md`](../core-backup-worker-BE/README.md).

---

## Environment & commands

```bash
cp .env.example .env
yarn
yarn dev      # http://localhost:3000
yarn build && yarn start
yarn lint
```

Required: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8081`).
