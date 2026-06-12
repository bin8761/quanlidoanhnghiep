# Backend AWS Architecture Proposal

Nguon dau vao:

- `docs/codebase/backend-codebase-analysis.md`
- `backend/docs/aws-deployment-notes.md`

Ngay chot de xuat: `2026-06-10`

## Muc Tieu

Chot mot kien truc AWS phu hop cho backend hien tai theo tieu chi:

- thuc dung
- de van hanh
- chi phi hop ly
- phu hop voi monolith Node.js/Express + Prisma/MySQL

## Kien Truc Chot

### 1. Compute

Chon:

- `AWS Elastic Beanstalk`
- 1 EC2 instance `t4g.small`
- dat sau `Application Load Balancer`

Ly do:

- phu hop voi backend Node.js/Express dang monolith
- de deploy va van hanh hon ECS/Fargate trong giai doan dau
- chi phi hop ly hon phuong an container + NAT Gateway
- giu kha nang nang cap len autoscaling sau nay neu can

### 2. Database

Chon:

- `Amazon RDS for MySQL`
- `Single-AZ`
- instance `db.t4g.micro`
- storage `gp3`, dung luong nho ban dau

Ly do:

- code hien tai da dung Prisma + MySQL
- khong can doi engine database
- RDS giam burden van hanh so voi tu quan ly MySQL tren EC2
- Aurora chua can thiet o giai doan hien tai va se tang chi phi

### 3. Object Storage

Chon:

- `Amazon S3` private bucket

Ly do:

- thay the local uploads hien tai
- tranh mat file khi instance bi thay the, redeploy hoac scale
- don gian, re, ben va phu hop voi upload hinh/tep

### 4. Networking

Chon:

- `1 VPC`
- `2 Availability Zones`
- `public subnets` cho ALB va app EC2
- `private DB subnets` cho RDS
- khong dung NAT Gateway trong giai doan dau

Ly do:

- giu duoc RDS trong private network
- tranh chi phi NAT Gateway cao va complexity khong can thiet
- du don gian de van hanh cho moi truong dau tien

### 5. TLS, Domain, Ingress

Chon:

- `Application Load Balancer`
- `AWS Certificate Manager`
- `Route 53` neu dung custom domain

Ly do:

- ALB phu hop voi HTTP/HTTPS cho Express API
- terminate TLS tai ALB de don gian hoa app
- ACM quan ly certificate don gian va managed

### 6. Secrets Va Config

Chon:

- `AWS Systems Manager Parameter Store`

Chi dung `AWS Secrets Manager` neu sau nay can rotation va governance cao hon.

Ly do:

- re hon Secrets Manager
- du cho env vars va secret giai doan dau
- don gian tich hop voi Elastic Beanstalk/EC2

### 7. Logging Va Monitoring

Chon:

- `Amazon CloudWatch Logs`
- `CloudWatch Alarms`

Ly do:

- du cho log ung dung, log platform va canh bao co ban
- khong can dung stack observability rieng o giai doan dau

### 8. Email

Chon:

- `Amazon SES`

Ly do:

- phu hop hon Gmail SMTP khi dua len AWS that
- chi phi thap
- on dinh hon cho transactional email nhu OTP reset password

### 9. Truy Cap Quan Tri

Chon:

- `AWS Systems Manager Session Manager`
- khong mo SSH public

Ly do:

- giam be mat tan cong
- de audit va van hanh hon SSH truyen thong

## So Do Logic Muc Tieu

```text
Internet
  |
Route 53
  |
ALB + ACM
  |
Elastic Beanstalk (Node.js app on EC2 t4g.small)
  | \
  |  \--> S3 (private uploads)
  |  \--> SES (outbound email)
  |
RDS MySQL (private subnet)
  |
CloudWatch Logs / Alarms
```

## Cost Estimate So Bo

Gia tri duoi day la uoc tinh so bo theo public pricing hien hanh tai thoi diem de xuat, chu yeu lay moc `us-east-1`, 730 gio/thang.

### Uoc tinh tung thanh phan

- EC2 `t4g.small`: khoang `12.26 USD/thang`
- EBS `gp3 20 GB`: khoang `1.60 USD/thang`
- ALB base: khoang `16.43 USD/thang`
- ALB traffic nhe: khoang `1-3 USD/thang`
- RDS MySQL `db.t4g.micro` Single-AZ: khoang `12-15 USD/thang`
- RDS storage + backup nho: khoang `2-4 USD/thang`
- S3 Standard `20 GB`: khoang `0.46 USD/thang`
- S3 requests nhe: thuong duoi `1 USD/thang`
- CloudWatch Logs `1-5 GB/thang`: khoang `0.50-2.50 USD/thang`
- SES `10,000` email/thang: khoang `1 USD/thang`
- Route 53 hosted zone: khoang `0.50 USD/thang`
- Parameter Store Standard: gan nhu `0 USD` cho nhu cau co ban

### Tong so bo

- Phuong an khuyen nghi: khoang `46-60 USD/thang`
- Neu bo ALB o moi truong non-prod: khoang `28-40 USD/thang`
- Neu them NAT Gateway: cong them khoang `32.85 USD/thang` base, chua tinh data processing

## Thay Doi Can Thiet Tu Code Hien Tai

## 1. Local Uploads Phai Chuyen Sang S3

Hien trang:

- app dang serve `backend/uploads` qua static route
- upload dang dua vao filesystem local hoac memory roi xu ly theo local path

Van de:

- khong ben vung tren AWS
- mat file khi redeploy hoac thay instance
- khong phu hop neu sau nay scale ngang

Can doi:

- bo phu thuoc vao `backend/uploads` lam noi luu tru chinh
- them `storage service` dung AWS SDK cho S3
- upload file tu `multer.memoryStorage()` len S3
- luu `object key` hoac URL logic vao DB thay vi path local
- giam hoac bo `express.static("/uploads", ...)` trong production

## 2. SSE In-Memory Hien Tai Chi Dung Duoc Khi Co 1 Instance

Hien trang:

- notification SSE dang luu ket noi client trong `Map` in-memory theo process

Van de:

- neu co nhieu instance, event tao o instance A khong day toi client dang ket noi o instance B

Quyet dinh kien truc:

- phase 1: chap nhan `single app instance`
- phase 2 neu can scale ngang:
  - them `ElastiCache Redis`
  - publish event vao Redis pub/sub
  - moi app instance subscribe va fan-out cho SSE clients local

## 3. In-Memory Rate Limit Can Xem Lai Neu Scale Ngang

Hien trang:

- token bucket rate limiter dang theo process

Van de:

- khong con la global rate limit khi co nhieu instance

Huong xu ly sau nay:

- neu scale ngang, chuyen sang Redis-backed rate limiting

## 4. SMTP Config Nen Chuyen Sang SES

Hien trang:

- code dang dung SMTP env tong quat

Huong xu ly:

- giai doan dau co the dung SMTP endpoint cua SES
- hoac doi sang AWS SDK/SES API sau

## 5. Bo Sung Bien Moi Truong AWS

Can them:

- `AWS_REGION`
- `S3_BUCKET`
- `FILE_STORAGE_DRIVER=s3`
- neu can them:
  - `S3_PUBLIC_BASE_URL` hoac config presigned URL

## Cac Giai Doan Trien Khai Du Kien

### Phase 1: MVP Tren AWS

- Elastic Beanstalk + 1 EC2
- ALB + ACM
- RDS MySQL Single-AZ
- S3 cho uploads
- SES cho email
- CloudWatch Logs
- chua dung Redis
- chap nhan SSE single-instance

### Phase 2: Khi Co So Lieu Van Hanh

Can xem xet:

- auto scaling app
- ElastiCache Redis cho SSE pub/sub va rate limit
- Multi-AZ cho RDS neu can SLA cao hon
- tach worker neu sau nay co background jobs

## Phan Nao La Gia Dinh

De xuat nay dang dua tren cac gia dinh sau:

- ung dung la he thong noi bo doanh nghiep
- traffic thap den vua
- chua co yeu cau HA manh
- chua co nhu cau worker/queue rieng
- file upload khong qua lon
- so ket noi SSE dong thoi khong qua cao

Chua co du lieu de ket luan chac:

- peak traffic that
- peak concurrent SSE connections
- dung luong upload moi thang
- toc do tang truong database
- RPO/RTO mong muon
- yeu cau compliance/security cu the

## Quyết Dinh Chot

Kien truc AWS duoc chot cho backend hien tai la:

- `Elastic Beanstalk` cho compute
- `EC2 t4g.small` cho app runtime
- `Application Load Balancer` + `ACM`
- `RDS MySQL Single-AZ db.t4g.micro`
- `S3 private bucket` cho uploads
- `SSM Parameter Store` cho config/secret co ban
- `CloudWatch Logs + Alarms`
- `SES` cho email
- `Route 53` neu dung custom domain
- `Session Manager` thay cho SSH

Day la phuong an can bang tot nhat hien tai giua:

- de deploy
- de van hanh
- chi phi hop ly
- it thay doi nhat so voi codebase backend dang co

## Nguon Tham Khao Chinh

- AWS Fargate pricing: `https://aws.amazon.com/fargate/pricing/`
- ELB pricing: `https://aws.amazon.com/elasticloadbalancing/pricing/`
- VPC/NAT pricing: `https://aws.amazon.com/vpc/pricing/`
- EC2 On-Demand pricing: `https://aws.amazon.com/ec2/pricing/on-demand/`
- RDS MySQL pricing: `https://aws.amazon.com/rds/mysql/pricing/`
- S3 pricing: `https://aws.amazon.com/s3/pricing/`
- SES pricing: `https://aws.amazon.com/ses/pricing/`
- Secrets Manager pricing: `https://aws.amazon.com/secrets-manager/pricing/`
- CloudWatch pricing: `https://aws.amazon.com/cloudwatch/pricing/`
