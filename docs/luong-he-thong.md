# Luồng hệ thống — Frontend

Frontend là Next.js **Pages Router**. Nó không backup, không nối database nguồn, không nói chuyện với Redis hay BullMQ. Mọi việc nặng nằm ở backend. FE đăng nhập (cookie HttpOnly), gọi HTTP với `credentials: 'include'`, và nhận tiến độ realtime qua **SSE** (`useBackupStream`).

Backend tương ứng: [`../../core-backup-worker-BE/docs/luong-he-thong.md`](../../core-backup-worker-BE/docs/luong-he-thong.md).  
Hiện trạng / phân tích hiệu quả vận hành: [`../../core-backup-worker-BE/docs/backup-phan-tich-hieu-qua-2026-10-25.md`](../../core-backup-worker-BE/docs/backup-phan-tich-hieu-qua-2026-10-25.md).

`pages/_app.tsx` bọc: `I18nProvider` → `AuthProvider` → `ToastProvider` → `AuthGate` → page.

---

## FE đang làm gì

| Trang | Path | Việc |
|-------|------|------|
| Tổng quan | `/` | Admin: zone/schedule cards, thẻ từng database (reachability, watermark, last run / DB status, Start incremental), progress bar khi có run đang chạy (SSE) |
| Màn hình trung tâm | `/dashboard` | TV wallboard **public** (không chrome app): Active Job, disk forecast, DB carousel + lag badge, history sparkline, countdown lịch, alerts panel, donut job summary; SSE public + safety refetch 5 phút |
| Lịch sử | `/runs` | Danh sách run, trigger incremental/full, panel hàng đợi BullMQ, hủy run / hủy hết queued, mở chi tiết |
| Chi tiết run | `/runs/:runId` | Progress bar + log terminal SSE (`?runId=`) |
| Chi tiết DB | `/databases/:group/:database` | Watermark, lịch sử run theo DB, restore plan (chỉ đọc) |
| Tra cứu file | `/files` | Cây `.csv.gz` theo ngày/nhóm/DB, size, checksum MD5/SHA-256 |
| Cấu hình | `/config` | Settings theo category (`?category=`), bật/tắt lịch, alerts Telegram/SMTP + gửi thử |
| Users | `/admin/users` | CRUD tài khoản admin |

FE **không restore**. Nút restore plan chỉ gọi `GET /admin/backup/restore-plan`.

Route legacy (redirect):

| Cũ | Mới |
|----|-----|
| `/admin/backup` | → `/` |
| `/admin/backup/runs/:runId` | → `/runs/:runId` (nếu còn) |
| `/admin/settings` | → `/config` |

---

## Ai vào được đâu

Phiên đăng nhập: cookie HttpOnly `access_token` do BE set. Không lưu JWT trong `localStorage` / `sessionStorage` (boot gọi `clearLegacyAuthStorage()`). Boot: `GET /auth/me` với cookie; `401` → logout / login. Logout: `POST /auth/logout`.

`AuthGate` (`src/components/layout/AuthGate.tsx`):

| Path | Ai |
|------|-----|
| `/login` | Công khai. Đã login → `/` (`getDefaultLandingPath`) |
| `/dashboard` | Công khai. `AppShell showChrome={false}` |
| `/api/*` | Route nội bộ Next (vd. health), không qua cổng login |
| `/` | Đã login. Nội dung backup chỉ khi `role === 'admin'` |
| `/runs`, `/runs/:runId`, `/files`, `/config`, `/databases/...`, `/admin/...` | Admin (`isAdminOnlyPath` + `AdminPageGate`) |

Menu admin (`AdminNav`): Tổng quan · Màn hình trung tâm · Lịch sử · Tra cứu file · Cấu hình.  
Header: `AlertBell` (SSE admin → toast + badge khi run `error` / `partial`), `UserAccountMenu` (link Users nếu admin), `LanguageSwitcher` (i18n `vi` / `en`).

---

## Bản đồ trang & module

```text
pages/
  _app.tsx                         I18n + Auth + Toast + AuthGate
  login.tsx                        LoginForm → POST /auth/login (cookie)
  index.tsx                        BackupDashboard
  dashboard.tsx                    WallboardDashboard (public SSE)
  runs/index.tsx                   RunsHistoryPanel (+ BackupQueuePanel)
  runs/[runId].tsx                 BackupRunDetail (progress + log)
  files.tsx                        FileExplorerPanel
  config.tsx                       SettingsManagementPanel (+ AlertTestPanel)
  databases/[group]/[database].tsx DatabaseDetailPanel
  admin/users.tsx                  UserManagementPanel
  admin/backup/index.tsx           redirect → /
  admin/settings.tsx               redirect → /config
  api/health.ts                    health check Next

src/auth/
  backup-api.ts                    runs, queue, sources, zones, restore-plan
  public-backup-api.ts             GET /public/backup/overview
  settings-api.ts / alerts-api.ts / admin-api.ts / files-api.ts
  storage.ts                       clearLegacyAuthStorage
  admin-paths.ts                   isAdminOnlyPath
  role-routing.ts                  HOME_PATH = /
src/hooks/useBackupStream.ts       EventSource + withCredentials
src/config/public-api.ts           getPublicApiBaseUrl()
src/utils/api.ts                   fetch + credentials: 'include' (không Bearer)
src/i18n/                          namespaces: home, runs, wallboard, settings, …
```

---

## FE gọi BE thế nào

Base URL: `NEXT_PUBLIC_API_URL` qua `getPublicApiBaseUrl()` (phải gồm Nest prefix `api/v1`).

Ví dụ:

| Môi trường | FE | API |
|------------|----|-----|
| Dev | `http://localhost:3000` | `http://localhost:8081/api/v1` (hoặc theo `.env`) |
| Prod (docker) | host port **3001** | thường `http://<host>:3000/api/v1` |

Cookie SameSite=Lax → FE/BE cùng site (hoặc localhost khác port trong dev). BE cần `FRONTEND_ORIGINS` khớp origin FE.

`src/utils/api.ts`: `credentials: 'include'`; không gửi `Authorization`. `401` → `notifyUnauthorized()` (trừ login/me/logout dùng `suppressUnauthorized`).

### Realtime (SSE)

| Stream | Path | Auth |
|--------|------|------|
| Admin | `GET /admin/backup/stream?runId=` | Cookie |
| Public | `GET /public/backup/stream` | Không |

Hook `useBackupStream({ channel, runId, onOpen, onStatus, onProgress })`.

Sự kiện: `run.status`, `run.progress` (gồm `currentTable`, `tablesDone`/`tablesTotal`, `percent`, `rowsPerSec`, `bytesPerSec`, `etaSeconds`, …), `run.log`, `snapshot` (replay khi reconnect), `heartbeat`.

Mở kết nối → thường refetch HTTP một lần (`onOpen`) để lấp khoảng trống trước khi SSE bắt kịp.

| Màn | Cập nhật |
|-----|----------|
| `/` | SSE admin + refetch khi open/status |
| `/runs` | SSE admin |
| `/runs/:runId` | SSE admin `?runId=` + progress/log |
| `/config` | SSE status → reload (khóa cron khi backup chạy) |
| Header `AlertBell` | SSE admin |
| `/dashboard` | SSE **public** + safety HTTP overview mỗi **5 phút** |

Không còn polling định kỳ 3–15 giây làm nguồn chính.

### HTTP chính

| Hàm FE | HTTP |
|--------|------|
| `triggerBackupRun` | `POST /admin/backup/runs?mode=&groups=&databases=` → 202 queued |
| `cancelBackupRun` | `POST /admin/backup/runs/:runId/cancel` |
| `fetchBackupQueue` | `GET /admin/backup/queue` |
| `cancelAllQueuedBackupRuns` | `POST /admin/backup/queue/cancel-all-queued` |
| `fetchBackupRuns` / `fetchBackupRun` | `GET /admin/backup/runs` |
| `fetchBackupSources` / `fetchBackupZones` | sources / zones |
| `fetchRestorePlan` | `GET /admin/backup/restore-plan?database=` |
| `fetchBackupFilesTree` / `fetchBackupFiles` | files tree / list |
| `computeBackupFileChecksum` | `POST /admin/backup/files/checksum` |
| `sendAlertTest` | `POST /admin/alerts/test?channel=telegram\|email` |
| `fetchSettings` / `updateSetting` | `/admin/settings` (category gồm `alerts`, `backup`, …) |
| `fetchPublicOverview` | `GET /public/backup/overview` — `activeJob`, `schedule`, `disk` (+ forecast), `databases[].lagMinutes` / `lagState`, `historyByDay`, `recentJobs`, `jobSummary` |

---

## Luồng người dùng

### Đăng nhập

1. `/login` gửi username/password.
2. BE set cookie HttpOnly + body (token trong body deprecated).
3. FE lấy user từ response / lần sau từ `/auth/me` → `/`.

### Tổng quan (`/`) — admin

1. Load song song: runs, sources, zones, setting `BACKUP_SCHEDULE_ENABLED`.
2. `BackupOverviewCards`: lịch, primary zone, lock, isolated.
3. Thẻ database: reachability, watermark, **Lần chạy gần nhất** (`backupRunStatusLabel`), **DB status** (`databaseRunStatusLabel`), Start incremental (chỉ khi `ready` và không có run đang chạy).
4. SSE: nếu có run `running`/`queued` → `RunProgressBar`.

### Chạy backup & hàng đợi (`/runs`)

1. Trigger incremental/full theo nhóm/DB → 202 queued (cần worker BE sống).
2. Panel **Quản lý hàng đợi** (`BackupQueuePanel`): xem BullMQ + DB queued, hủy từng job hoặc hủy hết queued.
3. SSE: `queued` → `running` → progress / log.
4. `/runs/:runId`: progress bar + terminal log.
5. Run `error` / `partial` → toast + badge chuông header.

### Wallboard (`/dashboard`) — public

1. `fetchPublicOverview` lần đầu + mỗi 5 phút (safety).
2. `useBackupStream({ channel: 'public' })` giữ `progressByRunId` / `statusByRunId` realtime.
3. Widget chính:
   - `DatabaseCardsCarousel` + `DatabaseLagBadge` (on_time / overdue / missed / error)
   - Donut `jobSummary` + `HistorySparklineCard`
   - `DiskForecastPanel` (growth, gzip estimate, days-until-full)
   - `ActiveJobStream` (%, bảng hiện tại, rows/s, MB/s, ETA)
   - `NextJobCountdown` (incremental / weekly full)
   - `WallboardAlertsPanel`
   - Recent jobs: scope (DB/group), trigger, hint chờ worker
4. `LanguageSwitcher` trên header wallboard.

### Cấu hình (`/config`)

- Filter category qua UI hoặc `?category=his|emr|lis|backup|alerts|…` (thẻ DB “Cấu hình” deep-link theo group).
- Tab / filter **alerts**: Telegram, SMTP, ngưỡng đĩa; `AlertTestPanel` gửi thử.
- Khi backup đang chạy, SSE có thể khóa sửa cron.

### Tra cứu file

`/files` → ngày → nhóm → DB → file (size, rows, SHA-256/MD5). File cũ thiếu hash: **Tính checksum**.

---

## Cách chạy

```bash
cp .env.example .env
yarn
yarn dev          # http://localhost:3000
```

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
```

BE cần `FRONTEND_ORIGINS=http://localhost:3000` và Redis (`REDIS_CACHE_ENABLED=true`) để login cookie/session.

Seed mặc định: `admin` / `0123456789`.

Production image: `NEXT_PUBLIC_API_URL` được **inline lúc build**; đổi URL API → rebuild image FE. Host UI thường map `HOST_PORT=3001`.

---

## FE không làm

- Không giữ hàng đợi. Tắt tab không hủy job trên worker.
- Không đọc nội dung `.csv.gz` — chỉ metadata / checksum qua API.
- Role không phải admin không chạy backup; vẫn mở được `/dashboard` public.
- Không phải nguồn sự thật về tốc độ/ETA dài của full dump — tin bảng hiện tại + bytes trên BE; xem doc phân tích hiệu quả BE khi vận hành.
