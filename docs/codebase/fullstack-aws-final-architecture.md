# Fullstack AWS Final Architecture

## Mục tiêu

Đây là kiến trúc AWS chốt cho toàn bộ hệ thống ở mức tổng thể, ghép cả frontend và backend thành một luồng thống nhất.

Mục tiêu:

- giữ chi phí thấp
- dễ vận hành
- đúng logic ứng dụng web thông thường
- vẫn đáp ứng hợp lý 6 trụ cột AWS Well-Architected cho giai đoạn hiện tại

## Kiến trúc chốt

### Frontend

- `AWS Amplify Hosting`
- `Amazon Route 53`
- `AWS Certificate Manager`
- `Amazon Cognito`
- `Amazon S3`

### Backend

- `Amazon Route 53`
- `AWS Certificate Manager`
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

## Luồng tổng thể đúng

1. Người dùng truy cập domain của hệ thống.
2. `Amazon Route 53` phân giải domain frontend về `AWS Amplify Hosting`.
3. `AWS Certificate Manager` cung cấp TLS/HTTPS cho domain custom.
4. Frontend được tải từ `AWS Amplify Hosting`.
5. Frontend gọi `Amazon Cognito` cho đăng nhập, đăng ký, quên mật khẩu nếu cần.
6. Frontend gọi API backend qua domain riêng, ví dụ `api.domain.com`.
7. `Amazon Route 53` phân giải `api.domain.com` về `Application Load Balancer`.
8. `Application Load Balancer` chuyển request vào backend instance trong `AWS Elastic Beanstalk`.
9. Backend xử lý business logic.
10. Backend đọc và ghi dữ liệu qua `Amazon Relational Database Service for MySQL Single-AZ`.
11. Backend lưu file lên `Amazon S3`.
12. Backend gửi OTP hoặc email thông báo qua `Amazon Simple Email Service`.
13. Backend đọc secret từ `AWS Secrets Manager`.
14. Backend đọc config từ `AWS Systems Manager Parameter Store`.
15. Log và cảnh báo đi vào `Amazon CloudWatch Logs` và `Amazon CloudWatch Alarms`.
16. Audit hoạt động AWS đi qua `AWS CloudTrail`.
17. Quản trị máy qua `AWS Systems Manager Session Manager`.

## Quy ước vẽ sơ đồ

### Main flow

- `User -> Route 53 -> Amplify`
- `Amplify -> Cognito`
- `Amplify -> api.domain.com -> Route 53 -> ALB -> Elastic Beanstalk`

### Supporting flow

- `ACM -> Amplify`
- `ACM -> ALB`
- `Web / App -> RDS`
- `Web / App -> S3`
- `Web / App -> SES`
- `Web / App -> Secrets Manager`
- `Web / App -> Parameter Store`
- `Web / App -> CloudWatch`
- `CloudTrail` và `Session Manager` để riêng trong nhóm vận hành / audit

## Vì sao phải ghép thành một kiến trúc tổng

- Người dùng thực tế không gọi thẳng backend.
- FE là entry point, BE là API phía sau.
- Nếu vẽ tách rời mà không có luồng ghép, sơ đồ sẽ sai logic sử dụng của hệ thống.
- Khi ghép chung, dễ nhìn được toàn bộ request path và các dịch vụ hỗ trợ.

## Ghi chú về chi phí

Kiến trúc tổng này vẫn ưu tiên chi phí thấp:

- FE dùng `AWS Amplify Hosting` thay vì tự dựng compute
- BE giữ `1 EC2 instance` và `Single-AZ` ở giai đoạn hiện tại
- chưa bật các thành phần đắt hơn như `Amazon ElastiCache for Redis`, `Multi-AZ`, `AWS Web Application Firewall`, hay `NAT Gateway`

## Kết luận

Kiến trúc chốt cần xem như một khối duy nhất:

`User -> Route 53 -> AWS Amplify Hosting -> Cognito / S3 -> api.domain.com -> Route 53 -> Application Load Balancer -> AWS Elastic Beanstalk -> RDS / S3 / SES / Parameter Store / Secrets Manager / CloudWatch`

Đây là luồng đúng để dùng khi triển khai và khi vẽ diagram.
