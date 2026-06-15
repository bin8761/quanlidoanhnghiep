# AWS Deployment Guide

## Scope

Guide này áp dụng cho chế độ **test/demo nội bộ**:

- không mua domain riêng
- dùng URL mặc định của `AWS Amplify Hosting`
- dùng DNS name mặc định của `Application Load Balancer`
- chưa cần `Route 53` và `AWS Certificate Manager` custom domain

## Kiến trúc triển khai

### Frontend

- `AWS Amplify Hosting`
- `Amazon Cognito` nếu cần đăng nhập
- `Amazon S3` nếu FE cần upload hoặc static assets riêng

### Backend

- `Application Load Balancer`
- `AWS Elastic Beanstalk`
- `1 Amazon Elastic Compute Cloud instance`
- `Amazon Relational Database Service for MySQL Single-AZ`
- `Amazon Simple Storage Service` private bucket
- `Amazon Simple Email Service`
- `AWS Secrets Manager`
- `AWS Systems Manager Parameter Store`
- `Amazon CloudWatch Logs`
- `Amazon CloudWatch Alarms`
- `AWS CloudTrail`
- `AWS Systems Manager Session Manager`

## Cảnh báo trước khi deploy

Code backend hiện dùng CORS theo origin. Trước khi đưa FE lên Amplify, hãy set một trong các biến môi trường sau cho backend production:

- `FRONTEND_ORIGIN`
- `FRONTEND_ORIGINS`

Giá trị phải là URL mặc định của Amplify, ví dụ:

```text
https://main.xxxxx.amplifyapp.com
```

Nếu không set, browser từ FE sẽ bị backend chặn CORS.

## Biến môi trường backend

Backend đang đọc các biến sau từ `backend/src/config/env.js`:

- `NODE_ENV=production`
- `PORT=8080`
- `DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DEFAULT_USER_PASSWORD`
- `OTP_EXPIRES_SECONDS`
- `OTP_MAX_ATTEMPTS`
- `RATE_LIMIT_BUCKET_CAPACITY` nếu muốn override mặc định
- `RATE_LIMIT_REFILL_TOKENS_PER_SECOND` nếu muốn override mặc định
- `RATE_LIMIT_TOKENS_PER_REQUEST` nếu muốn override mặc định
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS`

## Bước 1: Tạo RDS MySQL

1. Tạo `Amazon RDS for MySQL`.
2. Chọn `Single-AZ`.
3. Đặt trong private subnet.
4. Tắt public access.
5. Bật storage encryption.
6. Tạo database name và user riêng cho ứng dụng.
7. Ghi lại:
   - endpoint
   - port
   - database name
   - username
   - password

Security group của RDS chỉ nên cho phép inbound `3306` từ security group của backend.

## Bước 2: Tạo backend environment trên Elastic Beanstalk

1. Tạo application `Node.js` trên `AWS Elastic Beanstalk`.
2. Chọn environment chạy `1 instance`.
3. Chọn `single instance` hoặc cấu hình nhỏ nhất phù hợp budget.
4. Gắn environment với security group cho phép ALB vào backend.
5. Set các environment variables ở trên.

Nếu deploy từ source bundle, backend entrypoint là:

```text
backend/src/app/server.js
```

Kiểm tra sức khỏe sau deploy:

```text
GET /api/health
```

## Bước 3: Cấu hình database connection

`DATABASE_URL` phải trỏ tới RDS thật.

Ví dụ:

```text
mysql://asset_app:password@your-rds-endpoint.ap-southeast-1.rds.amazonaws.com:3306/enterprise_asset_management
```

Lưu ý:

- password phải được URL encode nếu có ký tự đặc biệt
- không dùng master user trong `DATABASE_URL`

## Bước 4: Chạy migration

Trước khi đưa backend vào chạy thật:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Nếu là database trống và bạn muốn nạp dữ liệu mẫu:

```bash
npx prisma db seed
```

Không chạy seed lên production đã có dữ liệu thật nếu không kiểm soát rõ.

## Bước 5: Deploy frontend lên Amplify

1. Kết nối repository frontend với `AWS Amplify Hosting`.
2. Build command:

```bash
npm ci && npm run build
```

3. Output directory:

```text
dist
```

4. Set biến môi trường frontend:

```text
VITE_API_BASE_URL=https://<ALB-DNS-name>/api
```

Nếu backend có stage path khác, chỉnh lại cho đúng.

## Bước 6: Nối FE với BE

Frontend gọi backend bằng URL của `Application Load Balancer`, không gọi IP raw.

Luồng thực tế:

- user mở URL mặc định của Amplify
- FE gọi `VITE_API_BASE_URL`
- backend xử lý request qua ALB

Nếu muốn upload file hoặc gọi email thật:

- backend phải có quyền IAM phù hợp
- `MAIL_*` phải là SMTP config hoạt động
- `S3_BUCKET` chỉ cần thêm nếu code upload đang bật

## Bước 7: Kiểm tra sau deploy

Kiểm tra theo thứ tự:

1. Mở URL Amplify.
2. Đăng nhập hoặc đăng ký.
3. Gọi API `GET /api/health`.
4. Thử một luồng CRUD chính.
5. Thử gửi OTP hoặc email nếu feature đó đã bật.
6. Kiểm tra log trong `Amazon CloudWatch Logs`.
7. Xác nhận backend không bị CORS fail.

## Những gì chưa dùng trong chế độ này

- `Amazon Route 53`
- `AWS Certificate Manager` custom domain
- `Amazon ElastiCache for Redis`
- `Multi-AZ`
- `AWS Web Application Firewall`
- `NAT Gateway`

## Khi nào nên nâng cấp

Nên thêm custom domain, `Route 53`, và `AWS Certificate Manager` khi:

- muốn HTTPS chuẩn trên hostname của riêng bạn
- muốn production ổn định hơn
- muốn tách `app.domain` và `api.domain`

Nên thêm `Amazon ElastiCache for Redis`, `Multi-AZ`, và các thành phần nâng cấp khác khi:

- traffic tăng
- cần reliability cao hơn
- cần scale ngang hoặc shared state

## Kết luận

Đây là đường triển khai rẻ nhất nhưng vẫn đúng logic hệ thống hiện tại:

`Amplify` cho FE -> `ALB + Elastic Beanstalk + RDS` cho BE -> `CloudWatch / CloudTrail / SSM` cho vận hành.
