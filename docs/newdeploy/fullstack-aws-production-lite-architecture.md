# Kiến Trúc AWS Fullstack Production-Lite

## Mục Tiêu

Tài liệu này mô tả kiến trúc AWS mới cho hệ thống fullstack, dùng để thay thế bản demo cũ còn thiếu nhiều dịch vụ cần thiết và chưa thể hiện rõ các trụ cột quan trọng của AWS Well-Architected.

Mục tiêu:

- Giữ hướng triển khai đơn giản bằng `AWS Amplify Hosting` và `AWS Elastic Beanstalk`.
- Nâng backend và database lên mô hình multi-AZ để cải thiện khả năng sẵn sàng.
- Bổ sung DNS bằng Route 53, HTTPS bằng ACM, IAM, Security Groups, backup, monitoring và encryption để thể hiện rõ các core pillars.
- Tránh làm kiến trúc quá nặng bằng cách chưa bắt buộc dùng các thành phần như `CloudFront` tùy biến, `AWS WAF`, `Amazon ECS`, `Amazon EKS`, `GuardDuty`, `Security Hub` nếu chưa cần.

Phạm vi hiện tại là **production-lite baseline**. Đây chưa phải kiến trúc enterprise đầy đủ, nhưng tốt hơn bản demo single-instance và đủ để xử lý các nhận xét chính về việc thiếu dịch vụ cần thiết, thiếu high availability, thiếu security, thiếu monitoring và thiếu backup rõ ràng.

## Tổng Quan Kiến Trúc

Luồng chính:

```text
User
 -> Route 53
 -> app.example.com
 -> AWS Amplify Hosting
    - ACM certificate for HTTPS

Frontend API call
 -> api.example.com
 -> Route 53
 -> Application Load Balancer trong public subnets trên 2 AZ
 -> Elastic Beanstalk environment trong private app subnets trên 2 AZ
 -> EC2 Auto Scaling Group với tối thiểu 2 instances
 -> RDS MySQL Multi-AZ trong private DB subnets
```

Luồng hỗ trợ:

```text
Backend -> S3 private bucket
Backend -> SES cho OTP/email
Backend -> Secrets Manager
Backend -> Systems Manager Parameter Store
Backend -> CloudWatch Logs/Alarms
CloudTrail -> audit log cho AWS API activity
AWS Backup -> RDS backups và EC2/EBS snapshots nếu cần
```

## Network Layout

Kiến trúc chạy trong một `VPC` tại region `ap-southeast-1` và sử dụng 2 Availability Zone.

### Thành Phần Cấp VPC

- `VPC`
- `Internet Gateway` gắn vào VPC
- Route tables cho public subnets và private subnets
- Security Groups cho ALB, App, RDS và các truy cập hỗ trợ

`Internet Gateway` nằm ở cấp VPC, không nằm trong subnet và không cần tạo mỗi AZ một Internet Gateway.

### Availability Zone 1

- `Public Subnet AZ-1`
  - ALB node
  - NAT Gateway AZ-1
- `Private App Subnet AZ-1`
  - Elastic Beanstalk / EC2 instance AZ-1
- `Private DB Subnet AZ-1`
  - RDS primary hoặc standby node

### Availability Zone 2

- `Public Subnet AZ-2`
  - ALB node
  - NAT Gateway AZ-2
- `Private App Subnet AZ-2`
  - Elastic Beanstalk / EC2 instance AZ-2
- `Private DB Subnet AZ-2`
  - RDS primary hoặc standby node

### Routing

Public subnet route table:

```text
0.0.0.0/0 -> Internet Gateway
```

Private app subnet route table:

```text
Private App Subnet AZ-1: 0.0.0.0/0 -> NAT Gateway AZ-1
Private App Subnet AZ-2: 0.0.0.0/0 -> NAT Gateway AZ-2
```

Private DB subnets không cần route internet mặc định. RDS chỉ nhận traffic từ App Security Group.

## Entry / Edge Layer

### Dịch Vụ

- `Amazon Route 53`
- `AWS Amplify Hosting`
- `AWS Certificate Manager`

### Luồng Truy Cập

```text
User -> Route 53 -> app.example.com -> Amplify Hosting
Frontend -> https://api.example.com/api -> Route 53 -> ALB
```

Ở kiến trúc mới, nhóm dùng `Route 53` để quản lý DNS/custom domain và dùng `ACM` để cấp TLS certificate cho HTTPS. Frontend được phục vụ qua `app.example.com`, còn backend API được public qua `api.example.com` trỏ về `Application Load Balancer`.

Frontend không còn dùng Amplify rewrite. Biến môi trường frontend nên trỏ trực tiếp tới API domain:

```text
VITE_API_BASE_URL=https://api.example.com/api
```

`ACM` không phải là một hop trong request path. Trên diagram, nên vẽ ACM như certificate/config gắn với Amplify custom domain và/hoặc ALB HTTPS listener.

### Thành Phần Có Thể Bổ Sung Khi Lên Production Cao Hơn

- `Amazon CloudFront` tùy biến: chỉ cần khi muốn kiểm soát CDN, cache policy hoặc Origin Access Control nâng cao.
- `AWS WAF`: nên thêm khi public traffic lớn hơn hoặc cần rule bảo vệ web/API rõ ràng.

## Frontend Layer

### Dịch Vụ

- `AWS Amplify Hosting`
- `Amazon S3` do Amplify quản lý hoặc dùng cho static assets nếu cần

### Trách Nhiệm

- Build và host frontend.
- Cung cấp HTTPS qua custom domain với certificate từ ACM.
- Gọi backend trực tiếp qua `https://api.example.com/api`.

## API / Compute Layer

### Dịch Vụ

- `Application Load Balancer`
- `AWS Elastic Beanstalk`
- `Amazon EC2`
- `Auto Scaling Group`

### Thiết Kế Mới

Backend không còn chạy bằng một EC2 instance đơn lẻ. Elastic Beanstalk cần được cấu hình ở chế độ:

- Load balanced environment
- Private app subnets trên 2 AZ
- Auto Scaling Group
- Minimum instances: 2
- Health check qua ALB target group

Luồng API:

```text
Frontend -> ALB -> Elastic Beanstalk EC2 instances -> Backend API
```

### Lý Do Không Đổi Sang ECS Ngay

Kiến trúc này giữ Elastic Beanstalk để tránh thay đổi cách deploy quá lớn. Nếu sau này cần container-first deployment, có thể nâng cấp sang:

```text
ALB -> ECS Fargate Service -> ECR image -> RDS
```

## Data Layer

### Dịch Vụ

- `Amazon RDS for MySQL Multi-AZ`
- DB subnet group trải trên 2 private DB subnets
- Automated backups
- Encryption at rest

### Thiết Kế Mới

RDS chuyển từ `Single-AZ` sang `Multi-AZ deployment`.

```text
Backend App Security Group -> RDS Security Group -> RDS MySQL Multi-AZ
```

Khuyến nghị cấu hình:

- Bật Multi-AZ
- Bật automated backup
- Bật point-in-time recovery nếu cấu hình RDS được chọn hỗ trợ
- Bật encryption at rest
- Gửi RDS logs/metrics vào CloudWatch khi phù hợp

### Thành Phần Có Thể Bổ Sung Khi Cần

- `RDS Proxy`: nên thêm khi backend scale nhiều instance/task hoặc gặp vấn đề connection pool với Node.js/Prisma.
- Read replica: chỉ cần khi workload đọc nhiều.

## File Upload / S3 Layer

### Dịch Vụ

- `Amazon S3` private bucket

### Cấu Hình Bắt Buộc

Bucket file upload phải là private bucket:

- Bật Block Public Access
- Bật encryption at rest, dùng SSE-S3 hoặc SSE-KMS
- Bật versioning nếu file quan trọng
- Có lifecycle policy để giảm chi phí lưu trữ
- Backend truy cập bucket bằng IAM role, không dùng access key hardcoded

Luồng đơn giản:

```text
Backend -> S3 private bucket
```

Luồng tốt hơn khi cần tối ưu upload:

```text
Backend -> generate presigned URL
Frontend -> upload directly to S3 private bucket
```

## Email / Notification Layer

### Dịch Vụ

- `Amazon SES`

### Luồng Hiện Tại

```text
Backend -> SES -> OTP/email notification
```

### Thành Phần Có Thể Bổ Sung Khi Cần

Nếu email cần retry bền vững hoặc không muốn request API bị chậm, thêm:

```text
Backend -> SQS -> Worker/Lambda -> SES
```

Trong bản production-lite hiện tại, `SQS` được để ở mức optional để tránh tăng độ phức tạp.

## Security Layer

### IAM Roles

Backend EC2/Elastic Beanstalk cần dùng IAM role, không dùng static AWS keys.

Quyền tối thiểu:

- Đọc secret cần thiết từ `AWS Secrets Manager`
- Đọc app config từ `Systems Manager Parameter Store`
- Ghi logs vào `CloudWatch Logs`
- Truy cập đúng S3 bucket của ứng dụng, không cấp quyền rộng cho toàn bộ S3
- Gửi email qua `Amazon SES`

### Security Groups

ALB Security Group:

```text
Inbound:
- HTTPS 443 from Internet

Outbound:
- App port to App Security Group
```

App Security Group:

```text
Inbound:
- App port only from ALB Security Group

Outbound:
- MySQL 3306 to RDS Security Group
- HTTPS 443 to AWS services/external services through NAT Gateway if needed
```

RDS Security Group:

```text
Inbound:
- MySQL 3306 only from App Security Group

Outbound:
- default/minimal required traffic
```

### Secrets Và Config

- Database password, JWT secrets, email credentials/config secrets: `AWS Secrets Manager`
- Non-secret app config: `Systems Manager Parameter Store`
- Secret rotation: có thể bổ sung khi lên production cao hơn

### Encryption

- Bật RDS encryption at rest
- Bật S3 encryption
- Secrets Manager được mã hóa bằng AWS managed key hoặc customer managed KMS key
- Public frontend endpoint dùng HTTPS qua ACM certificate.
- Nếu ALB dùng HTTPS listener hoặc API custom domain riêng, dùng ACM để cấp TLS certificate cho ALB/API domain.

`AWS KMS` có thể thể hiện như một encryption note/config. Không bắt buộc phải vẽ thành icon lớn trong main flow, trừ khi diagram có một khu vực riêng cho security/governance.

## Observability / Operations Layer

### Dịch Vụ

- `Amazon CloudWatch Logs`
- `Amazon CloudWatch Alarms`
- `AWS CloudTrail`
- `AWS Systems Manager Session Manager`

### Logs

- Backend application logs -> CloudWatch Logs
- ALB access logs -> S3 hoặc monitoring path phù hợp nếu bật
- RDS metrics/logs -> CloudWatch khi phù hợp

### Alarms

Minimum alarms:

- ALB 5xx errors
- ALB unhealthy targets
- EC2 CPU/memory/disk pressure
- RDS CPU
- RDS free storage space
- RDS connection count
- Application error rate nếu backend expose metric

### Audit Và Admin Access

- `CloudTrail` ghi lại AWS API activity.
- `Session Manager` được ưu tiên để quản trị EC2 mà không cần mở public SSH.

## Backup / Recovery Layer

### Dịch Vụ

- `AWS Backup`
- RDS automated backups/snapshots
- EC2 AMI/EBS snapshots nếu EC2 có state cần backup

### Cấu Hình

- Bật RDS automated backups.
- Định nghĩa backup retention theo từng môi trường.
- Cần document restore test trước khi launch production.

RTO/RPO hiện tại: `UNCONFIRMED`.

## Cost Governance

### Dịch Vụ / Cấu Hình

- Khuyến nghị dùng `AWS Budgets`
- S3 lifecycle policy
- CloudWatch log retention policy
- Right-size EC2 instance type và RDS instance class
- Dùng 2 NAT Gateways để tăng reliability; chỉ dùng 1 NAT Gateway nếu chấp nhận tradeoff về chi phí

Nếu cần tiết kiệm hơn, có thể dùng 1 NAT Gateway, nhưng phải ghi rõ:

```text
Cost-saving tradeoff: one NAT Gateway reduces cost but weakens multi-AZ outbound reliability.
Production recommendation: one NAT Gateway per AZ.
```

## Well-Architected Pillar Coverage

| Pillar | Cách kiến trúc mới xử lý |
| --- | --- |
| Operational Excellence | CloudWatch Logs/Alarms, CloudTrail, Session Manager, health checks, deployment path qua Elastic Beanstalk |
| Security | Route 53 + ACM HTTPS, private app/DB subnets, IAM roles, Security Groups, Secrets Manager, Parameter Store, S3 private bucket, encryption |
| Reliability | ALB multi-AZ, app instances trên 2 AZ, RDS Multi-AZ, NAT Gateway per AZ, AWS Backup, health checks |
| Performance Efficiency | ALB, Auto Scaling Group, Amplify managed hosting, S3 cho file storage, optional RDS Proxy/SQS khi workload tăng |
| Cost Optimization | Production-lite service set, S3 lifecycle, log retention, right-sizing, AWS Budgets recommended |
| Sustainability | Auto scaling/right-sizing, managed hosting, storage lifecycle, tránh bật các dịch vụ luôn chạy khi chưa cần |

## Dịch Vụ Cần Vẽ Trên Diagram Mới

Main diagram nên có:

- User
- Route 53
- Amplify Hosting
- ACM note/certificate gần Amplify/ALB
- VPC
- Internet Gateway
- 2 Availability Zones
- 2 public subnets
- ALB across 2 public subnets
- 2 NAT Gateways, mỗi public subnet một NAT Gateway
- 2 private app subnets
- Elastic Beanstalk / EC2 instances across 2 private app subnets
- 2 private DB subnets
- RDS MySQL Multi-AZ
- S3 private bucket
- SES
- Secrets Manager
- Parameter Store
- CloudWatch Logs/Alarms
- CloudTrail
- Session Manager
- AWS Backup
- IAM Role note trên backend
- Security Group notes cho ALB/App/RDS

Không bắt buộc vẽ lớn:

- KMS, nếu đã ghi encryption notes
- AWS Budgets, nếu chỉ cần ghi trong cost governance
- CloudFront/WAF/SQS/RDS Proxy, nếu để optional/deferred

## Deployment Model

Kiến trúc mới vẫn giữ cách deploy qua `AWS Elastic Beanstalk`, nhưng thay đổi từ single-instance sang load-balanced multi-AZ.

Deployment target:

```text
Elastic Beanstalk environment type: Load balanced
Min instances: 2
Subnets: Private App Subnet AZ-1, Private App Subnet AZ-2
Load balancer subnets: Public Subnet AZ-1, Public Subnet AZ-2
Database: RDS Multi-AZ in DB subnet group
```

Đây là thay đổi về cấu hình architecture/deployment, không phải thay đổi toàn bộ platform.

## Kết Luận

Kiến trúc mới nên được mô tả ngắn gọn như sau:

```text
User
 -> Route 53
 -> app.example.com
 -> Amplify Hosting with ACM HTTPS

Frontend API call
 -> https://api.example.com/api
 -> Route 53
 -> ALB across 2 public subnets / 2 AZ
 -> Elastic Beanstalk backend across 2 private app subnets / 2 AZ
 -> RDS MySQL Multi-AZ across private DB subnets
```

Thành phần hỗ trợ:

```text
Backend -> S3 private encrypted bucket
Backend -> SES
Backend -> Secrets Manager / Parameter Store
Backend -> CloudWatch Logs/Alarms
CloudTrail + Session Manager for audit/admin
AWS Backup for recovery
IAM Roles + Security Groups for access control
```

Với cách này, kiến trúc dùng `Route 53`, `ACM`, `Multi-AZ`, `RDS Multi-AZ`, `NAT Gateway`, IAM roles, Security Groups, monitoring, backup và encryption để thể hiện đủ các trụ cột cốt lõi: security, reliability, operations, cost và performance ở mức production-lite.
