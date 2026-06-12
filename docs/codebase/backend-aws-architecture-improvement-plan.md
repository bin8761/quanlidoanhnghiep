# Backend AWS Architecture Improvement Plan

Nguon dau vao:

- `docs/codebase/backend-codebase-analysis.md`
- `docs/codebase/backend-aws-architecture-proposal.md`

Ngay cap nhat: `2026-06-11`

## Muc Tieu

De xuat mot ban nang cap kien truc tu `Phase 1 MVP` len `Phase 2 improved` theo tieu chi:

- giam attack surface
- bo single point of failure quan trong
- ho tro scale ngang hop ly cho backend hien tai
- giu muc van hanh thuc dung
- khong thay doi qua nhieu codebase mot cach khong can thiet

## Tom Tat Ngan

Kien truc hien tai phu hop de len AWS nhanh voi chi phi thap, nhung co 4 diem yeu chinh:

1. `Web/App` dang nam o `public subnet`
2. app runtime la `single instance`
3. `RDS` la `Single-AZ`
4. `SSE in-memory` va rate limit theo process khong hop neu scale ngang

Ban nang cap de xuat giu huong di hien tai tren AWS, nhung harden hon va san sang hon cho production nho-den-vua.

## Kien Truc De Xuat Phase 2 Improved

### 1. Compute

Chon:

- `AWS Elastic Beanstalk`
- `2 EC2 instances`
- dat trong `private application subnets`
- `Application Load Balancer` dat trong `public subnets`
- auto scaling toi thieu `min=2`, `max=4`

Ly do:

- giu continuity voi Phase 1, khong bat buoc containerize lai ngay
- loai bo SPOF o app tier
- giam attack surface vi app khong con nam trong `public subnet`
- van giu duoc operational simplicity cao hon so voi nhay thang sang ECS/Fargate

### 2. Database

Chon:

- `Amazon RDS for MySQL`
- `Multi-AZ`
- instance khoi dau `db.t4g.small` hoac `db.t4g.medium` tuy tai
- `gp3`
- bat encryption

Ly do:

- backend da dung Prisma + MySQL
- Multi-AZ tang kha nang phuc hoi va uptime
- giai quyet diem yeu `Single-AZ` cua Phase 1

### 3. Realtime / Shared State

Chon:

- `Amazon ElastiCache for Redis`

Dung cho:

- `Redis pub/sub` cho notification SSE
- `Redis-backed rate limiting`

Ly do:

- SSE in-memory hien tai chi hop voi 1 instance
- khi scale ngang, can co shared state de event fan-out den dung app instance
- cung giai quyet van de rate limit theo process

### 4. Object Storage

Chon:

- `Amazon S3` private bucket
- uu tien upload qua `pre-signed URL` neu file upload tang

Ly do:

- thay the luu tru local
- khong mat file khi scale hoac redeploy
- giam bot luong I/O qua app neu sau nay upload lon hon

### 5. Secrets Va Config

Chon:

- `AWS Secrets Manager` cho secrets that su
- `AWS Systems Manager Parameter Store` cho config khong nhay cam

Ly do:

- Phase 1 dung Parameter Store cho tat ca la on cho MVP
- Phase 2 nen tach:
  - secret nhay cam nhu `DATABASE_URL`, `JWT secret`, `MAIL credentials`
  - config thuong nhu `AWS_REGION`, feature flags, upload mode

### 6. Observability Va Audit

Chon:

- `CloudWatch Logs`
- `CloudWatch Alarms`
- `CloudTrail`
- `VPC Flow Logs`
- `ALB access logs` vao S3

Ly do:

- CloudWatch mot minh chua du cho audit va network visibility
- CloudTrail + Flow Logs giup review security va troubleshooting production

### 7. Security Edge

Chon:

- `AWS WAF` tren `ALB` neu he thong la public-facing

Ly do:

- hop cho production-facing HTTP app
- bo sung control cho common web attack patterns

Neu day la he thong chi noi bo doanh nghiep va traffic qua VPN/restricted office network, co the de WAF sang giai doan sau.

### 8. Truy Cap Quan Tri

Chon:

- `AWS Systems Manager Session Manager`
- khong mo `SSH` public

Ly do:

- giam be mat tan cong
- phu hop security posture tot hon cho production

## So Do Logic Muc Tieu Phase 2

```text
Internet
  |
Route 53
  |
ALB + ACM + optional WAF
  |
Elastic Beanstalk environment
  |- 2 EC2 app instances in private app subnets across 2 AZ
  |
  +--> RDS MySQL Multi-AZ (private DB subnets)
  +--> S3 private bucket
  +--> SES
  +--> Secrets Manager / Parameter Store
  +--> ElastiCache Redis
  +--> CloudWatch Logs

CloudTrail / VPC Flow Logs / ALB Access Logs for audit and observability
```

## Thay Doi So Với Phase 1

### 1. Network Placement

Phase 1:

- ALB public
- app cung public
- DB private

Phase 2:

- ALB public
- app private
- DB private

Tac dong:

- can outbound path cho app instances
- quyet dinh chot cho Phase 2 la:
  - uu tien `VPC endpoints` de giam chi phi
  - khong dung `NAT Gateway` lam mac dinh

#### Egress Model Chot

Chon:

- `S3 Gateway Endpoint`
- `Interface VPC Endpoints` cho cac service can thiet:
  - `Secrets Manager`
  - `SSM`
  - `CloudWatch Logs`
  - `KMS`

Ghi chu:

- huong nay toi uu chi phi hon `NAT Gateway`
- phu hop khi app khong can outbound internet rong rai
- can tranh phu thuoc vao cac buoc deploy/runtime can truy cap internet cong khai de cai package hay goi service ngoai AWS
- neu quy trinh deploy thuc te van can internet cong khai, khi do moi xem xet bo sung `NAT Gateway` nhu mot exception co kiem soat

### 2. App Availability

Phase 1:

- 1 app instance

Phase 2:

- toi thieu 2 app instances o 2 AZ

Tac dong:

- can giai quyet shared state cho SSE va rate limit

### 3. Database Availability

Phase 1:

- RDS `Single-AZ`

Phase 2:

- RDS `Multi-AZ`

Tac dong:

- tang chi phi
- tang kha nang phuc hoi va on dinh

### 4. Security Posture

Phase 1:

- co TLS, private DB, khong SSH public

Phase 2:

- private app tier
- tách `secret` khoi `config`
- tang audit logging
- bo sung WAF neu can

## Cost Impact So Bo

So voi Phase 1, cac khoan tang chinh den tu:

- them 1 app instance nua
- co the them `NAT Gateway`
- `RDS Multi-AZ`
- `ElastiCache Redis`
- access logs / flow logs / CloudTrail luu tru

Uoc tinh xu huong:

- Phase 1: `~46-60 USD/thang`
- Phase 2 improved:
  - `minimum cost-conscious`: `~95-135 USD/thang`
  - `recommended`: `~120-180 USD/thang`
  - `with NAT Gateway / WAF / logging day du hon`: cao hon dang ke

Giai thich:

- `minimum cost-conscious` gia dinh:
  - khong dung `NAT Gateway`
  - dung `VPC endpoints` cho AWS service chinh
  - WAF co the chua bat
  - logging/audit o muc can thiet
- `recommended` gia dinh:
  - 2 app instances
  - `RDS Multi-AZ`
  - `Redis`
  - audit/logging day du hon
- neu bo sung `NAT Gateway`, chi phi tang len ro rang va can duoc justify bang nhu cau outbound internet that su

Day la danh doi hop ly neu muc tieu la:

- giam rui ro production
- bo SPOF
- scale nhe-den-vua

## Thay Doi Can Co Trong Code

### Bat buoc

1. Chuyen upload sang `S3`
2. tru tuong hoa storage layer
3. dua secrets sang runtime injection tu AWS
4. bo sung config cho Redis

### Nen co

1. tach notification pub/sub adapter
2. tach rate limiter adapter
3. bo sung health checks / readiness checks ro hon
4. xac dinh ro file nao la public, file nao la private

## Muc Tieu Implementation Thuc Dung

### Option A: Incremental Upgrade Tren Elastic Beanstalk

Ap dung khi:

- muon nang cap tu Phase 1 nhanh nhat
- muon giu platform hien tai
- chua muon doi sang container orchestration

Buoc di:

1. dua app vao private subnets
2. them ALB public multi-AZ
3. nang app len 2 instances
4. chuyen upload sang S3
5. bo sung Redis
6. nang RDS len Multi-AZ

### Option B: Future State Sau Nay - ECS Fargate

Ap dung khi:

- muon control container runtime ro hon
- muon tach app va worker sau nay
- muon rollout/scaling hien dai hon

Khong de xuat nhay ngay sang Option B neu muc tieu hien tai la it xao tron.

#### Tieu Chi Chuyen Tu Elastic Beanstalk Sang ECS Fargate

Giu `Elastic Beanstalk` neu:

- backend van la monolith chinh
- chua can worker/service tach rieng
- muon deployment va van hanh don gian
- chua can container control chi tiet

Can xem xet chuyen sang `ECS Fargate` neu:

- can tach `web` va `worker`
- can rollout theo image/container ro rang hon
- can autoscaling chi tiet hon theo workload
- can control runtime, task definition, va deployment strategy sau hon
- can mo rong he thong theo huong nhieu service/doc lap hon

## Kien Truc Chot De Xuat

Neu muc tieu la `cai thien kien truc hien tai ma van giu su thuc dung`, kien truc Phase 2 nen chot la:

- `Elastic Beanstalk` van la compute platform
- `ALB` o `2 public subnets`
- `2 app instances` o `2 private app subnets`
- `RDS MySQL Multi-AZ`
- `S3 private bucket`
- `ElastiCache Redis`
- `Secrets Manager` cho secrets
- `Parameter Store` cho config
- `CloudWatch Logs + Alarms`
- `CloudTrail`
- `VPC Flow Logs`
- `ALB access logs`
- `Session Manager`
- `WAF` neu service public-facing

## Tieu Chi De Quyết Dinh Co Nen Len Phase 2 Khong

Nen len Phase 2 neu mot trong cac dieu sau dung:

- can production on dinh hon
- can scale hon 1 app instance
- can audit/security posture tot hon
- can giam rui ro khi mot instance hoac mot AZ gap su co
- can notification/realtime hoat dong dung khi scale ngang

Chua can len Phase 2 neu:

- day la he thong noi bo nho
- tai rat thap
- chap nhan downtime ngan khi deploy/su co
- chua can multi-instance
