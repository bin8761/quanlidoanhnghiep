# Backend AWS Lean Architecture

## Mục tiêu

Thiết kế này tối ưu chi phí cho backend hiện tại, nhưng vẫn giữ mức hợp lý cho 6 trụ cột AWS Well-Architected:

- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

Kiến trúc này phù hợp cho MVP hoặc giai đoạn đầu có traffic thấp.

## Kiến Trúc Đề Xuất

- `Amazon Route 53` cho DNS
- `AWS Certificate Manager` cho TLS
- `Application Load Balancer` công khai
- `AWS Elastic Beanstalk` cho deployment và quản lý app
- `1 Amazon Elastic Compute Cloud` instance cho backend
- `Amazon Relational Database Service for MySQL Single-AZ`
- `Amazon Simple Storage Service` private bucket cho uploads
- `Amazon Simple Email Service` cho OTP / email outbound
- `AWS Secrets Manager` cho secret
- `AWS Systems Manager Parameter Store` cho config
- `Amazon CloudWatch Logs` và `Amazon CloudWatch Alarms`
- `AWS CloudTrail`
- `AWS Systems Manager Session Manager`

## Layout Mạng

- `Application Load Balancer` ở public subnets
- `1 EC2 application instance` trong public subnet nhưng chỉ nhận traffic từ `Application Load Balancer`
- `Amazon Relational Database Service` ở private subnet
- Không dùng `Redis`
- Không dùng `VPC Endpoints` ở giai đoạn này
- Không dùng `AWS Web Application Firewall` ở giai đoạn này

## Vì Sao Kiến Trúc Này Rẻ Hơn

- Bỏ `Amazon ElastiCache for Redis`
- Bỏ `Amazon Relational Database Service Multi-AZ`
- Bỏ `VPC Endpoints`
- Bỏ `AWS Web Application Firewall`
- Không dựng thêm private app tier nhiều instance
- Không thêm NAT Gateway

## Vai Trò Của Từng Dịch Vụ

- `Amazon Route 53`: trỏ domain vào hệ thống
- `AWS Certificate Manager`: cấp TLS certificate cho `Application Load Balancer`
- `Application Load Balancer`: nhận HTTPS và chuyển request vào app
- `AWS Elastic Beanstalk`: tự động deploy, health check, rollback ở mức nền tảng
- `Amazon Elastic Compute Cloud`: chạy code backend
- `Amazon Relational Database Service for MySQL Single-AZ`: lưu dữ liệu nghiệp vụ chính
- `Amazon Simple Storage Service`: lưu file upload thay cho local disk
- `Amazon Simple Email Service`: gửi OTP và email thông báo
- `AWS Secrets Manager`: lưu database password, JWT secret, SMTP secret
- `AWS Systems Manager Parameter Store`: lưu config không nhạy cảm
- `Amazon CloudWatch Logs` và `Amazon CloudWatch Alarms`: log và cảnh báo
- `AWS CloudTrail`: audit hoạt động AWS account
- `AWS Systems Manager Session Manager`: vào máy an toàn, không cần mở SSH public

## Đáp Ứng 6 Trụ Cột

### Operational Excellence

- Có `CloudWatch Logs`, `CloudWatch Alarms`, `CloudTrail`, `Session Manager`
- `Elastic Beanstalk` hỗ trợ deploy và rollback
- Cần bổ sung runbook và quy trình post-deploy check trong tài liệu vận hành

### Security

- `ALB` dùng TLS qua `AWS Certificate Manager`
- App không cần mở SSH public
- Secret để trong `AWS Secrets Manager`
- Database ở private subnet
- `Amazon S3` private
- Có thể gắn `AWS Web Application Firewall` ở phase sau nếu traffic tăng

### Reliability

- `Amazon Relational Database Service for MySQL` vẫn có automated backup
- `Elastic Beanstalk` giúp recover app nhanh hơn tự vận hành tay
- Có health check và alarm
- Đổi lại, kiến trúc này chưa có HA mạnh như `Multi-AZ`

### Performance Efficiency

- 1 app instance là đủ cho MVP hiện tại
- `SSE` của backend vẫn chạy được trên 1 instance vì codebase hiện dùng in-memory hub
- `Amazon S3` xử lý upload file thay cho lưu local

### Cost Optimization

- Loại bỏ các thành phần đắt nhất trước
- Chỉ giữ các service thật sự cần cho backend hiện tại
- Dễ tăng cấp sau khi có traffic thật

### Sustainability

- Ít tài nguyên hơn
- Ít thành phần hơn
- Dễ right-size và tối ưu tiếp khi có số liệu thực tế

## Ước Tính Chi Phí

Giả định:

- Region: `ap-southeast-1`
- Chạy 24/7
- Traffic thấp đến vừa
- Upload và email ít

Ước tính sơ bộ:

- `Application Load Balancer`: khoảng `16-30 USD/tháng`
- `1 x t4g.small EC2`: khoảng `12-13 USD/tháng`
- `Amazon Relational Database Service for MySQL Single-AZ`: khoảng `10-20 USD/tháng` tùy instance class và storage
- `Amazon Simple Storage Service`: khoảng `1-3 USD/tháng` ở mức uploads nhỏ
- `Amazon Simple Email Service`: thường rất thấp ở mức OTP / mail ít
- `Amazon CloudWatch`, `AWS CloudTrail`, `AWS Systems Manager`, `Amazon EBS`: vài USD đến khoảng `10 USD/tháng`

Tổng ước tính hợp lý:

- khoảng `40-70 USD/tháng`

Nếu bỏ luôn `Application Load Balancer` và chấp nhận TLS / security thấp hơn, chi phí có thể giảm thêm, nhưng tôi không khuyên làm vậy nếu bạn vẫn muốn giữ baseline bảo mật tốt.

## Những Gì Nên Thêm Sau Này

- `Amazon ElastiCache for Redis` khi có nhiều instance hoặc cần shared state thật
- `Amazon Relational Database Service Multi-AZ` khi cần reliability cao hơn
- `VPC Endpoints` khi muốn giảm phụ thuộc public egress hoặc tối ưu private access
- `AWS Web Application Firewall` khi public traffic tăng hoặc có bot / abuse

## Kết Luận

Đây là kiến trúc phù hợp hơn cho backend hiện tại nếu ưu tiên chi phí. Nó bỏ các phần đắt nhất nhưng vẫn giữ được đường đi kiến trúc rõ ràng, an toàn ở mức MVP, và có đường nâng cấp rất tự nhiên lên phase production sau này.
