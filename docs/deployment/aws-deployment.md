# AWS Deployment Guide

## Phạm vi

Tài liệu này áp dụng cho chế độ **test/demo nội bộ**, không dùng `Route 53` và không cần mua domain riêng.

Luồng hiện tại:

- Frontend dùng URL mặc định của `AWS Amplify Hosting`
- Frontend gọi API qua đường dẫn tương đối `/api`
- `AWS Amplify Hosting` rewrite `/api/<*>` sang DNS name của `Application Load Balancer`
- `Application Load Balancer` nằm trong `public subnet`
- Backend chạy trên `AWS Elastic Beanstalk`
- `Amazon RDS for MySQL` nằm trong `private subnet`

Mục tiêu của guide này:

- để người mới có thể deploy theo từng bước
- giữ chi phí thấp
- tránh phải quyết định kiến trúc quá sớm
- có thể dùng được ngay cho team lần đầu lên AWS

## Kiến trúc mục tiêu

### Frontend

- `AWS Amplify Hosting`

### Mạng

- `Internet Gateway`
- `Public subnet` trên 2 Availability Zone
- `NAT Gateway`
- `Private subnet` trên 2 Availability Zone

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

## Yêu cầu trước khi bắt đầu

Trước khi vào AWS console, cần chuẩn bị sẵn:

- AWS account có quyền tạo `Amplify`, `EC2`, `ELB`, `RDS`, `S3`, `SES`, `Secrets Manager`, `SSM`, `CloudWatch`, `CloudTrail`
- 1 AWS Region cố định cho toàn bộ resource
- repository frontend và backend đã tách rõ
- giá trị production cho:
  - `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS`
  - `JWT_SECRET`
  - `DEFAULT_USER_PASSWORD`
  - thông tin SMTP cho `MAIL_*`
  - thông tin RDS cho `DATABASE_URL`

Checklist trước khi bắt đầu:

- [ ] Đã chốt `AWS Region`
- [ ] Đã có AWS account và quyền console phù hợp
- [ ] Đã có URL repo frontend và backend
- [ ] Đã có giá trị biến môi trường production
- [ ] Đã đồng ý dùng bản không Route 53, không custom domain

## Biến môi trường backend

Backend đang đọc các biến sau:

- `NODE_ENV=production`
- `PORT=8080`
- `DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DEFAULT_USER_PASSWORD`
- `OTP_EXPIRES_SECONDS`
- `OTP_MAX_ATTEMPTS`
- `RATE_LIMIT_BUCKET_CAPACITY`
- `RATE_LIMIT_REFILL_TOKENS_PER_SECOND`
- `RATE_LIMIT_TOKENS_PER_REQUEST`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS`

## Step-by-step console checklist

Đây là thứ tự thao tác đề xuất:

1. Tạo RDS MySQL
2. Tạo backend security group
3. Tạo Internet Gateway, public subnet, NAT Gateway, private subnet nếu chưa có
4. Tạo Application Load Balancer
5. Tạo Elastic Beanstalk environment
6. Chạy Prisma migration
7. Deploy frontend lên Amplify
8. Chỉnh CORS và auth backend
9. Kiểm tra FE -> BE

## Bước 1: Tạo RDS MySQL

Làm bước này trước vì backend sẽ cần `DATABASE_URL` để khởi động.

### 1.1 Mục tiêu

Tạo cơ sở dữ liệu MySQL riêng cho ứng dụng, nằm trong private subnet, không public ra Internet.

### 1.2 Console checklist

- [ ] Đang ở đúng region đã chốt
- [ ] Engine là `MySQL`
- [ ] Chọn `Single-AZ`
- [ ] Public access = `No`
- [ ] Subnet group là private subnet
- [ ] Đã có database name, username, password riêng cho ứng dụng

### 1.3 Các bước thao tác

1. Đăng nhập AWS Console.
2. Tìm dịch vụ `RDS`.
3. Chọn `Create database`.
4. Chọn `Standard create`.
5. Ở `Engine type`, chọn `MySQL`.
6. Ở `Templates`, chọn `Dev/Test` hoặc cấu hình chi phí thấp.
7. Ở `DB instance identifier`, đặt tên rõ ràng, ví dụ:
   - `eam-mysql-demo`
8. Ở `Master username`, đặt username riêng cho ứng dụng, ví dụ:
   - `asset_app`
9. Đặt mật khẩu mạnh và lưu lại ở nơi an toàn.
10. Ở `DB instance class`, chọn instance nhỏ nhất phù hợp budget.
11. Ở `Storage`, giữ dung lượng nhỏ cho demo, bật auto scaling nếu cần.
12. Ở `Connectivity`:
   - chọn đúng VPC
   - chọn private subnet group
   - để `Public access` là `No`
13. Ở `VPC security group`, tạo mới hoặc chọn security group riêng cho RDS.
14. Bật `Storage encryption`.
15. Ở `Additional configuration`, đặt tên database ban đầu, ví dụ:
   - `enterprise_asset_management`
16. Bấm `Create database`.

### 1.4 Sau khi tạo xong

Khi instance chuyển sang `Available`, ghi lại:

- endpoint
- port
- database name
- username
- password

### 1.5 Cấu hình security group cho RDS

Trong `EC2` console, vào `Security Groups`:

1. Tìm security group của RDS.
2. Chỉ cho phép inbound `3306` từ security group của backend.
3. Không mở `3306` ra `0.0.0.0/0`.

Checklist:

- [ ] RDS không public
- [ ] Chỉ backend SG được vào `3306`
- [ ] Không có rule mở rộng ra Internet

## Bước 2: Tạo backend security group

Mục tiêu: chỉ cho ALB gọi vào backend, không cho Internet vào trực tiếp backend.

### 2.1 Console checklist

- [ ] Đã có security group của ALB
- [ ] Đã biết security group nào dành cho backend
- [ ] Chỉ mở `80` từ ALB sang backend
- [ ] Không mở public trực tiếp vào backend instance

### 2.2 Các bước thao tác

1. Mở `EC2`.
2. Chọn `Security Groups`.
3. Chọn `Create security group`.
4. Đặt tên, ví dụ:
   - `eam-backend-sg`
5. Chọn đúng VPC.
6. Thêm inbound rule:
   - Type: `HTTP`
   - Port: `80`
   - Source: security group của ALB
7. Nếu cần test HTTPS sau này, có thể thêm `443`, nhưng giai đoạn này chưa bắt buộc.
8. Giữ outbound mặc định để backend có thể gọi RDS và AWS services.
9. Tạo security group.

## Bước 3: Chuẩn bị mạng

Nếu VPC chưa có sẵn public/private subnet chuẩn, hãy tạo:

- 1 `Internet Gateway`
- 2 `public subnet` ở 2 Availability Zone
- 2 `private subnet` ở 2 Availability Zone
- 1 `NAT Gateway` trong public subnet

### 3.1 Ý nghĩa

- `Internet Gateway` là cửa ra vào của VPC
- `ALB` phải nằm trong public subnet
- `NAT Gateway` giúp backend private đi ra ngoài khi cần
- `Web/App` và `RDS` nằm trong private subnet

### 3.2 Checklist

- [ ] VPC có `Internet Gateway`
- [ ] Có 2 public subnet ở 2 AZ
- [ ] Có 2 private subnet ở 2 AZ
- [ ] `NAT Gateway` nằm trong public subnet

## Bước 4: Tạo Application Load Balancer

### 4.1 Mục tiêu

Nhận request từ Internet và chuyển vào backend.

### 4.2 Console checklist

- [ ] Chọn `internet-facing`
- [ ] Listener đầu tiên là `HTTP 80`
- [ ] Chọn đúng VPC của backend
- [ ] Chọn ít nhất 2 public subnets ở 2 AZ
- [ ] Gắn security group cho ALB với inbound `80` từ Internet

### 4.3 Các bước thao tác

1. Mở `EC2`.
2. Chọn `Load Balancers`.
3. Chọn `Create load balancer`.
4. Chọn `Application Load Balancer`.
5. Đặt tên, ví dụ:
   - `eam-backend-alb`
6. Chọn scheme `internet-facing`.
7. Chọn listener `HTTP` trên port `80`.
8. Chọn đúng VPC của backend.
9. Chọn ít nhất 2 public subnets ở 2 AZ.
10. Gắn security group của ALB:
    - inbound `80` từ Internet
11. Tạo target group trỏ về backend environment hoặc instance của Elastic Beanstalk.
12. Sau khi tạo xong, mở chi tiết `Application Load Balancer` và copy giá trị ở trường `DNS name`.

Giá trị này chính là `<ALB-DNS-name>` dùng ở bước deploy frontend.

### 4.4 Lưu ý quan trọng

ALB cần được attach vào ít nhất 2 public subnets để thể hiện khả năng chịu lỗi giữa các AZ.

## Bước 5: Tạo Elastic Beanstalk environment

### 5.1 Mục tiêu

Chạy backend Node.js phía sau ALB.

### 5.2 Console checklist

- [ ] Application type là `Node.js`
- [ ] Environment chạy `1 instance`
- [ ] Kiểu environment đi qua ALB
- [ ] Đã chuẩn bị xong environment variables
- [ ] Biết trước backend nghe ở port nào

### 5.3 Các bước thao tác

1. Mở `Elastic Beanstalk`.
2. Chọn `Create application`.
3. Đặt tên application, ví dụ:
   - `eam-backend`
4. Chọn platform `Node.js`.
5. Chọn `Single instance` hoặc `Load balanced` tùy cách tổ chức, nhưng vẫn phải đi qua ALB.
6. Chọn đúng VPC và subnet.
7. Gắn security group của backend.
8. Ở phần `Application code`, chọn source bundle `.zip` của backend.
9. Ở phần `Software` hoặc `Environment properties`, set các biến môi trường:
   - `NODE_ENV=production`
   - `PORT=8080`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `DEFAULT_USER_PASSWORD`
   - `OTP_EXPIRES_SECONDS`
   - `OTP_MAX_ATTEMPTS`
   - `RATE_LIMIT_BUCKET_CAPACITY`
   - `RATE_LIMIT_REFILL_TOKENS_PER_SECOND`
   - `RATE_LIMIT_TOKENS_PER_REQUEST`
   - `MAIL_HOST`
   - `MAIL_PORT`
   - `MAIL_SECURE`
   - `MAIL_USER`
   - `MAIL_PASSWORD`
   - `MAIL_FROM`
   - `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS`

### 5.4 Đóng gói backend để upload

Đây là chỗ người mới hay vấp nhất. Cách đơn giản nhất là tạo một file `.zip` chỉ chứa nội dung bên trong thư mục `backend/`, không nén cả thư mục cha của repo.

#### Cần đóng gói những gì

Trong file `.zip`, nên có trực tiếp:

- `package.json`
- `package-lock.json`
- `src/`
- `prisma/`
- `public/` hoặc thư mục static nếu backend đang dùng
- các file cấu hình cần thiết cho runtime

Không nên đưa vào:

- `node_modules/` nếu AWS tự cài dependencies khi deploy
- file `.env`
- dữ liệu nhạy cảm
- file build thừa không dùng trong runtime

#### Cách làm an toàn cho người mới

1. Mở terminal tại thư mục `backend`.
2. Kiểm tra `backend/package.json` có `main: "src/app/server.js"` và script `start`.
3. Chạy `npm install` hoặc `npm ci` để bảo đảm `package-lock.json` và dependencies đồng bộ.
4. Nếu cần, test cục bộ bằng:

```bash
npm start
```

5. Nén toàn bộ nội dung bên trong thư mục `backend/` thành một file `.zip`.
6. Đặt tên file rõ ràng, ví dụ:
   - `backend-eb-source.zip`
7. Nếu dùng một file zip để upload lên Elastic Beanstalk, file zip đó phải chứa `package.json` ở ngay root của zip, không phải nằm trong một thư mục `backend/` lồng thêm một tầng nữa.

#### Nếu deploy từ Elastic Beanstalk console

1. Mở environment của Elastic Beanstalk.
2. Chọn `Upload and deploy`.
3. Chọn file `.zip` vừa tạo.
4. Bấm `Deploy`.
5. Chờ environment cập nhật xong rồi mới tiếp tục.

#### Lưu ý quan trọng

- nếu zip sai cấp thư mục, Elastic Beanstalk có thể không tìm thấy `package.json`
- nếu thiếu `package-lock.json`, môi trường cài dependency có thể không ổn định giữa các lần deploy
- nếu code backend dùng Prisma, hãy bảo đảm thư mục `prisma/` có trong zip

### 5.5 Cổng backend

Backend phải lắng nghe đúng cổng mà Elastic Beanstalk cấp.

Theo guide này:

- dùng `PORT=8080`
- kiểm tra code backend có đọc biến `PORT` từ môi trường

Sau khi deploy, kiểm tra endpoint:

```text
GET /api/health
```

## Bước 6: Chạy migration

### 6.1 Khi nào chạy bước này

Chạy sau khi backend đã nhìn thấy RDS, nhưng trước khi người dùng bắt đầu sử dụng hệ thống thật.

### 6.2 Lệnh cần chạy

Mở terminal trong thư mục backend rồi chạy:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Nếu là database trống và muốn nạp dữ liệu mẫu:

```bash
npx prisma db seed
```

Không chạy seed lên production đã có dữ liệu thật nếu không kiểm soát rõ.

### 6.3 Console checklist

- [ ] Backend instance có thể kết nối tới RDS private endpoint
- [ ] `DATABASE_URL` đã trỏ đúng về RDS
- [ ] `npx prisma generate` chạy thành công
- [ ] `npx prisma migrate deploy` chạy thành công
- [ ] Chỉ chạy seed khi môi trường còn trống hoặc staging/demo

## Bước 7: Deploy frontend lên Amplify

### 7.1 Mục tiêu

Đưa frontend lên `AWS Amplify Hosting` để team có URL demo cố định.

### 7.2 Console checklist

- [ ] Repo frontend đã kết nối với Amplify
- [ ] Build command đúng là `npm ci && npm run build`
- [ ] Output directory đúng là `dist`
- [ ] `VITE_API_BASE_URL=/api`
- [ ] Rewrite `/api/<*>` nằm trên SPA fallback
- [ ] Đã copy đúng `ALB-DNS-name`

### 7.3 Các bước thao tác

1. Mở `AWS Amplify`.
2. Chọn `New app` hoặc `Host web app`.
3. Kết nối repository frontend.
4. Chọn branch cần deploy, thường là `main`.
5. Chọn app root là thư mục `frontend/` nếu Amplify hỏi monorepo root.
6. Ở phần `Build settings`, set build command:

```bash
npm ci && npm run build
```

7. Set output directory:

```text
dist
```

8. Ở phần environment variables của Amplify, set:

```text
VITE_API_BASE_URL=/api
```

9. Deploy app.
10. Sau khi deploy xong, mở mục `Domain management` hoặc URL mặc định để lấy địa chỉ frontend chính xác dùng cho CORS.

### 7.4 Rewrite rule cho API

Sau khi app được tạo xong:

1. Vào `App settings` rồi mở `Rewrites and redirects`.
2. Thêm rule mới:
   - Source address: `/api/<*>`
   - Target address: `http://<ALB-DNS-name>/api/<*>`
   - Type: `200 (Rewrite)`
3. Đặt rule API này ở trên rule SPA fallback nếu có.
4. Nếu app dùng React Router hoặc SPA route, giữ thêm rule fallback về `index.html`.
5. Nếu app có nhiều rule khác, luôn đặt rule `/api/<*>` ưu tiên trước, để request API không bị bắt nhầm vào route SPA.

### 7.5 Vì sao dùng `VITE_API_BASE_URL=/api`

Lý do:

- browser chỉ gọi cùng origin của Amplify
- Amplify tự proxy request sang ALB
- tránh phải mua domain riêng ở giai đoạn demo

## Bước 8: Chỉnh CORS và auth backend

### 8.1 Mục tiêu

Đảm bảo frontend từ Amplify gọi backend qua proxy `/api` mà không bị CORS chặn.

### 8.2 Các bước thao tác

1. Lấy URL mặc định của Amplify sau khi deploy xong.
2. Set `FRONTEND_ORIGIN` bằng URL đó.
3. Nếu có nhiều branch preview, dùng `FRONTEND_ORIGINS` và phân tách bằng dấu phẩy.
4. Redeploy backend sau khi set env xong.
5. Nếu backend có nhiều origin được phép, kiểm tra lại danh sách origin thật sự trong code trước khi deploy.

### 8.3 Ví dụ

```text
FRONTEND_ORIGIN=https://main.xxxxx.amplifyapp.com
```

### 8.4 Lưu ý

Luồng đăng nhập, đăng ký và quên mật khẩu hiện do backend JWT xử lý, không dùng Cognito trong mode này.

## Bước 9: Kiểm tra nối FE với BE

### 9.1 Kiểm tra bằng trình duyệt

1. Mở URL mặc định của Amplify.
2. Mở DevTools của browser, tab `Network`.
3. Gọi thử một API từ frontend.
4. Xác nhận request đi tới `/api/...` trên origin của Amplify.
5. Xác nhận Amplify rewrite request sang `ALB`.
6. Xác nhận backend trả response thành công.

### 9.2 Kiểm tra backend health

Gọi trực tiếp:

```text
GET /api/health
```

Nếu endpoint này trả `200`, backend đang sống và ALB đã trỏ đúng.

### 9.3 Nếu có upload file hoặc gửi email

- backend phải có quyền IAM phù hợp
- `MAIL_*` phải là SMTP config hoạt động
- `S3_BUCKET` chỉ cần thêm nếu code upload đang bật

## Bước 10: Kiểm tra sau deploy

Khi hệ thống đã lên, kiểm tra theo thứ tự:

1. Mở URL Amplify.
2. Đăng nhập hoặc đăng ký.
3. Gọi API `GET /api/health`.
4. Thử một luồng CRUD chính.
5. Thử gửi OTP hoặc email nếu feature đó đã bật.
6. Kiểm tra log trong `Amazon CloudWatch Logs`.
7. Xác nhận backend không bị CORS fail.

## Post-deploy verification + troubleshooting

### Xác minh nhanh

- [ ] Frontend mở được trên URL Amplify
- [ ] `GET /api/health` trả `200`
- [ ] Login/forgot password chạy được
- [ ] Một luồng CRUD chính chạy thành công
- [ ] Upload file nếu có tính năng này
- [ ] Gửi email/OTP nếu đã bật feature đó
- [ ] CloudWatch Logs có log backend
- [ ] Không có lỗi CORS trên browser

### Nếu gặp lỗi thì kiểm tra theo thứ tự này

1. `Amplify`
   - Rewrite `/api/<*>` đã đúng chưa
   - `VITE_API_BASE_URL` đã là `/api` chưa
2. `ALB`
   - DNS name đã copy đúng chưa
   - Listener `HTTP 80` đã bật chưa
   - Target group có healthy target chưa
3. `Elastic Beanstalk`
   - App có nghe đúng port chưa
   - Environment variables đã set đủ chưa
   - Backend có crash khi boot không
4. `RDS`
   - Security group có cho backend vào `3306` chưa
   - `DATABASE_URL` có đúng user, password, database, endpoint không
5. `CORS`
   - `FRONTEND_ORIGIN` hoặc `FRONTEND_ORIGINS` đã chứa URL Amplify chưa
6. `Logs`
   - Xem `CloudWatch Logs` để lấy stack trace và request id

### Lỗi hay gặp

- `502 Bad Gateway`
  - Thường do backend chưa chạy, sai port, hoặc target group unhealthy
- `CORS error`
  - Thường do quên set `FRONTEND_ORIGIN` hoặc dùng sai URL Amplify
- `Cannot connect to database`
  - Thường do `DATABASE_URL` sai hoặc RDS security group chưa mở từ backend
- `404 on /api/...`
  - Thường do rewrite rule trên Amplify chưa đúng
- `Upload không được`
  - Thường do thiếu quyền S3 hoặc đường dẫn static host chưa đúng

## Nhật ký deploy

Nên ghi lại các thông tin sau sau mỗi lần deploy:

- `ALB DNS name`
- `Amplify app URL`
- `RDS endpoint`
- `Frontend origin`
- `Backend env vars`
- `Migration version`
- trạng thái `CloudWatch`
- các lỗi đã gặp

## Khi nào nên nâng cấp

Nên thêm custom domain, `Route 53` và `AWS Certificate Manager` khi:

- muốn HTTPS chuẩn trên hostname riêng
- muốn production ổn định hơn
- muốn tách `app.domain` và `api.domain`

Nên thêm `Amazon ElastiCache for Redis`, `Multi-AZ`, và các thành phần nâng cấp khác khi:

- traffic tăng
- cần reliability cao hơn
- cần scale ngang hoặc shared state

## Kết luận

Đây là đường triển khai rẻ nhất nhưng vẫn đúng logic hệ thống hiện tại:

`Amplify` cho FE -> `Internet Gateway` -> `ALB` -> `Elastic Beanstalk` -> `RDS / S3 / SES / Parameter Store / Secrets Manager / CloudWatch`

Đây là luồng đúng để dùng khi triển khai và khi vẽ diagram.
