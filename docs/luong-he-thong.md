# Luồng hệ thống — Frontend

Frontend là Next.js Pages Router. Nó không backup, không nối database nguồn, không nói chuyện với Redis hay BullMQ. Mọi việc nặng nằm ở backend. FE đăng nhập (cookie), gọi HTTP với `credentials: 'include'`, và nhận tiến độ realtime qua SSE.

Backend tương ứng: [`../../core-backup-worker-BE/docs/luong-he-thong.md`](../../core-backup-worker-BE/docs/luong-he-thong.md).

---

## FE đang làm gì

1. **Tổng quan** (`/`) — admin xem từng database còn sống không, watermark, lần chạy gần nhất, progress realtime, và bấm backup incremental một database.
2. **Lịch sử** (`/runs`) — danh sách run, kích hoạt incremental/full theo nhóm, hủy run, mở chi tiết (progress bar + log terminal SSE).
3. **Tra cứu file** (`/files`) — cây thư mục `.csv.gz` theo ngày/nhóm/DB, dung lượng, checksum MD5/SHA-256.
4. **Cấu hình** (`/config`) — settings (lịch, đường dẫn, host, alerts Telegram/SMTP).
5. **Màn hình trung tâm** (`/dashboard`) — TV wallboard public: Active Job stream (SSE progress), Disk forecast, watermark/lag badge, History sparkline 14 ngày, Next Job countdown; safety refetch overview 5 phút.
6. **Users** (`/admin/users`) — CRUD tài khoản admin.

FE không restore. Nút restore plan chỉ đọc `GET /admin/backup/restore-plan`.

---

## Ai vào được đâu

`pages/_app.tsx` bọc `AuthProvider` + `ToastProvider` + `AuthGate`.

Phiên đăng nhập dùng **HttpOnly cookie** `access_token` do BE set. Không lưu JWT trong `localStorage` / `sessionStorage` (boot gọi `clearLegacyAuthStorage()`). Boot gọi `GET /auth/me` với cookie; `401` → logout / về login. Logout gọi `POST /auth/logout`.

| Path | Ai |
|------|-----|
| `/login` | Công khai. Đã login thì về `/`. |
| `/dashboard` | Công khai. Không header app (`showChrome={false}`). |
| `/api/*` | Route nội bộ Next, không qua cổng login. |
| `/` | Đã login. Nội dung backup chỉ khi `role === 'admin'`. |
| `/runs`, `/runs/:runId` | Admin (`AdminPageGate`). |
| `/files` | Admin. |
| `/config` | Admin (tab alerts + gửi thử Telegram/Email). |
| `/databases/:group/:database` | Admin. |
| `/admin/users` | Admin. |

Menu (`AdminNav`): Tổng quan, Màn hình trung tâm, Lịch sử, Tra cứu file, Cấu hình. Header có `AlertBell` (toast + badge khi run `error` / `partial`).

---

## Bản đồ trang

```text
pages/
  _app.tsx                         AuthProvider + ToastProvider + AuthGate
  login.tsx                        LoginForm → POST /auth/login (cookie)
  index.tsx                        BackupDashboard
  dashboard.tsx                    WallboardDashboard (public SSE)
  runs/index.tsx                   RunsHistoryPanel
  runs/[runId].tsx                 BackupRunDetail (+ progress + log)
  files.tsx                        FileExplorerPanel
  config.tsx                       SettingsManagementPanel (+ AlertTestPanel)
  databases/[group]/[database].tsx DatabaseDetailPanel
  admin/users.tsx                  UserManagementPanel

src/auth/
  backup-api.ts / settings-api.ts / admin-api.ts / files-api.ts / alerts-api.ts
  storage.ts                       chỉ clearLegacyAuthStorage
src/hooks/useBackupStream.ts       EventSource + withCredentials
src/utils/api.ts                   fetch + credentials: 'include' (không Bearer)
```

---

## FE gọi BE thế nào

Base URL: `NEXT_PUBLIC_API_URL` (ví dụ `http://localhost:8081/api/v1` — phải gồm Nest global prefix). Cookie SameSite=Lax yêu cầu FE/BE cùng site (hoặc localhost khác port trong dev).

`src/utils/api.ts`: `credentials: 'include'`; không gửi `Authorization`. `401` → `notifyUnauthorized()` (trừ login/me/logout dùng `suppressUnauthorized`).

### Realtime (SSE)

| Stream | Path | Ai |
|--------|------|----|
| Admin | `GET /admin/backup/stream?runId=` | Cookie auth |
| Public | `GET /public/backup/stream` | Không auth |

Hook `useBackupStream` thay polling. Sự kiện: `run.status`, `run.progress`, `run.log`, `snapshot`, `heartbeat`. Mở kết nối thì refetch HTTP một lần để lấp khoảng trống.

| Màn | Cũ (poll) | Hiện tại |
|-----|-----------|----------|
| `/` | 5s khi running | SSE admin |
| `/runs` | 3s khi queued/running | SSE admin |
| `/runs/:runId` | 3s | SSE `?runId=` + progress/log |
| `/config` | 5s khi backup chạy | SSE status → reload khóa cron |
| `/dashboard` | 15s luôn | SSE public + safety 5 phút |

### Backup / settings / files / alerts

| Hàm FE | HTTP |
|--------|------|
| `triggerBackupRun` | `POST /admin/backup/runs?...` → 202 queued |
| `cancelBackupRun` | `POST /admin/backup/runs/:runId/cancel` |
| `fetchBackupQueue` | `GET /admin/backup/queue` |
| `cancelAllQueuedBackupRuns` | `POST /admin/backup/queue/cancel-all-queued` |
| `fetchBackupRuns` / `fetchBackupRun` | `GET /admin/backup/runs` |
| `fetchBackupFilesTree` | `GET /admin/backup/files/tree` |
| `fetchBackupFiles` | `GET /admin/backup/files?date=&database=` |
| `computeBackupFileChecksum` | `POST /admin/backup/files/checksum` |
| `sendAlertTest` | `POST /admin/alerts/test?channel=telegram\|email` |
| `fetchSettings` / `updateSetting` | `/admin/settings` (category gồm `alerts`) |
| `fetchPublicOverview` | `GET /public/backup/overview` (không cookie) — gồm `activeJob`, `schedule`, `disk.forecast`, `databases[].lagMinutes` |

Wallboard (`WallboardDashboard`) dùng `useBackupStream({ channel: 'public' })` để giữ `progressByRunId` realtime (không chỉ refetch overview). Widget chính: `ActiveJobStream`, `DiskForecastPanel`, `HistorySparklineCard`, `NextJobCountdown`, `DatabaseLagBadge`.

---

## Luồng người dùng

### Đăng nhập

1. `/login` gửi username/password.
2. BE set cookie HttpOnly + trả body (token deprecated).
3. FE lưu user từ response / lần sau lấy từ `/auth/me`, vào `/`.

### Chạy backup và xem realtime

1. `/` hoặc `/runs` bấm chạy → 202 queued (cần `yarn dev:worker` / `start:worker`).
2. `/runs` có panel **Quản lý hàng đợi**: xem BullMQ + DB queued, hủy từng job hoặc hủy hết queued.
3. SSE đẩy `queued` → `running` → progress % / rows / log.
4. `/runs/:runId` hiện progress bar + terminal log.
5. Run `error` / `partial` → toast + badge chuông header.
6. Wallboard Recent jobs hiện scope (DB/group), trigger, thời gian, hint “Chờ worker”.
7. Wallboard Active Job: progress %, rows/s, MB/s, rows processed/estimated, ETA; Disk panel: growth 7d + gzip estimate + days-until-full; DB card: watermark + lag badge; History mini sparkline + countdown incremental / weekly full.

### Cảnh báo ngoài

`/config` → tab **Cảnh báo**: Telegram bot token/chat id, SMTP, ngưỡng đĩa; nút gửi thử.

### Tra cứu file

`/files` → mở ngày → nhóm → DB → bảng file (size, rows, SHA-256/MD5). File cũ thiếu hash: **Tính checksum**.

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

Seed: `admin` / `0123456789`.

---

## FE không làm

- Không giữ hàng đợi. Tắt tab không hủy job.
- Không đọc nội dung `.csv.gz` — chỉ metadata/checksum API.
- Role không phải admin không chạy backup; vẫn mở được `/dashboard` public.
