# Backend AWS Phase 2 Layout Blueprint

Tai lieu nay chot bo cuc de ve lai so do `Phase 2 improved` theo kieu:

- day du topology
- de nhin
- co `Public Subnet A/B`, `Private App Subnet A/B`, `Private DB Subnet A/B`
- co `step number`
- main flow va supporting flow tach ro

## 1. Muc Tieu Thi Giac

So do phai tra loi duoc ngay 4 cau hoi:

1. traffic vao he thong theo duong nao
2. app chay o dau
3. database va redis nam o dau
4. cac dich vu phu tro nao duoc app su dung

## 2. Khung Lon

Chi dung 3 lop khung chinh:

1. `AWS Cloud`
2. `Region`
3. `VPC`

Khong them lane text rong tren dau de tranh roi.

## 3. Grid Chinh Trong VPC

Trong `VPC`, bo cuc thanh `2 cot x 3 hang`.

### Cot

- cot trai: `Availability Zone A`
- cot phai: `Availability Zone B`

### Hang

- hang 1: `Public Subnet`
- hang 2: `Private App Subnet`
- hang 3: `Private DB Subnet`

## 4. Vi Tri Tung Thanh Phan

### Ngoai VPC

Ben trai:

- `User`
- `Route 53`

Gan ben trai VPC:

- `ACM`

### Trong VPC

#### Hang 1 - Public

- `ALB` dat chinh giua `Public Subnet A` va `Public Subnet B`
- box `ALB` duoc ve de nguoi xem hieu la no span 2 public subnets

#### Hang 2 - Private App

- `EC2 Instance A` trong `Private App Subnet A`
- `EC2 Instance B` trong `Private App Subnet B`
- phia tren hai EC2 co mot label/box nho:
  - `Elastic Beanstalk App Tier`

#### Hang 3 - Private DB

- `RDS MySQL Multi-AZ` dat giua 2 `Private DB Subnet`
- neu can co them `Redis`, dat o ben phai app tier nhung khong duoc de chong vao `EC2 B`

Khuyen nghi:

- `Redis` dat ben phai hang app, ngang muc voi `EC2 A/B`
- `RDS` dat ben duoi, o giua `Private DB Subnet A/B`

## 5. Supporting Services

Phia duoi `VPC`, nhung van trong `AWS Cloud`, dat mot hang rieng ten:

- `Supporting Services`

Thu tu tu trai sang phai:

1. `S3`
2. `SES`
3. `Secrets Manager + Parameter Store`
4. `VPC Endpoints`
5. `CloudWatch / CloudTrail / Flow Logs / ALB Logs`

Khong tach thanh qua nhieu box nho neu text dai.

## 6. Main Flow

Main flow chi gom 4 buoc:

1. `User -> Route 53`
2. `Route 53 -> ALB`
3. `ALB -> Elastic Beanstalk App Tier`
4. `App Tier -> RDS`

Main flow phai di theo huong trai sang phai, goc gap vuong, khong di long vong.

## 7. Supporting Flow

Supporting flow gom:

5. `App Tier -> Redis`
6. `App Tier -> S3`
7. `App Tier -> SES`
8. `App Tier -> Secrets Manager + Parameter Store`
9. `App Tier -> VPC Endpoints`
10. `App Tier -> CloudWatch / CloudTrail / Flow Logs / ALB Logs`

## 8. ACM

- `ACM` khong nam tren request path chinh
- dat canh `ALB`
- noi bang net dut
- co the khong danh so hoac danh nhu mot note phu

## 9. Quy Tac Mui Ten

- mui ten chinh: mau dam, net lien
- mui ten phu: net lien nhung ngan hon
- ket noi `ACM -> ALB`: net dut
- khong de duong cat qua text
- khong de 2 duong chong len nhau neu tranh duoc

## 10. Kich Thuoc Tuong Doi

- `User`, `Route 53`, `ACM`: nho
- `ALB`: trung binh
- `Elastic Beanstalk App Tier`: to nhat trong VPC
- `RDS`, `Redis`: trung binh
- `Supporting Services`: cung mot hang, cung do cao

## 11. Thu Tu Ve Trong Draw.io

1. ve `AWS Cloud`
2. ve `Region`
3. ve `VPC`
4. chia 2 cot `AZ A/B`
5. chia 3 hang `Public / Private App / Private DB`
6. dat `ALB`
7. dat `EC2 A`, `EC2 B`, va label `Elastic Beanstalk App Tier`
8. dat `Redis`
9. dat `RDS`
10. dat hang `Supporting Services`
11. noi `main flow`
12. noi `supporting flow`
13. them `step number`
14. them `ACM` cuoi cung

## 12. Tieu Chi Dat

So do dat yeu cau khi:

- nhin 3 giay thay duoc duong `User -> Route 53 -> ALB -> App -> RDS`
- thay ro he thong co `2 AZ`
- thay ro `public subnet` va `private subnet`
- thay ro app dung them `Redis`, `S3`, `SES`, `Secrets/Config`, `VPC Endpoints`, `Audit/Ops`
