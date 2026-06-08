# Demo Script — Enterprise Asset Management

**Người thực hiện:** Person 5  
**Thời lượng ước tính:** 12–15 phút  
**URL:** `http://localhost:5173`

---

## Chuẩn bị trước demo

```bash
# 1. Chạy seed data
cd backend
npx prisma db seed

# 2. Start backend
npm run dev          # chạy ở terminal 1 — port 4000

# 3. Start frontend
cd ../frontend
npm run dev          # chạy ở terminal 2 — port 5173
```

**Tài khoản dùng trong demo:**

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@company.local | Admin123 |
| Employee | active.employee@company.local | Active1234 |

---

## Phần 1 — Admin Login & Dashboard (2 phút)

**Tài khoản:** `admin@company.local` / `Admin123`

1. Mở `http://localhost:5173` → trang Login hiển thị
2. Nhập email và password → click **Đăng nhập hệ thống**
3. Redirect vào `/admin/dashboard`
4. **Điểm nổi bật:**
   - Greeting theo giờ trong ngày
   - 4 metric cards: Tổng tài sản / Đang sử dụng / Bảo trì / Nhân viên
   - Sidebar với đầy đủ module

---

## Phần 2 — Admin: Quản lý tài sản & Danh mục (2 phút)

5. Click **Danh mục** trong sidebar → trang Danh mục tài sản
6. Tạo danh mục mới: nhập tên → **Thêm danh mục** → toast thành công
7. Click **Tài sản** → trang Quản lý tài sản
8. **Demo tìm kiếm:** gõ "Dell" → bảng lọc tức thì
9. Click **Thêm tài sản** → modal với đầy đủ trường: Mã, Tên, Danh mục, Serial, Giá trị
10. Điền và lưu → toast thành công

---

## Phần 3 — Admin: Bàn giao tài sản cho nhân viên (2 phút)

11. Click **Bàn giao** trong sidebar → trang Quản lý bàn giao
12. Click **Tạo bàn giao**
13. Chọn tài sản: `LT-002 - HP EliteBook 840 G10` (status AVAILABLE)
14. Chọn nhân viên: `EMP004 - Active User Employee`
15. Nhập ghi chú → **Xác nhận bàn giao** → toast thành công
16. Quan sát: tài sản đổi status → ASSIGNED trong danh sách

---

## Phần 4 — Employee Login & Dashboard (1.5 phút)

17. Đăng xuất admin
18. Đăng nhập bằng `active.employee@company.local` / `Active1234`
19. Redirect vào `/employee/dashboard`
20. **Điểm nổi bật:**
    - Greeting cá nhân hoá
    - 3 metric cards: Tài sản đang giữ / Yêu cầu đang xử lý / Công việc
    - Danh sách tài sản gần đây
21. **Demo mobile:** thu nhỏ trình duyệt → sidebar collapsible

---

## Phần 5 — Employee: Xem tài sản & Chi tiết (1.5 phút)

22. Click **Tài sản của tôi** → danh sách tài sản được bàn giao
23. Demo tìm kiếm: gõ "Dell"
24. Click vào card `Dell Latitude 5440`
25. Trang chi tiết hiển thị: tên, mã, danh mục, serial, ngày nhận, trạng thái
26. Cuộn xuống → **Lịch sử bảo trì** của thiết bị đó

---

## Phần 6 — Employee: Báo cáo sự cố (1.5 phút)

27. Click **Báo cáo sự cố / hỏng hóc** từ trang chi tiết
28. Trang **Yêu cầu hỗ trợ** → click **Tạo yêu cầu**
29. Form mở ra: chọn tài sản, mức độ ưu tiên, mô tả sự cố
30. Điền: `"Màn hình bị chớp sau khi khởi động"` → **Gửi yêu cầu**
31. Toast thành công + yêu cầu mới xuất hiện đầu danh sách với status **Chờ tiếp nhận**

---

## Phần 7 — Employee: Lịch sử & Hồ sơ (1 phút)

32. Click **Lịch sử** trong sidebar
33. Tab **Lịch sử bàn giao** → danh sách tài sản từng nhận / trả
34. Chuyển tab **Lịch sử bảo trì** → danh sách yêu cầu cũ
35. Click **Hồ sơ cá nhân** → thông tin nhân viên đầy đủ
36. Click **Đổi mật khẩu** → form với validate

---

## Phần 8 — Admin: Bảo trì & Báo cáo (1.5 phút)

37. Đăng xuất employee → đăng nhập lại admin
38. Click **Bảo trì** → thấy yêu cầu vừa tạo từ employee
39. Cập nhật status → **IN_PROGRESS**
40. Click **Báo cáo** → dashboard số liệu: tổng tài sản, phân bổ theo danh mục, tài sản theo trạng thái

---

## Phần 9 — AWS Deployment (nếu có, 1 phút)

41. Mở URL production trên AWS
42. Demo nhanh login → dashboard (cùng flow như local)
43. Xác nhận backend kết nối RDS thành công

---

## Kết luận (30 giây)

> "Hệ thống EAM hoàn chỉnh với đầy đủ luồng từ admin đến nhân viên:
> quản lý tài sản → bàn giao → theo dõi → báo cáo sự cố → xử lý bảo trì → báo cáo.
> Giao diện responsive hoạt động tốt trên cả desktop và mobile."

---

## Backup — nếu có sự cố kỹ thuật

- **Backend không start:** chạy `npm install` rồi thử lại
- **Database lỗi:** chạy lại `npx prisma db seed`
- **Frontend trắng trang:** kiểm tra `.env` có `VITE_API_BASE_URL` đúng chưa
- **Dùng screenshot** trong `docs/screenshots/` để trình bày nếu không demo live được