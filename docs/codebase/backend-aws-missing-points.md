# Backend AWS Missing Points

## Mục đích

Tài liệu này là checklist chi tiết theo từng pillar của AWS Well-Architected. Mỗi mục nêu rõ:

- còn thiếu gì
- nên làm gì để hoàn thiện

## 1. Operational Excellence

### Còn thiếu

- Chưa có quy trình triển khai chuẩn.
- Chưa có quy trình quay lui rõ ràng khi deploy lỗi.
- Chưa có runbook xử lý sự cố.
- Chưa có dashboard vận hành và ngưỡng cảnh báo được chuẩn hóa.
- Chưa có quy trình post-incident review.
- Chưa có cách kiểm tra sau triển khai và xác nhận hệ thống ổn định.

### Cần làm để hoàn thiện

- Chuẩn hóa pipeline triển khai.
- Viết quy trình rollback cho từng loại release.
- Viết runbook cho các lỗi thường gặp như application error, database issue, deployment failure, email failure.
- Tạo dashboard theo dõi latency, error rate, CPU, memory, database connections.
- Cấu hình cảnh báo và người nhận cảnh báo.
- Thêm bước post-deploy verification.
- Có lịch review vận hành định kỳ.

## 2. Security

### Còn thiếu

- Chưa mô tả rõ chính sách `Identity and Access Management`.
- Chưa chốt rõ nguyên tắc least privilege cho từng dịch vụ.
- Chưa thể hiện rõ `AWS Web Application Firewall` nếu hệ thống public-facing.
- Chưa mô tả rõ `AWS Key Management Service` cho mã hóa dữ liệu.
- Chưa nêu rõ rotation cho secret.
- Chưa chốt security group và network access rule chi tiết.
- Chưa mô tả threat detection và security monitoring.

### Cần làm để hoàn thiện

- Viết policy `Identity and Access Management` theo từng role.
- Chỉ cấp quyền tối thiểu cho application role, deployment role, admin role.
- Bật mã hóa cho `Amazon Simple Storage Service`, `Amazon Relational Database Service`, `Amazon Elastic Block Store`.
- Quản lý key bằng `AWS Key Management Service`.
- Dùng `AWS Secrets Manager` cho secret và cấu hình rotation nếu cần.
- Chốt inbound và outbound rules cho security group.
- Thêm `AWS Web Application Firewall` nếu workload public-facing.
- Bổ sung giám sát bảo mật bằng `AWS CloudTrail`, `VPC Flow Logs`, và log phân tích.
- Giới hạn quyền truy cập vào `AWS Systems Manager Session Manager`.

## 3. Reliability

### Còn thiếu

- Chưa có chiến lược backup và restore.
- Chưa chốt recovery point objective.
- Chưa chốt recovery time objective.
- Chưa có test failover cho `Amazon Relational Database Service for MySQL Multi-AZ`.
- Chưa có chiến lược health check và auto healing.
- Chưa mô tả capacity headroom khi một Availability Zone gặp sự cố.
- Chưa có kế hoạch khôi phục file và dữ liệu ứng dụng.

### Cần làm để hoàn thiện

- Thiết kế backup cho database và file.
- Viết quy trình restore và kiểm tra restore định kỳ.
- Chốt recovery point objective và recovery time objective.
- Test failover database ít nhất theo lịch định kỳ.
- Cấu hình health check cho `Application Load Balancer` và application instances.
- Chốt strategy tự phục hồi cho instance lỗi.
- Đảm bảo hệ thống vẫn chạy khi một Availability Zone bị ảnh hưởng.
- Có kế hoạch khôi phục `Amazon Simple Storage Service` data nếu cần.

## 4. Performance Efficiency

### Còn thiếu

- Chưa có chiến lược auto scaling cho application tier.
- Chưa chốt right-sizing cho máy ứng dụng.
- Chưa có chiến lược cache rõ ràng ngoài việc dùng Redis.
- Chưa có benchmark hoặc load test cho workload dự kiến.
- Chưa mô tả cách theo dõi bottleneck của database, cache, và application.
- Chưa nêu rõ connection pooling hoặc tối ưu query.

### Cần làm để hoàn thiện

- Bật auto scaling cho application tier nếu tải tăng.
- Chọn size phù hợp cho `Amazon Elastic Compute Cloud`.
- Đo tải thực tế bằng load test.
- Theo dõi database latency, cache hit rate, request latency.
- Tối ưu query và index của `Amazon Relational Database Service for MySQL`.
- Dùng Redis đúng vai trò cache và shared state.
- Chốt giới hạn tài nguyên cho từng layer theo nhu cầu thực tế.

## 5. Cost Optimization

### Còn thiếu

- Chưa có budget guardrail.
- Chưa có cost alarm.
- Chưa có lịch review tài nguyên để loại bỏ phần dư thừa.
- Chưa có lifecycle policy cho `Amazon Simple Storage Service`.
- Chưa chốt phần nào dùng `Single-AZ` và phần nào bắt buộc `Multi-AZ`.
- Chưa có policy tắt tài nguyên non-production theo lịch.
- Chưa có tag strategy rõ cho phân bổ chi phí.

### Cần làm để hoàn thiện

- Tạo budget và cảnh báo vượt ngân sách.
- Review chi phí theo chu kỳ.
- Gắn tag để phân loại chi phí theo môi trường và dịch vụ.
- Bật lifecycle policy cho file trên `Amazon Simple Storage Service`.
- Quyết định rõ chỗ nào cần `Multi-AZ`, chỗ nào có thể chấp nhận chi phí thấp hơn.
- Tắt tài nguyên non-production khi không dùng.
- Dùng `VPC Endpoints` hợp lý để giảm phụ thuộc vào `Network Address Translation Gateway` nếu phù hợp.

## 6. Sustainability

### Còn thiếu

- Chưa có chiến lược giảm tài nguyên nhàn rỗi.
- Chưa có chiến lược scale theo nhu cầu.
- Chưa có retention policy hợp lý cho log.
- Chưa có cách giảm log noise.
- Chưa có kế hoạch right-sizing định kỳ.

### Cần làm để hoàn thiện

- Chỉ giữ tài nguyên cần thiết cho tải thực tế.
- Scale theo nhu cầu thay vì chạy dư.
- Giữ log đúng thời gian cần thiết rồi xoay vòng hoặc xóa theo retention policy.
- Giảm log không hữu ích để tiết kiệm storage và xử lý.
- Review size và số lượng tài nguyên định kỳ.

## Thiếu Chung Ở Mức Kiến Trúc

- Chưa có tài liệu vận hành kèm theo sơ đồ.
- Chưa chốt đầy đủ `VPC Endpoints` cho từng dịch vụ AWS.
- Chưa có tài liệu kiểm tra triển khai và xác nhận sau deploy.
- Chưa có tài liệu incident response.
- Chưa có tài liệu backup và restore riêng.

## Kết Luận

Kiến trúc hiện tại là nền tốt cho giai đoạn sớm, nhưng để hoàn thiện đủ 6 pillar thì cần bổ sung thêm phần vận hành, security hardening, reliability testing, performance tuning, cost guardrails và sustainability policy ở mức tài liệu và triển khai.
