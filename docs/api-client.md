# API client & config

Shared HTTP helpers for Nest BE. Auth-specific clients wrap these.

Related: [auth.md](./auth.md), [admin-users.md](./admin-users.md).

---

## Where logic lives

| Concern | File |
|---------|------|
| `apiGet` / `apiPost` / `apiPatch` / `apiPut` / `apiDelete`, `ApiError`, envelope unwrap | `src/utils/api.ts` |
| Public BE base URL | `src/config/public-api.ts` (`getPublicApiBaseUrl`) |
| Login client | `src/auth/api.ts` |
| Admin users client | `src/auth/admin-api.ts` |
| Backup client | `src/auth/backup-api.ts` |
| Settings client | `src/auth/settings-api.ts` |
| VN date helpers | `src/utils/date-vn.ts` |
| Env template | `.env.example` |

**Change response envelope handling →** `src/utils/api.ts`.  
**Change BE host →** `.env` `NEXT_PUBLIC_API_URL` (+ `public-api.ts` default).  
**Add a new BE resource client →** new file under `src/` (pattern: `admin-api.ts`) using `api*` helpers + `accessToken` from `useAuth()`.

---

## Config

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

`getPublicApiBaseUrl()` reads that env (fallback `http://localhost:8081`).

---

## Usage pattern

```typescript
import { apiGet } from 'src/utils/api';
import { getPublicApiBaseUrl } from 'src/config/public-api';
import { useAuth } from 'src/auth/context';

const { accessToken } = useAuth();
const data = await apiGet<MyDto>({
  api: getPublicApiBaseUrl(),
  endPoint: '/some-path',
  token: accessToken,
});
```

Errors throw `ApiError` with status + payload — UI surfaces messages via `formatApiErrorPayload` in `api.ts`.
