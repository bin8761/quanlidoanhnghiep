# Frontend Onboarding Guide

## Mục tiêu của FE
Frontend này là cổng giao diện cho hệ thống Enterprise Asset Management. Nó phục vụ 2 vai trò chính:

- `ADMIN`: quản trị tài sản, nhân sự, danh mục, bàn giao, bảo trì, kiểm kê, báo cáo, FAQ, feedback, lịch sử đăng nhập, support chat
- `USER`: nhân viên xem tài sản của mình, yêu cầu hỗ trợ, xem lịch sử, đổi mật khẩu, FAQ, cài đặt cá nhân

## Tech Stack

- React 19
- React Router DOM 7
- Vite
- Tailwind CSS 4
- React Toastify
- Lucide React icons
- Playwright cho UI smoke test

## Cách chạy

Từ thư mục `frontend/`:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:ui
```

## Entry points quan trọng

- `src/main.jsx`: bootstrap ứng dụng
- `src/App.jsx`: bọc providers và toast container
- `src/routes/AppRoutes.jsx`: toàn bộ routing và route guard
- `src/auth/AuthContext.jsx`: auth state, bootstrap, login/logout/register
- `src/api/client.js`: HTTP client hiện tại
- `src/notifications/NotificationsContext.jsx`: notifications state và SSE stream
- `src/hooks/useTheme.jsx`: theme state
- `src/hooks/useLanguage.jsx`: i18n state và translation layer

## Luồng tổng quan

### 1. Bootstrap app

1. `BrowserRouter` bọc toàn bộ app.
2. `AuthProvider` nạp token từ localStorage, gọi `/auth/me`, xác định user hiện tại.
3. `NotificationsProvider` chỉ hoạt động khi đã authenticated.
4. `ThemeProvider` đọc và ghi `eam_theme`.
5. `LanguageProvider` đọc và ghi `eam_locale`, cập nhật `document.documentElement.lang`.

### 2. Routing

- `/login` và `/register` là public routes.
- `/admin/*` dành cho `ADMIN`.
- `/employee/*` dành cho `USER`.
- Nếu role không khớp thì redirect về login hoặc dashboard đúng role.

### 3. Auth

- Token hiện tại: `eam_access_token`
- User hiện tại: `eam_current_user`
- Đăng nhập qua `AuthContext.jsx`
- Có flow quên mật khẩu bằng OTP ở `LoginPage.jsx`
- Có đăng ký bằng `employeeCode` + email công ty ở `RegisterPage.jsx`

### 4. API layer

Hiện có 2 lớp API:

- `src/api/*` và `src/api/client.js`: lớp hiện tại, đây là source of truth
- `src/services/*`: lớp cũ hơn, chỉ giữ để tương thích hoặc các flow còn sót

Quy ước thực tế:

- Khi thêm API mới, ưu tiên `src/api/client.js` + module trong `src/api/`
- Chỉ chạm `src/services/*` nếu đang sửa flow cũ như OTP login/reset password

### 5. Notifications

- `NotificationsProvider` load danh sách thông báo và unread count
- Dùng `EventSource` để nhận stream từ `/notifications/stream`
- Khi có notification mới thì cập nhật local state và hiển thị toast

### 6. Theme và ngôn ngữ

- Theme dùng class `dark` trên `document.documentElement`
- Ngôn ngữ lưu trong `eam_locale`
- FE đang có cơ chế translation theo text node và một `fallbackDictionary`
- Khi sửa text UI, cần kiểm tra cả tiếng Việt và tiếng Anh

## Cấu trúc thư mục

- `src/api/`: API modules theo domain
- `src/auth/`: auth context
- `src/components/`: UI tái sử dụng, chia theo `admin`, `chat`, `layout`, `ui`
- `src/hooks/`: theme, language, utilities
- `src/layouts/`: layout riêng cho admin và employee
- `src/notifications/`: notification context và normalize helpers
- `src/pages/`: pages theo portal
- `src/routes/`: route definitions
- `src/services/`: API helpers legacy
- `tests/`: Playwright smoke tests

## Điểm cần chú ý khi sửa code

- Không phá 2 portal admin/employee.
- Không đổi key localStorage tùy tiện.
- Không trộn lại `src/services/*` với `src/api/*` nếu không cần thiết.
- Giữ Tailwind utility style nhất quán.
- Khi sửa routing, phải kiểm tra cả protected route và redirect logic.
- Khi sửa auth, phải kiểm tra `LoginPage.jsx`, `RegisterPage.jsx`, `AuthContext.jsx`, `AppRoutes.jsx`.
- Khi sửa notifications, phải kiểm tra `NotificationsContext.jsx` và `src/api/notifications.js`.

## File nên đọc đầu tiên khi onboard FE

1. `src/App.jsx`
2. `src/routes/AppRoutes.jsx`
3. `src/auth/AuthContext.jsx`
4. `src/api/client.js`
5. `src/notifications/NotificationsContext.jsx`
6. `src/hooks/useTheme.jsx`
7. `src/hooks/useLanguage.jsx`
8. `tests/ui-smoke.spec.js`

## Gợi ý kiểm tra nhanh

- Chạy `npm run lint` trước khi commit.
- Chạy `npm run test:ui` khi đụng auth, routing, login flow, settings, import/export, hoặc các module quan trọng.
- Nếu backend đổi base URL hoặc auth contract, phải cập nhật `src/api/client.js` và `AuthContext.jsx` trước tiên.

