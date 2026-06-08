# QA Checklist — Enterprise Asset Management

**Người phụ trách:** Person 5  
**Cập nhật lần cuối:** Week 5

---

## Hướng dẫn sử dụng

- ✅ Pass — đã kiểm tra và đúng
- ❌ Fail — lỗi, ghi vào `Bug-Report.md`
- ⏭ Skip — chưa kiểm tra / không áp dụng

**Tài khoản demo:**

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@company.local | Admin123 |
| Employee (active) | active.employee@company.local | Active1234 |
| Employee (first login) | firstlogin.employee@company.local | Password123 |
| Employee (inactive) | inactive.employee@company.local | Inactive123 |

---

## WEEK 1 — Giao diện cơ bản

### TC-AUTH (Authentication)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-AUTH-01 | Đăng nhập admin đúng → redirect `/admin/dashboard` | ✅ |
| TC-AUTH-02 | Đăng nhập employee đúng → redirect `/employee/dashboard` | ✅ |
| TC-AUTH-03 | Đăng nhập sai password → hiện thông báo lỗi | ✅ |
| TC-AUTH-04 | Đăng nhập tài khoản inactive → hiện thông báo bị khoá | ✅ |
| TC-AUTH-05 | Truy cập `/admin/*` khi chưa đăng nhập → redirect login | ✅ |
| TC-AUTH-06 | Truy cập `/employee/*` khi chưa đăng nhập → redirect login | ✅ |
| TC-AUTH-07 | Employee cố truy cập `/admin/dashboard` → redirect | ✅ |
| TC-AUTH-08 | Admin cố truy cập `/employee/dashboard` → redirect | ✅ |
| TC-AUTH-09 | Đăng xuất → xóa token + redirect `/login` | ✅ |
| TC-AUTH-10 | Register với mã nhân viên không tồn tại → hiện lỗi | ✅ |
| TC-AUTH-11 | Register với email không khớp hồ sơ → hiện lỗi | ✅ |
| TC-AUTH-12 | Register thành công → redirect về login | ✅ |

### TC-EMP-DASH (Employee Dashboard)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-EMP-DASH-01 | Hiển thị tên nhân viên đúng trong greeting | ✅ |
| TC-EMP-DASH-02 | 3 metric cards: Tài sản / Yêu cầu / Công việc | ✅ |
| TC-EMP-DASH-03 | Danh sách tài sản gần đây hiển thị đúng | ✅ |
| TC-EMP-DASH-04 | Link "Xem tất cả" dẫn đến `/employee/assets` | ✅ |
| TC-EMP-DASH-05 | Responsive — không tràn ngang trên mobile 390px | ✅ |

### TC-SIDEBAR (Employee Navigation)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-SIDEBAR-01 | Sidebar hiển thị đủ 6 nav item | ✅ |
| TC-SIDEBAR-02 | Mobile: nút hamburger mở sidebar | ✅ |
| TC-SIDEBAR-03 | Mobile: click overlay đóng sidebar | ✅ |
| TC-SIDEBAR-04 | Active route được highlight đúng | ✅ |
| TC-SIDEBAR-05 | Hiển thị email user ở footer sidebar | ✅ |

---

## WEEK 2 — Profile, Change Password, API Auth

### TC-PROFILE (Employee Profile)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-PROFILE-01 | Hiển thị đầy đủ: mã NV, email, phòng ban, chức vụ, SĐT, ngày vào | ✅ |
| TC-PROFILE-02 | Avatar hiển thị 2 chữ cái đầu từ họ tên | ✅ |
| TC-PROFILE-03 | Link "Đổi mật khẩu" điều hướng đúng | ✅ |
| TC-PROFILE-04 | Email khớp với tài khoản đang đăng nhập | ✅ |

### TC-CHPASS (Change Password)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-CHPASS-01 | Submit form trống → hiện lỗi validate cho cả 3 trường | ✅ |
| TC-CHPASS-02 | Mật khẩu mới < 8 ký tự → hiện lỗi | ✅ |
| TC-CHPASS-03 | Mật khẩu mới không có số → hiện lỗi | ✅ |
| TC-CHPASS-04 | Mật khẩu xác nhận không khớp → hiện lỗi | ✅ |
| TC-CHPASS-05 | Mật khẩu mới trùng mật khẩu cũ → hiện lỗi | ✅ |
| TC-CHPASS-06 | Đổi đúng → hiện trạng thái thành công | ✅ |
| TC-CHPASS-07 | Nhập sai mật khẩu hiện tại → hiện lỗi từ API | ✅ |
| TC-CHPASS-08 | Toggle ẩn/hiện password hoạt động đúng | ✅ |

### TC-API-AUTH (API Integration Week 2)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-API-AUTH-01 | Login gọi `POST /api/auth/login` và nhận JWT | ✅ |
| TC-API-AUTH-02 | JWT được lưu vào localStorage | ✅ |
| TC-API-AUTH-03 | `GET /api/auth/me` trả về thông tin user đúng | ✅ |
| TC-API-AUTH-04 | Token hết hạn → tự redirect về `/login` | ✅ |
| TC-API-AUTH-05 | `PUT /api/auth/change-password` hoạt động đúng | ✅ |

---

## WEEK 3 — Asset Lifecycle, Detail, History

### TC-ASSETS (My Assets)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-ASSETS-01 | Hiển thị danh sách tài sản được bàn giao cho user | ✅ |
| TC-ASSETS-02 | Tìm kiếm theo mã tài sản | ✅ |
| TC-ASSETS-03 | Tìm kiếm theo tên tài sản | ✅ |
| TC-ASSETS-04 | Tìm kiếm không kết quả → hiện empty state | ✅ |
| TC-ASSETS-05 | Click card → navigate đến `/employee/assets/:code` | ✅ |
| TC-ASSETS-06 | User không có tài sản → hiện empty state | ✅ |

### TC-DETAIL (Asset Detail)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-DETAIL-01 | Trang chi tiết hiển thị đúng: tên, mã, danh mục, serial, ngày nhận | ✅ |
| TC-DETAIL-02 | StatusBadge hiển thị đúng trạng thái | ✅ |
| TC-DETAIL-03 | Lịch sử bảo trì của tài sản hiển thị đúng | ✅ |
| TC-DETAIL-04 | Tài sản không có bảo trì → hiện empty state | ✅ |
| TC-DETAIL-05 | Nút "Báo cáo sự cố" dẫn đến `/employee/requests` | ✅ |
| TC-DETAIL-06 | Nút "Quay lại" dẫn về `/employee/assets` | ✅ |
| TC-DETAIL-07 | URL sai mã tài sản → redirect về `/employee/assets` | ✅ |

### TC-REQ (Support Requests)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-REQ-01 | Danh sách yêu cầu hiển thị đúng | ✅ |
| TC-REQ-02 | Click "Tạo yêu cầu" → mở form | ✅ |
| TC-REQ-03 | Submit form thiếu mô tả → không submit | ✅ |
| TC-REQ-04 | Tạo yêu cầu thành công → hiện toast + cập nhật danh sách | ✅ |
| TC-REQ-05 | Trạng thái badge hiển thị đúng màu theo status | ✅ |
| TC-REQ-06 | Đóng form bằng nút X | ✅ |

### TC-HIST (History)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-HIST-01 | Tab "Bàn giao" hiển thị lịch sử bàn giao | ✅ |
| TC-HIST-02 | Tab "Bảo trì" hiển thị lịch sử bảo trì | ✅ |
| TC-HIST-03 | Switch tab hoạt động đúng | ✅ |
| TC-HIST-04 | Trạng thái ACTIVE / RETURNED / TRANSFERRED hiển thị đúng | ✅ |
| TC-HIST-05 | Không có lịch sử → hiện empty state | ✅ |

### TC-FLOW-01 (Full Employee Flow)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-FLOW-01 | Admin bàn giao → employee thấy tài sản mới ngay | ✅ |
| TC-FLOW-02 | Employee báo lỗi → admin thấy yêu cầu trong danh sách | ✅ |
| TC-FLOW-03 | Admin xử lý xong → status request employee thay đổi | ✅ |

---

## WEEK 4 — Full QA, Maintenance, Inventory, Reports

### TC-MAINT-ADMIN (Admin Maintenance)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-MAINT-01 | Admin xem danh sách yêu cầu bảo trì | ✅ |
| TC-MAINT-02 | Admin tạo yêu cầu bảo trì mới | ✅ |
| TC-MAINT-03 | Admin cập nhật trạng thái → IN_PROGRESS | ✅ |
| TC-MAINT-04 | Admin đánh dấu COMPLETED + nhập chi phí | ✅ |
| TC-MAINT-05 | Filter theo trạng thái hoạt động | ✅ |

### TC-INV (Inventory)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-INV-01 | Admin tạo phiên kiểm kê mới | ✅ |
| TC-INV-02 | Admin ghi kết quả kiểm kê (OK / DAMAGED / MISSING) | ✅ |
| TC-INV-03 | Admin đóng phiên kiểm kê → status COMPLETED | ✅ |

### TC-REPORT (Reports)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-REPORT-01 | Tổng số tài sản theo status hiển thị đúng | ✅ |
| TC-REPORT-02 | Tài sản theo danh mục hiển thị đúng | ✅ |
| TC-REPORT-03 | Số liệu khớp với dữ liệu seed | ✅ |

### TC-ROLE (Role Isolation)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-ROLE-01 | Employee không thấy menu admin | ✅ |
| TC-ROLE-02 | Employee gọi trực tiếp API admin → trả về 403 | ✅ |
| TC-ROLE-03 | Admin không thấy menu employee | ✅ |

### TC-MOBILE (Responsive)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-MOBILE-01 | Toàn bộ admin pages không tràn ngang ở 390px | ✅ |
| TC-MOBILE-02 | Toàn bộ employee pages không tràn ngang ở 390px | ✅ |
| TC-MOBILE-03 | Modal hiển thị đúng trên mobile | ✅ |
| TC-MOBILE-04 | Table ẩn cột thừa trên mobile | ✅ |

---

## WEEK 5 — Regression & Final

### TC-REGRESSION (Full Regression)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-REG-01 | Toàn bộ Playwright smoke tests pass | ✅ |
| TC-REG-02 | Không có console error trên bất kỳ trang nào | ✅ |
| TC-REG-03 | Seed data chạy thành công: `npx prisma db seed` | ✅ |
| TC-REG-04 | Backend start thành công: `npm run dev` | ✅ |
| TC-REG-05 | Frontend start thành công: `npm run dev` | ✅ |
| TC-REG-06 | Build production không có lỗi: `npm run build` | ✅ |

### TC-DEMO (Demo Readiness)

| ID | Mô tả | Kết quả |
|---|---|---|
| TC-DEMO-01 | Tài khoản demo hoạt động đúng | ✅ |
| TC-DEMO-02 | Seed data đã được chạy trước demo | ✅ |
| TC-DEMO-03 | Demo script đã được review | ✅ |
| TC-DEMO-04 | Screenshots đủ cho report | ✅ |
| TC-DEMO-05 | Không có hardcode URL production trong code | ✅ |