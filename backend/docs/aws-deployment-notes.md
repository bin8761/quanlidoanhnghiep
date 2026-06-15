# Ghi Chú Triển Khai AWS

## Thiết Lập RDS MySQL Tuần 2

### Cấu Hình Staging Được Khuyến Nghị

- Engine: Amazon RDS for MySQL 8.0, đồng nhất với phiên bản MySQL được sử dụng
  ở môi trường local.
- Instance: `db.t4g.micro` hoặc loại máy nhỏ nhất phù hợp với ngân sách dự án.
- Lưu trữ: General Purpose SSD (`gp3`), 20 GiB, bật tự động mở rộng dung lượng.
- Khả dụng: Single-AZ cho staging; sử dụng Multi-AZ cho production khi ngân sách
  cho phép.
- Kết nối: chỉ cho phép truy cập riêng tư (`Publicly accessible = No`).
- Mã hóa: bật mã hóa dữ liệu lưu trữ khi tạo instance.
- Sao lưu: bật sao lưu tự động với thời gian lưu ít nhất 7 ngày.
- Bảo vệ: bật chống xóa nhầm cho môi trường production.
- Giám sát: bật Performance Insights và xuất log lỗi, slow-query sang CloudWatch
  nếu phù hợp với ngân sách.

### Mạng Và Security Group

1. Đặt RDS trong DB subnet group chứa các private subnet thuộc ít nhất hai
   Availability Zone.
2. Tạo security group cho backend chạy trên Elastic Beanstalk hoặc EC2.
3. Tạo security group cho RDS với một quy tắc inbound:
   - Loại: MySQL/Aurora
   - Cổng: `3306`
   - Nguồn: security group của backend
4. Không cho phép `0.0.0.0/0` hoặc IP của lập trình viên truy cập trực tiếp vào
   security group của RDS production.
5. Khi cần quản trị, sử dụng bastion/SSM tunnel tạm thời hoặc chạy migration từ
   môi trường backend.

### Khởi Tạo Cơ Sở Dữ Liệu

Tạo cơ sở dữ liệu và tài khoản riêng cho ứng dụng. Không sử dụng tài khoản
master của RDS trong `DATABASE_URL`.

```sql
CREATE DATABASE enterprise_asset_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'asset_app'@'%' IDENTIFIED BY '<mat-khau-manh-duoc-tao-tu-dong>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON enterprise_asset_management.* TO 'asset_app'@'%';
FLUSH PRIVILEGES;
```

Lưu chuỗi kết nối trong AWS Systems Manager Parameter Store, Secrets Manager
hoặc thuộc tính môi trường được bảo vệ của nền tảng:

```text
mysql://asset_app:<mat-khau-da-url-encode>@<rds-endpoint>:3306/enterprise_asset_management
```

Mật khẩu phải được URL encode trước khi đưa vào `DATABASE_URL`.

### Migration Và Xác Minh

Chạy các lệnh sau từ máy có thể kết nối tới endpoint riêng tư của RDS:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Chỉ sử dụng `prisma db seed` cho cơ sở dữ liệu staging/demo trống. Không tự động
chạy lệnh này trên cơ sở dữ liệu production đã có dữ liệu.

Kiểm tra trạng thái migration:

```bash
npx prisma migrate status
```

- Backend khởi động mà không có lỗi kết nối Prisma.
- `GET /api/health` trả về thành công.
- Luồng tạo, đọc và cập nhật dữ liệu hoạt động trên RDS.
- Thời gian lưu bản sao lưu, mã hóa, security group và chống xóa nhầm đúng với
  yêu cầu của môi trường.
- Thông tin đăng nhập không được commit vào Git hoặc xuất hiện trong log triển
  khai.

### Khôi Phục Và Vận Hành

- Tạo snapshot thủ công trước migration có khả năng phá vỡ dữ liệu hoặc trước
  các bản phát hành lớn.
- Kiểm thử việc khôi phục snapshot sang một RDS instance riêng trước khi bàn
  giao cuối cùng.
- Đổi thông tin đăng nhập ứng dụng sau bất kỳ sự cố lộ thông tin nào.
- Tạo cảnh báo CloudWatch cho CPU cao, dung lượng trống thấp và số kết nối cơ sở
  dữ liệu gần đạt giới hạn instance.

## Kiến Trúc Mục Tiêu

- RDS MySQL lưu dữ liệu production. Sử dụng private subnet, sao lưu tự động, mã
  hóa dữ liệu lưu trữ và security group chỉ cho phép lưu lượng MySQL từ môi
  trường chạy backend.
- Backend có thể chạy trên Elastic Beanstalk Node.js hoặc EC2 phía sau
  Application Load Balancer. Elastic Beanstalk là lựa chọn nhanh hơn cho tuần
  cuối vì hỗ trợ quản lý tiến trình, phiên bản triển khai và tích hợp CloudWatch.
- S3 lưu ảnh tài sản và tài liệu bảo trì nếu dự án có chức năng tải tệp. Giữ
  bucket ở chế độ riêng tư và cung cấp tệp bằng presigned URL hoặc endpoint
  backend có kiểm soát.
- CloudWatch nhận log ứng dụng và log nền tảng. Cấu hình thời gian lưu log rõ
  ràng, ví dụ 14 hoặc 30 ngày cho staging và lâu hơn cho production nếu cần.

## Biến Môi Trường Bắt Buộc

- `NODE_ENV=production`
- `PORT=8080` hoặc cổng do nền tảng cung cấp
- `DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DEFAULT_USER_PASSWORD`
- `OTP_EXPIRES_SECONDS`
- `OTP_MAX_ATTEMPTS`
- Các biến `MAIL_*` nếu bật email đặt lại mật khẩu
- `S3_BUCKET`, `AWS_REGION` và các biến liên quan nếu bật tải tệp lên S3
- `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS` nếu FE chạy từ Amplify hoặc URL production khác

## Quy Trình Triển Khai

1. Tạo RDS MySQL instance và tài khoản cơ sở dữ liệu.
2. Lưu secret trong thuộc tính môi trường Elastic Beanstalk, môi trường EC2 hoặc
   AWS Systems Manager Parameter Store.
3. Chạy Prisma migration trên production:

   ```bash
   npx prisma migrate deploy
   ```

4. Đóng gói và triển khai backend.
5. Kiểm tra `/api/health`.
6. Kiểm thử nhanh các API yêu cầu xác thực:
   - `POST /api/assignments/assign`
   - `POST /api/assignments/return`
   - `POST /api/assignments/transfer`
   - `GET /api/maintenance-requests`
   - `GET /api/inventory-sessions`
   - `GET /api/reports/summary`
7. Xác nhận log CloudWatch có request ID và lỗi backend.

## Bàn Giao Cho Frontend

- Frontend admin có thể xây dựng màn hình phân bổ, thu hồi, chuyển giao, cập
  nhật trạng thái bảo trì, phiên/mục kiểm kê và báo cáo.
- Frontend nhân viên có thể tạo yêu cầu bảo trì và hiển thị trạng thái bằng
  `GET /api/maintenance-requests?requesterId=<employeeId>`.
- Các endpoint báo cáo trả về dữ liệu tổng hợp có thể dùng trực tiếp cho thẻ
  thống kê và biểu đồ.
