# AWS Production-Lite Deployment Guide

## Phạm Vi

Tài liệu này hướng dẫn deploy hệ thống theo kiến trúc `production-lite` trong:

- `docs/codebase/fullstack-aws-production-lite-architecture.md`

Kiến trúc này khác guide demo cũ ở các điểm chính:

- Có `Route 53`.
- Có custom domain.
- Có `ACM` cho HTTPS.
- Tách frontend và API thành 2 domain riêng.
- Không dùng `AWS Amplify Hosting rewrite /api/<*>`.
- Backend chạy qua `Elastic Beanstalk` load-balanced multi-AZ.
- Database dùng `RDS MySQL Multi-AZ`.

Luồng mục tiêu:

```text
User
 -> Route 53
 -> app.<domain>
 -> AWS Amplify Hosting

Frontend API call
 -> https://api.<domain>/api
 -> Route 53
 -> Application Load Balancer
 -> Elastic Beanstalk backend
 -> RDS MySQL Multi-AZ
```

Ví dụ nếu domain là `example.com`:

```text
app.example.com -> frontend
api.example.com -> backend API
```

Nếu dùng domain thật như `hell.io.vn`:

```text
app.hell.io.vn -> frontend
api.hell.io.vn -> backend API
```

## Chi Phí Cần Biết Trước

Đây không còn là bản rẻ nhất. Kiến trúc production-lite có chi phí cao hơn bản demo single-instance vì có multi-AZ, ALB, NAT Gateway và RDS Multi-AZ.

Các khoản đáng chú ý:

- `Route 53` hosted zone: khoảng `$0.50/month` cho hosted zone đầu tiên.
- `Application Load Balancer`: tính theo ALB-hour và LCU.
- `NAT Gateway`: tính theo giờ chạy và GB xử lý; 2 NAT Gateway sẽ tốn hơn 1 NAT Gateway.
- `RDS Multi-AZ`: thường đắt hơn Single-AZ vì có standby/failover.
- `Elastic Beanstalk`: không tính phí riêng, nhưng tính phí EC2, ALB, EBS, CloudWatch và các tài nguyên mà Beanstalk tạo.

Nguồn tham khảo chính thức:

- Route 53 pricing: https://aws.amazon.com/route53/pricing/
- Elastic Beanstalk pricing: https://aws.amazon.com/elasticbeanstalk/pricing/
- RDS pricing: https://aws.amazon.com/rds/pricing/
- VPC/NAT Gateway pricing: https://aws.amazon.com/vpc/pricing/
- ALB pricing: https://aws.amazon.com/elasticloadbalancing/pricing/

Nếu cần tiết kiệm hơn trong giai đoạn demo, có thể dùng 1 NAT Gateway hoặc RDS Single-AZ, nhưng khi đó không còn đúng với kiến trúc production-lite đã chốt.

## Domain Và DNS

### Domain Chuẩn

Tài liệu dùng placeholder:

```text
<domain>
```

Khi triển khai thật, thay bằng domain thật.

Ví dụ:

```text
<domain> = hell.io.vn
app.<domain> = app.hell.io.vn
api.<domain> = api.hell.io.vn
```

### Yêu Cầu DNS

Domain phải được quản lý bằng `Route 53 Public Hosted Zone`.

Nếu domain mua ngoài AWS:

1. Tạo hosted zone trong Route 53.
2. Copy 4 nameserver của Route 53.
3. Vào nhà cung cấp domain.
4. Đổi nameserver của domain sang 4 nameserver của Route 53.

Sau khi đổi nameserver, DNS có thể mất vài phút đến vài giờ để cập nhật.

## Kiến Trúc Dịch Vụ

### Frontend

- `AWS Amplify Hosting`
- Custom domain:
  - `app.<domain>`
- Environment variable:
  - `VITE_API_BASE_URL=https://api.<domain>/api`

### Backend

- `AWS Elastic Beanstalk`
- Platform: `Node.js`
- Environment type: `Load balanced`
- Minimum instances: `2`
- Instance subnets: private app subnets ở 2 AZ
- Load balancer subnets: public subnets ở 2 AZ
- Public API:
  - `https://api.<domain>/api`

### Database

- `Amazon RDS for MySQL`
- Multi-AZ enabled
- Private DB subnets ở 2 AZ
- Public access disabled
- Encryption enabled
- Automated backups enabled

### Supporting Services

- `Amazon S3` private bucket cho file upload/assets
- `Amazon SES` cho OTP/email
- `AWS Secrets Manager` cho secrets
- `AWS Systems Manager Parameter Store` cho config không nhạy cảm
- `Amazon CloudWatch Logs`
- `Amazon CloudWatch Alarms`
- `AWS CloudTrail`
- `AWS Systems Manager Session Manager`
- `AWS Backup`

## Yêu Cầu Trước Khi Deploy

### Repository

Cần có:

- Repo frontend hoặc thư mục `frontend/`
- Repo backend hoặc thư mục `backend/`

Frontend hiện là Vite/React:

```text
frontend/package.json
script build: vite build
output directory: dist
```

Backend hiện là Node.js/Express:

```text
backend/package.json
main: src/app/server.js
script start: node src/app/server.js
Node.js >= 20
Prisma: 6.19.3
```

### AWS Region

Chọn một region cố định cho backend, database và Route 53 records liên quan tới ALB.

Theo kiến trúc hiện tại:

```text
ap-southeast-1
```

Lưu ý:

- Route 53 là global service.
- ACM certificate cho ALB phải nằm cùng region với ALB, ví dụ `ap-southeast-1`.
- Amplify custom domain thường được Amplify quản lý certificate tự động; nếu cần thao tác ACM thủ công cho frontend, làm theo yêu cầu cụ thể trong Amplify console.

### Biến Môi Trường Backend

Backend cần các biến:

```text
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/DB_NAME
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=1h
DEFAULT_USER_PASSWORD=<strong-default-password>
OTP_EXPIRES_SECONDS=60
OTP_MAX_ATTEMPTS=3
RATE_LIMIT_BUCKET_CAPACITY=60
RATE_LIMIT_REFILL_TOKENS_PER_SECOND=1
RATE_LIMIT_TOKENS_PER_REQUEST=1
MAIL_HOST=<smtp-host>
MAIL_PORT=<smtp-port>
MAIL_SECURE=<true-or-false>
MAIL_USER=<smtp-user>
MAIL_PASSWORD=<smtp-password>
MAIL_FROM=<sender-email>
FRONTEND_ORIGIN=https://app.<domain>
```

Nếu cần nhiều frontend origins:

```text
FRONTEND_ORIGINS=https://app.<domain>,https://main.xxxxx.amplifyapp.com
```

### Biến Môi Trường Frontend

Frontend cần:

```text
VITE_API_BASE_URL=https://api.<domain>/api
```

Không dùng:

```text
VITE_API_BASE_URL=/api
```

vì kiến trúc mới không dùng Amplify rewrite nữa.

## Checklist Tổng Quan

Thứ tự deploy đề xuất:

1. Chuẩn bị domain và Route 53 hosted zone.
2. Tạo VPC, subnets, route tables, Internet Gateway, NAT Gateways.
3. Tạo security groups.
4. Tạo S3 private bucket.
5. Tạo Secrets Manager và Parameter Store values.
6. Tạo RDS MySQL Multi-AZ.
7. Tạo hoặc deploy Elastic Beanstalk backend load-balanced multi-AZ.
8. Request ACM certificate cho `api.<domain>`.
9. Gắn HTTPS listener cho ALB.
10. Tạo Route 53 record `api.<domain>` trỏ ALB.
11. Deploy frontend lên Amplify.
12. Thêm custom domain `app.<domain>` cho Amplify.
13. Cấu hình frontend env `VITE_API_BASE_URL`.
14. Chạy Prisma migration.
15. Kiểm tra end-to-end.
16. Bật CloudWatch alarms, CloudTrail, AWS Backup.

## Bước 1: Chuẩn Bị Route 53

### 1.1 Tạo Hosted Zone

Vào AWS Console:

```text
Route 53 -> Hosted zones -> Create hosted zone
```

Nhập:

```text
Domain name: <domain>
Type: Public hosted zone
```

Ví dụ:

```text
Domain name: hell.io.vn
```

Sau khi tạo xong, copy 4 nameserver của Route 53.

### 1.2 Trỏ Nameserver Về Route 53

Vào nơi quản lý domain hiện tại, đổi nameserver sang 4 nameserver Route 53.

Checklist:

- [ ] Hosted zone đã tạo trong Route 53.
- [ ] Domain registrar đã đổi nameserver sang Route 53.
- [ ] Chờ DNS propagate.

### 1.3 Kiểm Tra Nameserver

Từ terminal:

```powershell
Resolve-DnsName <domain> -Type NS
```

Kết quả nên trả về nameserver dạng:

```text
*.awsdns-*.com
*.awsdns-*.net
*.awsdns-*.org
*.awsdns-*.co.uk
```

Ví dụ nếu dùng `hell.io.vn` và Hosted Zone hiện tại của Route 53:

```powershell
Resolve-DnsName hell.io.vn -Type NS
```

Kết quả đúng phải trả về 4 nameserver AWS của Hosted Zone đang dùng:

```text
ns-1633.awsdns-12.co.uk
ns-471.awsdns-58.com
ns-729.awsdns-27.net
ns-1496.awsdns-59.org
```

Nếu lỡ xóa Hosted Zone rồi tạo lại, 4 nameserver sẽ đổi. Khi đó phải cập nhật lại nameserver mới ở nơi mua domain trước khi tạo các record tiếp theo.

### 1.4 Sau Khi Nameserver Đã Trỏ Về Route 53

Khi `Resolve-DnsName <domain> -Type NS` đã trả về đúng 4 nameserver AWS, làm tiếp các phần liên quan domain theo thứ tự:

```text
1. Tạo ACM certificate cho api.<domain>.
2. Validate ACM bằng DNS record trong Route 53.
3. Gắn certificate vào HTTPS listener 443 của ALB.
4. Tạo Route 53 record api.<domain> trỏ tới ALB.
5. Gắn app.<domain> vào Amplify Custom Domain.
```

## Bước 2: Chuẩn Bị VPC Và Network

### 2.1 Mục Tiêu

Tạo VPC production-lite với 2 AZ, mỗi AZ có:

```text
1 public subnet
1 private app subnet
1 private DB subnet
```

Tổng cộng:

```text
2 public subnets
2 private app subnets
2 private DB subnets
```

### 2.2 Thành Phần

- `VPC`
- `Internet Gateway`
- `2 public subnets`
- `2 private app subnets`
- `2 private DB subnets`
- `2 NAT Gateways`
- route tables

### 2.3 Route Tables

Public route table:

```text
0.0.0.0/0 -> Internet Gateway
```

Private app route table AZ-1:

```text
0.0.0.0/0 -> NAT Gateway AZ-1
```

Private app route table AZ-2:

```text
0.0.0.0/0 -> NAT Gateway AZ-2
```

Private DB subnets:

```text
Không cần default route ra Internet
```

Checklist:

- [ ] ALB dùng public subnets.
- [ ] EC2/Elastic Beanstalk instances dùng private app subnets.
- [ ] RDS dùng private DB subnets.
- [ ] NAT Gateway nằm trong public subnet.

## Bước 3: Tạo Security Groups

### 3.1 ALB Security Group

Tên gợi ý:

```text
eam-alb-sg
```

Inbound:

```text
HTTPS 443 from 0.0.0.0/0
HTTP 80 from 0.0.0.0/0, optional nếu muốn redirect HTTP -> HTTPS
```

Outbound:

```text
App port to App Security Group
```

### 3.2 App Security Group

Tên gợi ý:

```text
eam-app-sg
```

Inbound:

```text
App port only from ALB Security Group
```

Với Elastic Beanstalk Node.js, thường ALB forward vào instance qua HTTP. Tùy cấu hình platform, app port có thể là:

```text
80
8080
```

Backend app nên đọc:

```text
PORT=8080
```

Outbound:

```text
MySQL 3306 to RDS Security Group
HTTPS 443 to AWS services/external services through NAT Gateway
```

### 3.3 RDS Security Group

Tên gợi ý:

```text
eam-rds-sg
```

Inbound:

```text
MySQL 3306 from App Security Group only
```

Không mở:

```text
3306 from 0.0.0.0/0
```

## Bước 4: Tạo S3 Private Bucket

Vào:

```text
S3 -> Create bucket
```

Tên gợi ý:

```text
eam-prod-uploads-<account-id>
```

Cấu hình:

- Block Public Access: enabled
- Object Ownership: Bucket owner enforced
- Encryption: SSE-S3 hoặc SSE-KMS
- Versioning: enabled nếu file quan trọng
- Lifecycle rule: chuyển/xóa object cũ nếu cần giảm chi phí

Checklist:

- [ ] Bucket không public.
- [ ] Encryption bật.
- [ ] Backend sẽ truy cập bằng IAM role, không dùng access key hardcoded.

## Bước 5: Tạo Secrets Và Config

### 5.1 Secrets Manager

Lưu secrets:

```text
/eam/prod/database-url
/eam/prod/jwt-secret
/eam/prod/mail-password
```

Nếu chưa tích hợp code đọc Secrets Manager trực tiếp, có thể set các giá trị này vào Elastic Beanstalk environment variables trước. Tuy nhiên về kiến trúc, IAM role của backend nên có quyền đọc secrets từ Secrets Manager.

### 5.2 Parameter Store

Lưu config không nhạy cảm:

```text
/eam/prod/frontend-origin = https://app.<domain>
/eam/prod/api-base-url = https://api.<domain>/api
```

## Bước 6: Tạo RDS MySQL Multi-AZ

### 6.1 Mục Tiêu

Tạo MySQL database private, có standby ở AZ khác để failover.

### 6.2 Tạo DB Subnet Group

Vào:

```text
RDS -> Subnet groups -> Create DB subnet group
```

Chọn:

```text
Private DB Subnet AZ-1
Private DB Subnet AZ-2
```

### 6.3 Tạo Database

Vào:

```text
RDS -> Databases -> Create database
```

Chọn:

```text
Engine: MySQL
Template: Production hoặc Dev/Test nhưng bật Multi-AZ
Deployment: Multi-AZ DB instance
Public access: No
DB subnet group: DB subnet group vừa tạo
Security group: eam-rds-sg
Encryption: Enabled
Automated backups: Enabled
Initial database name: enterprise_asset_management
```

Sau khi DB `Available`, ghi lại:

```text
RDS endpoint
Port
Database name
Username
Password
```

Tạo `DATABASE_URL`:

```text
mysql://USER:PASSWORD@RDS_ENDPOINT:3306/enterprise_asset_management
```

## Bước 7: Deploy Backend Bằng Elastic Beanstalk

### 7.1 Tạo Application

Vào:

```text
Elastic Beanstalk -> Create application
```

Chọn:

```text
Platform: Node.js
Environment type: Load balanced
```

Tên gợi ý:

```text
Application: eam-backend
Environment: eam-backend-prod
```

### 7.2 Network

Chọn VPC production-lite.

Load balancer subnets:

```text
Public Subnet AZ-1
Public Subnet AZ-2
```

Instance subnets:

```text
Private App Subnet AZ-1
Private App Subnet AZ-2
```

Capacity:

```text
Min instances: 2
Max instances: 4
```

Security groups:

```text
ALB: eam-alb-sg
Instances: eam-app-sg
```

### 7.3 Environment Variables

Set trong Elastic Beanstalk:

```text
NODE_ENV=production
PORT=8080
DATABASE_URL=mysql://USER:PASSWORD@RDS_ENDPOINT:3306/enterprise_asset_management
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=1h
DEFAULT_USER_PASSWORD=<strong-default-password>
OTP_EXPIRES_SECONDS=60
OTP_MAX_ATTEMPTS=3
RATE_LIMIT_BUCKET_CAPACITY=60
RATE_LIMIT_REFILL_TOKENS_PER_SECOND=1
RATE_LIMIT_TOKENS_PER_REQUEST=1
MAIL_HOST=<smtp-host>
MAIL_PORT=<smtp-port>
MAIL_SECURE=<true-or-false>
MAIL_USER=<smtp-user>
MAIL_PASSWORD=<smtp-password>
MAIL_FROM=<sender-email>
FRONTEND_ORIGIN=https://app.<domain>
```

Ví dụ:

```text
FRONTEND_ORIGIN=https://app.hell.io.vn
```

### 7.4 IAM Role / Instance Profile

Instance role của Elastic Beanstalk cần quyền tối thiểu:

- ghi CloudWatch Logs
- đọc Secrets Manager nếu backend đọc secrets runtime
- đọc Parameter Store nếu backend đọc config runtime
- truy cập đúng S3 upload bucket
- gửi email qua SES nếu dùng SES API

Nếu backend hiện dùng SMTP qua `MAIL_*`, SES permission không bắt buộc cho SMTP, nhưng credential SMTP vẫn phải được bảo vệ.

### 7.5 Đóng Gói Backend

Tại thư mục `backend/`, file zip phải có `package.json` ở root của zip.

Nên có:

```text
package.json
package-lock.json
src/
prisma/
public/ nếu backend dùng
```

Không đưa vào:

```text
node_modules/
.env
secret files
```

Kiểm tra trước khi zip:

```powershell
cd backend
npm ci
npm test -- --runInBand
npx prisma validate
```

Nếu test quá lâu hoặc chưa muốn chạy full test, tối thiểu chạy:

```powershell
npm ci
npx prisma validate
```

### 7.6 Upload Và Deploy

Trong Elastic Beanstalk environment:

```text
Upload and deploy -> chọn backend zip -> Deploy
```

Sau khi deploy:

- environment health phải xanh
- instances phải healthy trong target group
- backend không crash khi boot

## Bước 8: Tạo ACM Certificate Cho API

ACM certificate cho ALB phải tạo ở cùng region với ALB.

Ví dụ:

```text
Region: ap-southeast-1
Domain: api.<domain>
```

Nếu domain thật là `hell.io.vn`, certificate API cần tạo là:

```text
api.hell.io.vn
```

Vào:

```text
AWS Certificate Manager -> Request certificate -> Public certificate
```

Nhập:

```text
api.<domain>
```

Validation:

```text
DNS validation
```

Nếu Route 53 đang quản lý domain, bấm tạo DNS validation record trong Route 53 hoặc copy CNAME validation record sang hosted zone.

Luồng thao tác chi tiết:

```text
1. AWS Certificate Manager -> Request certificate.
2. Chọn Public certificate.
3. Nhập api.<domain>, ví dụ api.hell.io.vn.
4. Chọn DNS validation.
5. Request.
6. Mở certificate vừa tạo.
7. Ở phần Domains, chọn Create records in Route 53 nếu AWS hiện nút này.
8. Chờ status chuyển từ Pending validation sang Issued.
```

Không tạo ACM certificate cho `hell.io.vn` nếu API dùng subdomain `api.hell.io.vn`. Certificate phải khớp đúng domain được gắn vào ALB.

Chờ certificate chuyển sang:

```text
Issued
```

## Bước 9: Gắn HTTPS Listener Cho ALB

Vào:

```text
EC2 -> Load Balancers -> chọn ALB của Elastic Beanstalk -> Listeners
```

Thêm listener:

```text
Protocol: HTTPS
Port: 443
Certificate: api.<domain> certificate
Default action: forward to backend target group
```

Nếu có listener HTTP 80:

```text
HTTP 80 -> redirect to HTTPS 443
```

Checklist:

- [ ] ALB SG mở inbound 443 từ Internet.
- [ ] HTTPS listener dùng certificate đúng domain.
- [ ] Target group healthy.

## Bước 10: Tạo Route 53 Record Cho API

Vào:

```text
Route 53 -> Hosted zones -> <domain> -> Create record
```

Tạo:

```text
Record name: api
Record type: A
Alias: Yes
Route traffic to: Application Load Balancer
Region: ap-southeast-1
Load balancer: ALB của backend
```

Kết quả:

```text
api.<domain> -> ALB
```

Kiểm tra:

```powershell
Resolve-DnsName api.<domain>
```

Sau đó test:

```text
https://api.<domain>/api/health
```

## Bước 11: Chạy Prisma Migration

Chạy migration sau khi backend hoặc môi trường deploy có thể kết nối RDS.

Tùy cách vận hành, chạy từ:

- máy local có network access tới DB qua bastion/SSM/tunnel
- Elastic Beanstalk instance qua Session Manager
- pipeline deploy

Lệnh:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

Nếu database trống và cần dữ liệu mẫu:

```bash
npx prisma db seed
```

Không chạy seed lên production thật nếu database đã có dữ liệu.

## Bước 12: Deploy Frontend Bằng Amplify

### 12.1 Tạo App

Vào:

```text
AWS Amplify -> New app -> Host web app
```

Kết nối repository frontend.

Nếu repo là monorepo, chọn app root:

```text
frontend/
```

Build command:

```bash
npm ci && npm run build
```

Output directory:

```text
dist
```

Environment variables:

```text
VITE_API_BASE_URL=https://api.<domain>/api
```

Ví dụ:

```text
VITE_API_BASE_URL=https://api.hell.io.vn/api
```

### 12.2 Không Cấu Hình Rewrite API

Không tạo rule:

```text
/api/<*> -> ALB
```

Kiến trúc mới không dùng Amplify rewrite.

Nếu frontend là SPA, chỉ giữ SPA fallback:

```text
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>
Target: /index.html
Type: 200
```

Hoặc dùng rule fallback mặc định Amplify tạo cho SPA.

## Bước 13: Gắn Custom Domain Cho Amplify

Vào:

```text
Amplify -> app frontend -> Hosting -> Custom domains -> Add domain
```

Chọn:

```text
<domain>
```

Thêm subdomain:

```text
app
```

Trỏ tới branch frontend, ví dụ:

```text
main
```

Nếu domain đang quản lý bằng Route 53, Amplify có thể tự tạo DNS records cần thiết trong hosted zone.

Amplify sẽ xử lý HTTPS certificate cho custom domain. Kiểm tra trạng thái:

```text
Available / SSL configured
```

Kết quả:

```text
https://app.<domain>
```

## Bước 14: Cập Nhật Backend CORS

Elastic Beanstalk backend phải cho phép frontend origin mới:

```text
FRONTEND_ORIGIN=https://app.<domain>
```

Ví dụ:

```text
FRONTEND_ORIGIN=https://app.hell.io.vn
```

Sau khi sửa env:

```text
Elastic Beanstalk -> Apply changes / Redeploy
```

Nếu cần giữ Amplify preview domain:

```text
FRONTEND_ORIGINS=https://app.<domain>,https://main.xxxxx.amplifyapp.com
```

## Bước 15: Kiểm Tra End-to-End

### 15.1 DNS

Kiểm tra:

```powershell
Resolve-DnsName app.<domain>
Resolve-DnsName api.<domain>
```

### 15.2 API Health

Mở:

```text
https://api.<domain>/api/health
```

Kỳ vọng:

```text
HTTP 200
```

### 15.3 Frontend

Mở:

```text
https://app.<domain>
```

Mở browser DevTools -> Network.

Kiểm tra API request phải gọi:

```text
https://api.<domain>/api/...
```

Không được gọi:

```text
https://app.<domain>/api/...
```

### 15.4 Auth Và CRUD

Kiểm tra:

- đăng nhập
- đăng ký nếu feature bật
- quên mật khẩu/OTP
- một CRUD chính
- upload file nếu feature bật

## Bước 16: Monitoring, Audit, Backup

### 16.1 CloudWatch Logs

Kiểm tra backend logs:

```text
CloudWatch -> Log groups
```

Nên có log group của Elastic Beanstalk/backend.

### 16.2 CloudWatch Alarms

Tạo alarms tối thiểu:

- ALB 5xx
- ALB unhealthy targets
- EC2 CPU high
- RDS CPU high
- RDS free storage low
- RDS connections high

### 16.3 CloudTrail

Bật CloudTrail ở account-level nếu chưa có.

Mục tiêu:

```text
Audit AWS API activity
```

### 16.4 Session Manager

Ưu tiên dùng Session Manager để vào EC2 thay vì mở SSH public.

Checklist:

- [ ] EC2 instance profile có SSM permission.
- [ ] SSM Agent hoạt động.
- [ ] Không mở SSH `22` ra Internet.

### 16.5 AWS Backup

Tạo backup plan cho:

- RDS
- EBS/EC2 nếu có state cần backup

Tối thiểu:

```text
Daily backup
Retention: 7-30 ngày tùy môi trường
```

## Post-Deploy Verification Checklist

- [ ] `app.<domain>` mở được.
- [ ] `api.<domain>/api/health` trả `200`.
- [ ] Frontend gọi API qua `https://api.<domain>/api`.
- [ ] Không còn Amplify rewrite `/api`.
- [ ] ALB target group healthy.
- [ ] Elastic Beanstalk environment healthy.
- [ ] RDS không public.
- [ ] RDS SG chỉ cho App SG vào `3306`.
- [ ] ALB SG chỉ mở `443`, `80` nếu redirect.
- [ ] S3 bucket không public.
- [ ] CloudWatch có backend logs.
- [ ] CloudWatch alarms đã tạo.
- [ ] CloudTrail bật.
- [ ] AWS Backup plan đã tạo.
- [ ] CORS không lỗi trên browser.

## Troubleshooting

### `api.<domain>` không resolve

Kiểm tra:

- Route 53 hosted zone có record `api`.
- Domain registrar đã trỏ nameserver sang Route 53.
- DNS chưa propagate xong.

Lệnh:

```powershell
Resolve-DnsName <domain> -Type NS
Resolve-DnsName api.<domain>
```

### HTTPS API lỗi certificate

Kiểm tra:

- ACM certificate ở đúng region với ALB.
- Certificate status là `Issued`.
- ALB HTTPS listener đang dùng đúng certificate.
- `api.<domain>` trỏ đúng ALB.

### Frontend bị CORS

Kiểm tra backend env:

```text
FRONTEND_ORIGIN=https://app.<domain>
```

Hoặc:

```text
FRONTEND_ORIGINS=https://app.<domain>,...
```

### `502 Bad Gateway`

Kiểm tra:

- Elastic Beanstalk instance có chạy không.
- App có nghe đúng `PORT=8080` không.
- Target group có healthy target không.
- App SG có cho traffic từ ALB SG không.

### Backend không kết nối được RDS

Kiểm tra:

- `DATABASE_URL` đúng endpoint RDS.
- RDS SG cho App SG vào `3306`.
- RDS nằm trong private DB subnet.
- Backend nằm trong private app subnet cùng VPC.

### Migration lỗi

Kiểm tra:

- `DATABASE_URL`.
- Prisma schema.
- RDS user có quyền tạo/sửa schema.
- Network path từ nơi chạy migration tới RDS.

## Nhật Ký Deploy Nên Ghi Lại

Sau mỗi lần deploy, ghi:

- domain chính
- `app.<domain>`
- `api.<domain>`
- Route 53 hosted zone id
- ALB DNS name
- Amplify app id
- Elastic Beanstalk environment name
- RDS endpoint
- S3 bucket name
- ACM certificate ARN
- backend version
- frontend commit/branch
- migration version
- lỗi đã gặp và cách xử lý

## Kết Luận

Sau khi hoàn tất, hệ thống sẽ chạy theo luồng:

```text
User -> Route 53 -> app.<domain> -> Amplify Hosting
Frontend -> https://api.<domain>/api -> Route 53 -> ALB -> Elastic Beanstalk -> RDS Multi-AZ
```

Đây là bản deployment production-lite, giải quyết các điểm yếu của bản demo cũ:

- không dùng Amplify rewrite
- có custom domain
- có HTTPS bằng ACM
- có backend multi-AZ
- có RDS Multi-AZ
- có private subnets
- có IAM/Security Groups
- có logging, audit và backup
