# Backend AWS Services Explained

## Mục đích

Tài liệu này giải thích từng dịch vụ trong kiến trúc AWS của backend:

- dịch vụ đó có nhiệm vụ gì
- hoạt động ra sao
- nằm ở đâu trong hệ thống
- vì sao nó có mặt trong kiến trúc

## 1. Amazon Route 53

### Nhiệm vụ

- Quản lý DNS cho domain của hệ thống

### Hoạt động

- Khi người dùng truy cập domain, `Amazon Route 53` phân giải domain đó về `Application Load Balancer`

### Ví dụ

- Người dùng gõ `api.example.com`
- `Amazon Route 53` trả về endpoint của `Application Load Balancer`

## 2. AWS Certificate Manager

### Nhiệm vụ

- Cấp và quản lý TLS certificate

### Hoạt động

- Certificate được gắn vào `Application Load Balancer`
- Giúp traffic từ người dùng tới load balancer đi qua `HTTPS`

### Ý chính

- Dịch vụ này không xử lý business request
- Nó chỉ hỗ trợ bảo mật kết nối

## 3. Application Load Balancer

### Nhiệm vụ

- Nhận request từ internet và phân phối tới các máy ứng dụng

### Hoạt động

- Đứng ở public tier
- Nhận request HTTP hoặc HTTPS
- Kiểm tra listener và rule
- Chuyển request tới các `Web / App instances`

### Ý nghĩa

- Nếu có 2 máy ứng dụng, load balancer chia traffic giữa chúng
- Nếu một máy lỗi, traffic có thể chỉ đi vào máy còn khỏe

## 4. AWS Elastic Beanstalk

### Nhiệm vụ

- Hỗ trợ triển khai và quản lý ứng dụng backend trên AWS dễ hơn

### Hoạt động

- Quản lý environment cho ứng dụng
- Hỗ trợ deploy version mới
- Theo dõi health cơ bản
- Quản lý hạ tầng chạy app ở mức nền tảng

### Ý nghĩa

- Giúp giảm công sức vận hành so với tự dựng toàn bộ compute stack bằng tay

## 5. Amazon Elastic Compute Cloud

### Nhiệm vụ

- Là nơi backend code thực sự chạy

### Hoạt động

- Nhận request từ `Application Load Balancer`
- Chạy business logic
- Gọi database, cache, storage, email, config, secrets
- Trả response về client

### Vai trò trong hệ thống

- `AWS Elastic Beanstalk` là lớp quản lý
- `Amazon Elastic Compute Cloud` là máy thực sự chạy ứng dụng

## 6. Amazon Relational Database Service for MySQL Multi-AZ

### Nhiệm vụ

- Lưu dữ liệu chính của hệ thống

### Hoạt động

- App kết nối tới một database endpoint
- Endpoint này đại diện cho database service
- Database chính là `Primary DB`
- AWS đồng bộ dữ liệu sang `Standby DB`
- Khi `Primary DB` lỗi, AWS failover sang `Standby DB`

### Ý nghĩa

- Tăng độ tin cậy
- App không cần tự quản lý replication hoặc failover phức tạp

## 7. Primary DB

### Nhiệm vụ

- Xử lý đọc và ghi chính của hệ thống

### Hoạt động

- App gửi query tới đây thông qua endpoint của `Amazon Relational Database Service`

## 8. Standby DB

### Nhiệm vụ

- Giữ bản đồng bộ dự phòng cho `Primary DB`

### Hoạt động

- Không phải nơi app truy cập trực tiếp trong flow bình thường
- Được dùng khi AWS thực hiện failover

## 9. Amazon ElastiCache for Redis

### Nhiệm vụ

- Là shared state và cache layer cho app

### Trong hệ thống này, dịch vụ này đặc biệt hữu ích cho

- `server-sent events pub/sub`
- `rate limiting`
- Một số dữ liệu tạm thời cần chia sẻ giữa nhiều app instances

### Hoạt động

- Cả 2 app instances đều kết nối tới cùng một Redis
- App instance A publish event thì app instance B vẫn thấy được
- Tránh phụ thuộc vào memory local của từng máy ứng dụng

### Ý nghĩa

- Nếu chỉ dùng memory local, khi scale nhiều máy sẽ bị lệch state
- Redis giải quyết vấn đề shared state

## 10. Amazon S3

### Nhiệm vụ

- Lưu file upload hoặc object storage

### Hoạt động

- App upload file lên `Amazon S3`
- File không lưu cục bộ trên máy ứng dụng nữa
- Kể cả khi thay máy hoặc scale nhiều máy, file vẫn nằm tập trung

### Ý nghĩa

- Bền hơn local disk
- Phù hợp kiến trúc nhiều app instances

## 11. Amazon SES

### Nhiệm vụ

- Gửi email outbound

### Trong hệ thống này, dịch vụ này dùng cho

- Gửi OTP
- Gửi email thông báo

### Hoạt động

- App gọi `Amazon SES`
- `Amazon SES` gửi mail ra ngoài internet tới mailbox của người dùng

## 12. AWS Systems Manager Parameter Store

### Nhiệm vụ

- Lưu `app config` không phải secret

### Ví dụ

- Tên môi trường
- Feature flag đơn giản
- Các giá trị cấu hình chung

### Hoạt động

- App đọc cấu hình từ đây khi chạy

### Lưu ý

- Không nên dùng nó làm nơi chính cho secret nếu đã có `AWS Secrets Manager`

## 13. AWS Secrets Manager

### Nhiệm vụ

- Lưu secret nhạy cảm

### Ví dụ

- Database credentials
- JWT secret
- SMTP credentials
- API keys

### Hoạt động

- App lấy secret từ đây khi khởi động hoặc khi cần
- Secret được quản lý tập trung thay vì hard-code

### Ý nghĩa

- An toàn hơn
- Dễ rotate hơn
- Kiểm soát truy cập tốt hơn

## 14. Amazon CloudWatch Logs and Alarms

### Nhiệm vụ

- Thu thập log, metric và tạo cảnh báo

### Hoạt động

- App đẩy log vào `Amazon CloudWatch Logs`
- Hạ tầng cũng có metric như CPU, memory, latency
- `Amazon CloudWatch Alarms` theo dõi ngưỡng và cảnh báo khi có vấn đề

### Ví dụ

- CPU cao
- Error rate tăng
- Database connections bất thường
- Request latency tăng

## 15. AWS CloudTrail

### Nhiệm vụ

- Audit hoạt động cấp tài khoản AWS và API calls

### Hoạt động

- Ghi lại ai đã tạo, sửa, xóa tài nguyên AWS
- Ghi lại hành động quản trị và automation

### Ý nghĩa

- Phục vụ audit
- Truy vết khi có sự cố bảo mật hoặc thay đổi hạ tầng

## 16. AWS Systems Manager Session Manager

### Nhiệm vụ

- Cho phép quản trị máy ứng dụng an toàn

### Hoạt động

- Cho phép vào máy `Amazon Elastic Compute Cloud` thông qua `Session Manager`
- Không cần mở `SSH public`

### Ý nghĩa

- Giảm attack surface
- An toàn hơn việc mở cổng SSH ra internet

## 17. VPC Flow Logs

### Nhiệm vụ

- Ghi lại metadata của network traffic trong `Amazon Virtual Private Cloud`

### Hoạt động

- Theo dõi luồng traffic vào hoặc ra network interface, subnet hoặc `Amazon Virtual Private Cloud`

### Ý nghĩa

- Hỗ trợ kiểm tra network
- Hỗ trợ security investigation
- Hỗ trợ audit network behavior

### Lưu ý

- Dịch vụ này không ghi full payload request
- Nó ghi thông tin như source, destination, port, allow hoặc deny

## 18. VPC Endpoints

### Nhiệm vụ

- Cho phép app trong private subnet truy cập một số AWS services qua private path

### Hoạt động

- Thay vì app đi ra internet hoặc qua `Network Address Translation Gateway`
- App đi qua `VPC Endpoints`
- Thường dùng cho:
  - `Amazon S3`
  - `AWS Secrets Manager`
  - `AWS Systems Manager`
  - `Amazon CloudWatch Logs`

### Ý nghĩa

- Private hơn
- Có thể tối ưu chi phí hơn `Network Address Translation Gateway` trong một số trường hợp
- Giảm phụ thuộc vào outbound internet path

## 19. Public Subnets

### Nhiệm vụ

- Chứa tài nguyên internet-facing

### Trong sơ đồ này

- Đây là nơi `Application Load Balancer` gắn vào

## 20. Private App Subnets

### Nhiệm vụ

- Chứa app instances

### Ý nghĩa

- App không phơi trực tiếp ra internet
- Chỉ nhận traffic qua `Application Load Balancer`

## 21. Private DB Subnets

### Nhiệm vụ

- Chứa database tier

### Ý nghĩa

- Database được tách biệt và bảo vệ hơn
- Không public ra internet

## Tóm tắt toàn bộ hệ thống hoạt động

1. Người dùng gọi domain
2. `Amazon Route 53` phân giải về `Application Load Balancer`
3. `Application Load Balancer` chuyển request vào 1 trong 2 app instances
4. App xử lý logic
5. App đọc hoặc ghi dữ liệu qua `Amazon Relational Database Service for MySQL`
6. App dùng `Amazon ElastiCache for Redis` cho shared state, realtime và rate limiting
7. App lưu file lên `Amazon S3`
8. App gửi mail qua `Amazon SES`
9. App lấy config từ `AWS Systems Manager Parameter Store`
10. App lấy secret từ `AWS Secrets Manager`
11. Log và metric đi vào `Amazon CloudWatch`
12. Audit hạ tầng đi qua `AWS CloudTrail`
13. Network telemetry đi vào `VPC Flow Logs`
14. Quản trị máy dùng `AWS Systems Manager Session Manager`
15. Private access tới một số dịch vụ AWS đi qua `VPC Endpoints`
