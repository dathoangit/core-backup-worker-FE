# Auth

JWT in **localStorage**. No refresh token — expire → login again.

Backend: [`../../BE-nestJs/docs/auth.md`](../../BE-nestJs/docs/auth.md).  
Admin UI: [admin-users.md](./admin-users.md). Layout: [layout-shell.md](./layout-shell.md).

---

## Where logic lives

| Concern | File |
|---------|------|
| Session state / login / logout | `src/auth/context.tsx` (`AuthProvider`, `useAuth`) |
| localStorage keys + in-memory token | `src/auth/storage.ts` |
| `POST /auth/login` client | `src/auth/api.ts` |
| Auth DTO / role types | `src/auth/types.ts` |
| Post-login landing path | `src/auth/role-routing.ts` |
| Route guard (redirects) | `src/components/layout/AuthGate.tsx` |
| Wire provider + gate | `pages/_app.tsx` |
| Login page route | `pages/login.tsx` |
| Login UI | `src/components/login/LoginPageContent.tsx`, `LoginForm.tsx` |

**Change login UX →** `LoginForm.tsx` + `context.tsx` `login()`.  
**Change storage keys / expiry →** `storage.ts`.  
**Change which routes are public →** `AuthGate.tsx`.  
**Change landing by role →** `role-routing.ts`.

---

## Login flow

**Route:** `/login` → `pages/login.tsx` → `LoginPageContent` + `LoginForm`

1. Submit `{ username, password }` via `useAuth().login()`.
2. `src/auth/api.ts` → `POST /auth/login`.
3. Store token + user; redirect via `getDefaultLandingPath()` (default `/`).

### Browser storage

| Key | Content |
|-----|---------|
| `triage.auth.accessToken` | JWT |
| `triage.auth.accessTokenExpiresAt` | Expiry (ms) |
| `triage.auth.user` | JSON profile |

### `useAuth()` surface

| API | Purpose |
|-----|---------|
| `isBootstrapping` | Restoring session |
| `isAuthenticated` | Valid token present |
| `accessToken` / `user` / `role` | Session data |
| `login(body)` / `logout()` | Mutate session |

---

## Route protection (`AuthGate`)

| Kind | Paths |
|------|-------|
| Public | `/login`, `/404`, `/api/*` |
| Protected | everything else (e.g. `/`) |
| Admin-only | `/admin/*` — requires `role === 'admin'` |

Authenticated user on `/login` → redirect home.
