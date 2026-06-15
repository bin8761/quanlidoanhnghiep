# Backend AWS Security Baseline

## Mục tiêu

Tài liệu này chốt các quyết định bảo mật tối thiểu cần có trước khi coi kiến trúc AWS là an toàn ở mức nền tảng.

## 1. Identity and Access Management

### Quyết định

- Tách ít nhất 3 nhóm quyền:
  - application role
  - deployment role
  - admin role
- Ứng dụng chỉ được cấp quyền tối thiểu cần thiết.
- Không dùng quyền quản trị rộng cho app.

### Cần làm

- Liệt kê từng role.
- Gán quyền đọc đúng các dịch vụ cần thiết cho application role.
- Tách quyền deploy khỏi quyền admin.
- Kiểm tra lại mọi policy theo nguyên tắc least privilege.

## 2. Network Access

### Quyết định

- `Application Load Balancer` nhận traffic public trên `80/443`.
- `Web / App` chỉ nhận traffic từ `Application Load Balancer`.
- Database chỉ nhận traffic từ `Web / App`.
- `ElastiCache Redis` chỉ nhận traffic từ `Web / App`.

### Cần làm

- Chốt security group cho từng tầng.
- Ghi rõ `from`, `to`, `port`.
- Không mở port thừa ra internet.
- Giữ app và database trong private subnet.

## 3. Secrets and Config

### Quyết định

- Secret thật để trong `AWS Secrets Manager`.
- Config thường để trong `AWS Systems Manager Parameter Store`.
- Không hard-code secret trong code hoặc environment file.

### Cần làm

- Liệt kê toàn bộ secret:
  - database password
  - JWT secret
  - SMTP password
  - API key nếu có
- Liệt kê toàn bộ config thường:
  - environment name
  - feature flag
  - app setting
- Chốt nơi lưu của từng biến.

## 4. Encryption

### Quyết định

- `Amazon Simple Storage Service` bật encryption.
- `Amazon Relational Database Service` bật encryption.
- `Amazon Elastic Block Store` bật encryption.
- Dùng `AWS Key Management Service` để quản lý key.

### Cần làm

- Chốt scope mã hóa cho từng dịch vụ.
- Đảm bảo dữ liệu at rest đều được mã hóa.
- Kiểm tra app không ghi dữ liệu nhạy cảm ra chỗ không mã hóa.

## 5. Logging and Audit

### Quyết định

- App log vào `Amazon CloudWatch Logs`.
- Cảnh báo vào `Amazon CloudWatch Alarms`.
- Audit AWS API bằng `AWS CloudTrail`.
- Network log bằng `VPC Flow Logs`.

### Cần làm

- Chốt log source cho app và hạ tầng.
- Chốt retention cho log.
- Tạo alarm tối thiểu cho:
  - error rate
  - latency
  - CPU
  - database connections
- Đảm bảo `CloudTrail` bật cho account.

## 6. Edge Protection

### Quyết định

- Nếu hệ thống public-facing thì dùng `AWS Web Application Firewall`.
- Gắn `AWS Web Application Firewall` vào `Application Load Balancer`.

### Cần làm

- Quyết định có bật `AWS Web Application Firewall` hay không.
- Nếu bật thì chốt rule cơ bản:
  - block common web attacks
  - limit abuse / bot traffic nếu cần
- Kiểm tra không làm ảnh hưởng request hợp lệ.

## Kết Luận

Nếu hoàn thành 6 mục này thì kiến trúc đã có security baseline đủ rõ để chuyển sang reliability baseline và operational excellence baseline.
