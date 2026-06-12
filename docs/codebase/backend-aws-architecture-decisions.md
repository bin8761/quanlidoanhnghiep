# Backend AWS Architecture Decisions

Ngay chot: `2026-06-11`

Tai lieu nay ghi lai cac quyet dinh kien truc da duoc chot cho huong nang cap AWS cua backend hien tai.

## Pham Vi

Ap dung cho:

- backend monolith `Node.js/Express + Prisma + MySQL`
- lo trinh nang cap tu `Phase 1 MVP` len `Phase 2 improved`
- muc tieu toi uu giua security, availability, va chi phi

## Decision 1: Egress Cho App Private Subnets

### Quyet Dinh

Khong dung `NAT Gateway` lam mac dinh cho `Phase 2`.

Huong duoc chot:

- dung `S3 Gateway Endpoint`
- dung `Interface VPC Endpoints` cho:
  - `Secrets Manager`
  - `SSM`
  - `CloudWatch Logs`
  - `KMS`

### Ly Do

- `NAT Gateway` lam tang chi phi hang thang kha nhieu
- backend hien tai chu yeu can truy cap mot so AWS services cu the, khong can outbound internet rong rai lam mac dinh
- `VPC endpoints` hop voi muc tieu toi uu chi phi nhung van giu app trong `private subnets`

### He Qua

Tich cuc:

- giam chi phi so voi dung `NAT Gateway`
- giu duoc model `ALB public -> app private -> DB private`
- giam attack surface cua app tier

Trade-off:

- can quy hoach ro app can truy cap AWS service nao
- neu deployment/runtime can internet cong khai, phai xu ly bo sung
- operational complexity cao hon mot chut so voi dung `NAT Gateway` duy nhat

### Dieu Kien Mo Rong

Chi can bo sung `NAT Gateway` khi:

- quy trinh deploy can outbound internet cong khai that su
- app can goi thuong xuyen toi external services khong di qua private connectivity khac
- VPC endpoint khong bao phu du nhu cau runtime

## Decision 2: Muc Tieu Chi Phi Hang Thang

### Quyet Dinh

Kien truc `Phase 2 improved` se duoc danh gia theo huong `cost-conscious`, khong theo huong full production enterprise ngay lap tuc.

Moc chi phi duoc chot de ra quyet dinh:

- `minimum cost-conscious`: `~95-135 USD/thang`
- `recommended`: `~120-180 USD/thang`
- `with NAT Gateway / WAF / logging day du hon`: cao hon dang ke

### Ly Do

- can giu chi phi hop ly khi nang cap tu MVP
- khong muon them thanh phan dat tien neu chua co nhu cau van hanh ro rang
- can phan biet giua muc toi thieu co the chap nhan va muc khuyen nghi nen dung

### He Qua

Tich cuc:

- de danh gia trade-off giua availability/security va budget
- tranh truong hop “bat het moi thu” roi doi chi phi tang dot bien

Trade-off:

- ban `minimum cost-conscious` se it du phong hon `recommended`
- mot so control nhu `WAF`, logging day du, hay egress qua `NAT Gateway` co the bi de lui sang giai doan sau

### Cach Su Dung

Neu:

- he thong noi bo, tai nhe, production nho: bat dau tu `minimum cost-conscious`
- can production on dinh hon, co multi-instance va audit ro hon: dung `recommended`

## Decision 3: Giữ Elastic Beanstalk Hay Chuyen Sang ECS Fargate

### Quyet Dinh

Trong `Phase 2 improved`, tiep tuc giu `Elastic Beanstalk`.

Khong chuyen sang `ECS Fargate` o giai doan hien tai.

### Ly Do

- backend hien tai van la mot monolith
- muc tieu la nang cap tu tu, it xao tron
- `Elastic Beanstalk` giu operational overhead thap hon cho giai doan nay
- chua can container control sau hoac service decomposition ngay

### He Qua

Tich cuc:

- de giu continuity tu `Phase 1`
- giam effort migration nen tang
- phu hop voi muc tieu “production nho-den-vua, thuc dung”

Trade-off:

- flexibility va control kem hon `ECS Fargate`
- khong dep bang container-native path neu sau nay tach nhieu service

### Dieu Kien Can Xem Xet Chuyen Sang ECS Fargate

Can bat dau plan migration sang `ECS Fargate` khi mot trong cac dieu sau xay ra:

- can tach `web` va `worker`
- can deployment theo image/container ro rang hon
- can autoscaling chi tiet hon theo workload
- can rollout strategy sau hon
- can mo rong he thong theo huong nhieu service/doc lap hon

## Ket Luan Chot

Ba quyet dinh duoc chot cho huong nang cap AWS hien tai la:

1. `App private subnets` se uu tien `VPC endpoints`, khong mac dinh dung `NAT Gateway`
2. Kien truc `Phase 2 improved` se duoc thiet ke theo `cost-conscious profile`
3. Tiep tuc giu `Elastic Beanstalk` cho `Phase 2`, chua chuyen sang `ECS Fargate`

Tai lieu nay la co so de:

- cap nhat proposal kien truc
- ve lai so do `Phase 2`
- lap ke hoach implementation va IaC
