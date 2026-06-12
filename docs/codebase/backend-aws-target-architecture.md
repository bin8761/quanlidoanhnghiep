# Backend AWS Target Architecture

## Mục tiêu

Tài liệu này chốt kiến trúc đích cho backend trên AWS theo hướng đủ hợp lý để bao phủ 6 trụ cột của AWS Well-Architected ở mức production nhỏ hoặc giai đoạn tăng trưởng sớm:

- Tính vận hành xuất sắc
- Tính bảo mật
- Tính độ tin cậy
- Tính hiệu quả năng suất
- Tính tối ưu hóa chi phí
- Tính bền vững

## Kiến trúc đích

Kiến trúc đích nên gồm các thành phần sau:

- `Application Load Balancer` đặt trong `2 public subnets`, trải trên `2 Availability Zones`
- `AWS Elastic Beanstalk` chạy `2 máy ứng dụng Amazon Elastic Compute Cloud` trong `2 private application subnets`, mỗi `Availability Zone` một máy
- `Amazon Relational Database Service for MySQL Multi-AZ` đặt trong `private database subnets`
- `Amazon ElastiCache for Redis` để phục vụ `server-sent events pub/sub`, `rate limiting`, và giảm phụ thuộc vào memory local của từng máy ứng dụng
- `Amazon Simple Storage Service` dùng làm `private bucket` cho file upload
- `Amazon Simple Email Service` dùng cho gửi email outbound như OTP hoặc thông báo
- `AWS Secrets Manager` dùng cho secret thật sự như database credentials, JWT secret, SMTP credentials
- `AWS Systems Manager Parameter Store` dùng cho non-secret configuration
- `Amazon Virtual Private Cloud Endpoints` dùng để truy cập private tới các dịch vụ cần thiết như `Amazon Simple Storage Service`, `AWS Secrets Manager`, `AWS Systems Manager`, `Amazon CloudWatch Logs`, `AWS Key Management Service`
- `Amazon CloudWatch Logs` để gom log ứng dụng và log hạ tầng
- `Amazon CloudWatch Alarms` để cảnh báo CPU, memory, error rate, database connections, latency
- `AWS CloudTrail` để audit hoạt động tài khoản và API calls
- `Amazon Virtual Private Cloud Flow Logs` để theo dõi lưu lượng mạng trong `Amazon Virtual Private Cloud`
- `AWS Systems Manager Session Manager` để quản trị máy mà không cần mở SSH public
- `AWS Web Application Firewall` nếu hệ thống public-facing và có rủi ro bị scan, bot, brute force, hoặc exploit web phổ biến

## Network Layout Chuẩn

Trong `Amazon Virtual Private Cloud`, nên tách mạng như sau:

- `Availability Zone A`
  - `Public Subnet A`
  - `Private Application Subnet A`
  - `Private Database Subnet A`
- `Availability Zone B`
  - `Public Subnet B`
  - `Private Application Subnet B`
  - `Private Database Subnet B`

Nguyên tắc đặt tài nguyên:

- `Application Load Balancer` gắn vào `Public Subnet A` và `Public Subnet B`
- Máy ứng dụng nằm trong `Private Application Subnet A` và `Private Application Subnet B`
- `Amazon Relational Database Service for MySQL Multi-AZ` nằm trong `Private Database Subnet A` và `Private Database Subnet B`
- `Amazon ElastiCache for Redis` nên nằm trong private subnets
- Các dịch vụ như `Amazon Simple Storage Service`, `Amazon Simple Email Service`, `AWS Secrets Manager`, `AWS Systems Manager Parameter Store`, `Amazon CloudWatch`, `AWS CloudTrail` là dịch vụ cấp Region, không nằm bên trong `Amazon Virtual Private Cloud`

## Những việc bắt buộc nếu muốn nói là đủ 6 trụ cột ở mức hợp lý

### 1. Về compute và network

- Đưa máy ứng dụng vào `private application subnets`
- Có ít nhất `2 máy ứng dụng`
- Đặt `Application Load Balancer` trong `public subnets`
- Tách rõ `public tier`, `application tier`, `database tier`

### 2. Về database và state

- Dùng `Amazon Relational Database Service for MySQL Multi-AZ`
- Thêm `Amazon ElastiCache for Redis`
- Không phụ thuộc vào memory local của một máy cho realtime state hoặc rate limiting

### 3. Về secret và cấu hình

- Dùng `AWS Secrets Manager` cho secret
- Dùng `AWS Systems Manager Parameter Store` cho non-secret configuration
- Hạn chế hard-code secret trong source code hoặc environment tùy tiện

### 4. Về mã hóa và bảo vệ dữ liệu

- Bật mã hóa cho `Amazon Simple Storage Service`
- Bật mã hóa cho `Amazon Relational Database Service`
- Bật mã hóa cho `Amazon Elastic Block Store`
- Ưu tiên dùng `AWS Key Management Service` để quản lý key

### 5. Về logging, audit, monitoring

- Bật `Amazon CloudWatch Logs`
- Bật `Amazon CloudWatch Alarms`
- Bật `AWS CloudTrail`
- Bật `Amazon Virtual Private Cloud Flow Logs`
- Nếu phù hợp, bật thêm `Application Load Balancer access logs`

### 6. Về vận hành

- Có quy trình triển khai
- Có quy trình rollback
- Có health check rõ ràng
- Có giám sát và cảnh báo
- Có runbook xử lý sự cố cơ bản

## Main Flow Của Hệ Thống

Luồng chính ở mức high-level nên được hiểu như sau:

1. Người dùng truy cập domain
2. `Amazon Route 53` phân giải domain về `Application Load Balancer`
3. `Application Load Balancer` chuyển request vào `AWS Elastic Beanstalk application tier`
4. Máy ứng dụng xử lý business logic
5. Máy ứng dụng truy cập `Amazon Relational Database Service for MySQL`
6. Máy ứng dụng dùng `Amazon ElastiCache for Redis` cho shared state như `server-sent events pub/sub` và `rate limiting`

Các dependency hỗ trợ:

- Máy ứng dụng truy cập `Amazon Simple Storage Service` để lưu file
- Máy ứng dụng gọi `Amazon Simple Email Service` để gửi email
- Máy ứng dụng đọc secret từ `AWS Secrets Manager`
- Máy ứng dụng đọc config từ `AWS Systems Manager Parameter Store`
- Log và metric được đẩy về `Amazon CloudWatch`
- Audit được ghi qua `AWS CloudTrail`

## Tại Sao Kiến Trúc Này Hợp Lý Hơn

### Tính vận hành xuất sắc

- Có log, metric, alarm, audit
- Có thể chuẩn hóa deploy và rollback
- Quản trị máy qua `AWS Systems Manager Session Manager`

### Tính bảo mật

- App không nằm ở public subnet
- Secret được quản lý tập trung
- Dữ liệu được mã hóa
- Có thể bổ sung `AWS Web Application Firewall`

### Tính độ tin cậy

- Có `2 máy ứng dụng`
- Có `2 Availability Zones`
- Database dùng `Multi-AZ`
- Redis giúp shared state ổn định hơn khi scale ngang

### Tính hiệu quả năng suất

- App tier có thể scale theo tải
- Redis giảm tải cho database và app local state
- `Application Load Balancer` phân phối request hợp lý

### Tính tối ưu hóa chi phí

- Vẫn giữ `AWS Elastic Beanstalk` thay vì chuyển sớm sang nền tảng phức tạp hơn
- Có thể ưu tiên `Amazon Virtual Private Cloud Endpoints` thay cho `Network Address Translation Gateway` nếu phù hợp
- Chỉ thêm các dịch vụ có giá trị vận hành rõ ràng

### Tính bền vững

- Tránh over-provisioning
- Chỉ scale khi cần
- Dùng managed services để giảm vận hành thủ công và giảm lãng phí tài nguyên

## Kết luận

Kiến trúc đích được chốt là:

- `Application Load Balancer` ở public tier
- `AWS Elastic Beanstalk` với `2 máy ứng dụng` ở private application tier
- `Amazon Relational Database Service for MySQL Multi-AZ` ở private database tier
- `Amazon ElastiCache for Redis` cho shared state
- `Amazon Simple Storage Service` cho file storage
- `Amazon Simple Email Service` cho outbound email
- `AWS Secrets Manager` cho secret
- `AWS Systems Manager Parameter Store` cho config
- `Amazon Virtual Private Cloud Endpoints` cho private access tới dịch vụ AWS cần thiết
- `Amazon CloudWatch Logs`, `Amazon CloudWatch Alarms`, `AWS CloudTrail`, `Amazon Virtual Private Cloud Flow Logs` cho observability và audit
- `AWS Systems Manager Session Manager` cho secure administration
- `AWS Web Application Firewall` nếu hệ thống public-facing

Đây là bản chốt nên dùng làm nền để:

- review kiến trúc
- vẽ lại sơ đồ AWS
- đối chiếu security
- làm tài liệu hạ tầng cho Phase 2
