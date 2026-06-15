# Backend AWS Final BE Architecture

## Mục tiêu

Đây là kiến trúc AWS chốt cho backend hiện tại của dự án, ưu tiên chi phí thấp nhưng vẫn giữ mức hợp lý cho 6 trụ cột của AWS Well-Architected ở giai đoạn MVP.

Lưu ý: trong kiến trúc tổng của hệ thống, người dùng không gọi thẳng backend. Luồng đúng là `User -> FE -> BE`. Tài liệu này chỉ mô tả phần backend phía sau frontend; bản ghép tổng thể nằm ở `docs/codebase/fullstack-aws-final-architecture.md`.
Giai đoạn test/demo nội bộ hiện tại dùng URL mặc định của AWS, nên chưa cần chốt custom domain.

## Kiến Trúc Chốt

- `Amazon Route 53` cho DNS
- `AWS Certificate Manager` cho TLS
- `Application Load Balancer`
- `AWS Elastic Beanstalk`
- `1 Amazon Elastic Compute Cloud instance` cho backend
- `Amazon Relational Database Service for MySQL Single-AZ`
- `Amazon Simple Storage Service` private bucket cho file upload
- `Amazon Simple Email Service` cho OTP và email outbound
- `AWS Secrets Manager` cho secret
- `AWS Systems Manager Parameter Store` cho config
- `Amazon CloudWatch Logs` và `Amazon CloudWatch Alarms`
- `AWS CloudTrail`
- `AWS Systems Manager Session Manager`

## Vì Sao Kiến Trúc Này Được Chốt

### Chi phí

- Giữ ở mức khoảng `50-60 USD/tháng` cho workload nhỏ đến vừa.
- Bỏ các thành phần đắt nhất ở phase đầu:
  - `Amazon ElastiCache for Redis`
  - `Amazon Relational Database Service Multi-AZ`
  - `VPC Endpoints`
  - `AWS Web Application Firewall`

### Đủ dùng cho backend hiện tại

Codebase backend là một monolith module-based với:

- JWT auth
- MySQL qua Prisma
- SMTP mail
- file upload
- logging
- SSE realtime notification

Kiến trúc này đủ để chạy các luồng đó mà không thêm lớp hạ tầng chưa cần thiết.

## Layout Mạng

- `Application Load Balancer` là lớp public entry point
- Backend chạy trên `1 EC2` instance qua `AWS Elastic Beanstalk`
- Database nằm ở private subnet
- `Amazon S3`, `Amazon SES`, `AWS Secrets Manager`, `AWS Systems Manager Parameter Store` là service cấp Region
- Không cần `Redis` ở baseline
- Không cần `VPC Endpoints` ở baseline
- Không cần `AWS Web Application Firewall` ở baseline

## Luồng Chính

1. Frontend đã được tải xong từ `AWS Amplify Hosting`.
2. Frontend gọi API backend qua domain riêng, ví dụ `api.domain.com`.
3. `Amazon Route 53` phân giải `api.domain.com` về `Application Load Balancer`.
4. `Application Load Balancer` chuyển request vào backend instance.
5. Backend xử lý business logic.
6. Backend đọc và ghi dữ liệu qua `Amazon Relational Database Service for MySQL`.
7. Backend lưu file lên `Amazon S3`.
8. Backend gửi OTP hoặc email thông báo qua `Amazon SES`.
9. Backend đọc secret từ `AWS Secrets Manager`.
10. Backend đọc config từ `AWS Systems Manager Parameter Store`.
11. Log và cảnh báo đi vào `Amazon CloudWatch`.
12. Audit hoạt động AWS đi qua `AWS CloudTrail`.
13. Quản trị máy qua `AWS Systems Manager Session Manager`.

## Đáp Ứng 6 Trụ Cột Ở Mức Hợp Lý

### Operational Excellence

- Có `CloudWatch Logs` và `CloudWatch Alarms`.
- Có `CloudTrail` để audit.
- Có `Session Manager` để vận hành an toàn.
- `Elastic Beanstalk` hỗ trợ deploy và rollback ở mức nền tảng.
- Cần bổ sung runbook và quy trình post-deploy check trong tài liệu vận hành.

### Security

- `AWS Certificate Manager` bảo vệ TLS.
- App không cần SSH public.
- Secret nằm trong `AWS Secrets Manager`.
- Config thường nằm trong `Parameter Store`.
- `Amazon S3` private.
- Database không public.

### Reliability

- `Single-AZ` giúp giảm chi phí ở phase đầu.
- `Elastic Beanstalk` giúp recover app nhanh hơn tự vận hành tay.
- `CloudWatch Alarms` hỗ trợ phát hiện sự cố sớm.
- Đổi lại, kiến trúc này chưa có HA mạnh như `Multi-AZ`.

### Performance Efficiency

- `1 instance` đủ cho baseline hiện tại.
- Backend dùng `SSE` in-memory theo codebase hiện tại, nên chưa cần Redis ở baseline.
- Khi tải tăng thật, mới cân nhắc scale hoặc bổ sung shared state.

### Cost Optimization

- Loại bỏ các thành phần đắt nhất trước.
- Chỉ giữ những service thật sự cần cho backend hiện tại.
- Dễ nâng cấp sau khi có traffic thật.

### Sustainability

- Ít tài nguyên hơn.
- Ít thành phần hơn.
- Dễ right-size và tối ưu tiếp khi có số liệu thực tế.

## Khi Nào Nên Nâng Cấp

- Bật `Auto Scaling` khi traffic tăng và `1 instance` không còn đủ.
- Dùng `min = 1`, `desired = 1`, `max = 2` hoặc `3` tùy ngân sách nếu muốn có đường thoát khi spike.
- Chỉ nên để autoscaling sau khi đã kiểm tra backend có thể chạy ổn khi có thêm instance.
- Nếu ứng dụng còn phụ thuộc state in-memory cho realtime, cần xử lý shared state trước khi scale ngang mạnh.
- Thêm `Amazon ElastiCache for Redis` khi có nhiều instance hoặc cần shared state cho realtime / rate limiting.
- Nâng `Amazon Relational Database Service` lên `Multi-AZ` khi cần reliability cao hơn.
- Thêm `VPC Endpoints` khi muốn private access tối ưu hơn.
- Thêm `AWS Web Application Firewall` khi public traffic tăng hoặc có bot / abuse.
- Bật autoscaling khi tải thực tế cho thấy `1 instance` không còn đủ.

## Kết Luận

Đây là bản chốt cho backend giai đoạn hiện tại:

- rẻ
- đủ dùng
- dễ vận hành
- có đường nâng cấp rõ ràng

Nó không tối đa hóa độ sẵn sàng ngay từ đầu, nhưng phù hợp với ngân sách và đúng với trạng thái hiện tại của codebase.
