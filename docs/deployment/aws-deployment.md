# AWS Deployment Guide

## Scope

Guide này áp dụng cho chế độ **test/demo nội bộ**:

- không mua domain riêng
- dùng URL mặc định của `AWS Amplify Hosting`
- backend đi qua `AWS Amplify Hosting` bằng reverse proxy cho đường dẫn `/api`
- `Application Load Balancer` chỉ cần listener HTTP cho giai đoạn này
- chưa cần `Route 53` và `AWS Certificate Manager` custom domain

## Kiến trúc triển khai

### Frontend

- `AWS Amplify Hosting`
- `Amazon S3` nếu FE cần upload hoặc static assets riêng

### Backend

- `Application Load Balancer` public HTTP
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

## Kiến trúc truy cập thực tế

Vì không có domain riêng, FE không gọi thẳng backend bằng hostname riêng của bạn. Cách triển khai đúng cho mode này là:

1. User mở URL mặc định của `AWS Amplify Hosting`.
2. Frontend gọi API bằng đường dẫn tương đối `/api`.
3. `AWS Amplify Hosting` reverse proxy `/api/<*>` sang `http://<ALB-DNS-name>/api/<*>`.
4. `Application Load Balancer` chuyển request vào backend trong `AWS Elastic Beanstalk`.
5. Backend xử lý business logic và phát hành `JWT`.

Khi deploy xong, trình duyệt vẫn chỉ thấy origin của Amplify, nên tránh được lỗi CORS/mixed content ở mức triển khai demo.

## Cảnh báo trước khi deploy

Code backend hiện dùng CORS theo origin. Trước khi đưa FE lên Amplify, hãy set một trong các biến môi trường sau cho backend:

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

Làm bước này trước vì backend sẽ cần `DATABASE_URL` để khởi động.

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

## Bước 2: Tạo backend security group và Elastic Beanstalk environment

### 2.1 Tạo security group cho backend

1. Vào `EC2` console.
2. Chọn `Security Groups`.
3. Tạo security group mới cho backend.
4. Inbound rules:
   - `HTTP 80` từ security group của `Application Load Balancer`
   - `HTTPS 443` chỉ nếu bạn thật sự cần test HTTPS sau này
5. Outbound rules:
   - giữ mặc định để backend có thể gọi RDS và AWS services

### 2.2 Tạo Application Load Balancer

1. Vào `EC2` console.
2. Chọn `Load Balancers`.
3. Tạo `Application Load Balancer`.
4. Scheme: `internet-facing`.
5. Listener: `HTTP 80`.
6. Chọn VPC đúng với backend.
7. Chọn ít nhất 2 public subnets nếu VPC của bạn có sẵn.
8. Gắn security group của ALB:
   - inbound `80` từ internet
9. Tạo target group trỏ về backend environment.
10. Sau khi tạo xong, mở chi tiết `Application Load Balancer` và copy giá trị ở trường:

```text
DNS name
```

Giá trị này chính là `<ALB-DNS-name>` sẽ dùng ở bước deploy frontend.

### 2.3 Tạo Elastic Beanstalk environment

1. Tạo application `Node.js` trên `AWS Elastic Beanstalk`.
2. Chọn environment chạy `1 instance`.
3. Chọn `load balanced` nếu bạn muốn ALB quản lý traffic; nếu không thì giữ cấu hình nhỏ nhất phù hợp budget nhưng vẫn phải đi qua ALB.
4. Gắn environment với security group cho phép ALB vào backend.
5. Set các environment variables ở trên.
6. Đảm bảo instance của backend nằm trong private subnet.

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
VITE_API_BASE_URL=/api
```

5. Trong `Amplify Hosting`, vào `Rewrites and redirects`.
6. Thêm rule reverse proxy cho API:
   - Source address: `/api/<*>`
   - Target address: `http://<ALB-DNS-name>/api/<*>`
   - Type: `200 (Rewrite)`
7. Đặt rule API này **ở trên** rule SPA fallback nếu có.
8. Nếu app dùng React Router hoặc SPA route, giữ thêm rule fallback về `index.html`.

Trong đó `<ALB-DNS-name>` là giá trị bạn đã copy ở bước tạo ALB, ví dụ dạng:

```text
my-backend-alb-123456.ap-southeast-1.elb.amazonaws.com
```

Lý do dùng `VITE_API_BASE_URL=/api`:
- browser chỉ gọi cùng origin của Amplify
- Amplify tự proxy request sang ALB
- tránh phải mua domain riêng ở giai đoạn demo

## Bước 6: Chỉnh CORS và auth backend

1. Set `FRONTEND_ORIGIN` bằng URL Amplify mặc định.
2. Nếu có nhiều branch preview, dùng `FRONTEND_ORIGINS` và phân tách bằng dấu phẩy.
3. Redeploy backend sau khi set env xong.

Luồng đăng nhập / đăng ký / quên mật khẩu hiện do backend JWT xử lý, không dùng Cognito trong mode này.

## Bước 7: Kiểm tra nối FE với BE

1. Mở URL mặc định của Amplify.
2. Mở DevTools browser, tab Network.
3. Gọi thử một API từ frontend.
4. Xác nhận request đi tới `/api/...` trên origin của Amplify.
5. Xác nhận Amplify rewrite request sang `ALB`.
6. Xác nhận backend trả response thành công.

Nếu muốn upload file hoặc gọi email thật:

- backend phải có quyền IAM phù hợp
- `MAIL_*` phải là SMTP config hoạt động
- `S3_BUCKET` chỉ cần thêm nếu code upload đang bật

## Bước 8: Kiểm tra sau deploy

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
- `AWS Cognito`

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

`Amplify` cho FE -> reverse proxy `/api` -> `ALB HTTP + Elastic Beanstalk + RDS` cho BE -> `CloudWatch / CloudTrail / SSM` cho vận hành.
