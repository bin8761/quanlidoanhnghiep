# Fullstack AWS Final Architecture

## Mục tiêu

Đây là kiến trúc AWS chốt cho toàn bộ hệ thống ở mức tổng thể, ghép cả frontend và backend thành một luồng thống nhất.

Mục tiêu:

- giữ chi phí thấp
- dễ vận hành
- đúng logic ứng dụng web thông thường
- vẫn đáp ứng hợp lý 6 trụ cột AWS Well-Architected cho giai đoạn hiện tại

## Chế Độ Triển Khai Hiện Tại

Tài liệu này được chỉnh theo hướng **test/demo nội bộ** bằng **domain mặc định của AWS**, không cần mua domain riêng.

Quy ước hiện tại:

- Frontend dùng URL mặc định của `AWS Amplify Hosting`
- Backend dùng DNS name mặc định của `Application Load Balancer`
- `Amazon Route 53` và `AWS Certificate Manager` custom domain để cho giai đoạn sau nếu cần production

Về network, sơ đồ hiện tại cần thể hiện rõ:

- `Internet Gateway` là cửa ra vào của `VPC`
- `Application Load Balancer` nằm trong `public subnet` và trải trên `2 Availability Zone`
- `NAT Gateway` nằm trong `public subnet`
- `Web/App` và `Amazon RDS` nằm trong `private subnet`
- backend private subnet đi ra ngoài qua `NAT Gateway` khi cần gọi dịch vụ bên ngoài hoặc public endpoint của AWS

## Kiến Trúc Chốt

### Frontend

- `AWS Amplify Hosting`
- `Amazon S3`

### Backend

- `Internet Gateway`
- `Public subnet` trên `2 Availability Zone`
- `Application Load Balancer`
- `NAT Gateway`
- `Private subnet` trên `2 Availability Zone`
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

## Luồng Tổng Thể Đúng

1. Người dùng truy cập URL mặc định của `AWS Amplify Hosting`.
2. Frontend được tải từ `AWS Amplify Hosting`.
3. Frontend gọi API qua đường dẫn tương đối `/api`, sau đó `AWS Amplify Hosting` rewrite request sang DNS name mặc định của `Application Load Balancer`.
4. Request đi qua `Internet Gateway` đến `Application Load Balancer`.
5. `Application Load Balancer` chuyển request vào backend instance trong `AWS Elastic Beanstalk`.
6. Backend tự xử lý đăng nhập, đăng ký, quên mật khẩu và phát hành `JWT` sau khi xác thực thành công.
7. Backend xử lý business logic.
8. Backend đọc và ghi dữ liệu qua `Amazon Relational Database Service for MySQL Single-AZ`.
9. Backend lưu file lên `Amazon S3`.
10. Backend gửi OTP hoặc email thông báo qua `Amazon Simple Email Service`.
11. Backend đọc secret từ `AWS Secrets Manager`.
12. Backend đọc config từ `AWS Systems Manager Parameter Store`.
13. Log và cảnh báo đi vào `Amazon CloudWatch Logs` và `Amazon CloudWatch Alarms`.
14. Audit hoạt động AWS đi qua `AWS CloudTrail`.
15. Quản trị máy qua `AWS Systems Manager Session Manager`.

## Quy Ước Vẽ Sơ Đồ

### Main flow

- `User -> Amplify`
- `Amplify -> Internet Gateway -> ALB -> Elastic Beanstalk`
- `Backend -> JWT`

### Supporting flow

- `Web / App -> RDS`
- `Web / App -> S3`
- `Web / App -> SES`
- `Web / App -> Secrets Manager`
- `Web / App -> Parameter Store`
- `Web / App -> CloudWatch`
- `Web / App -> NAT Gateway -> Internet`
- `CloudTrail` và `Session Manager` để riêng trong nhóm vận hành / audit
- `RDS Backup / Snapshot` và `EC2 AMI / EBS Snapshot` nếu cần minh họa backup

## Vì Sao Phải Ghép Thành Một Kiến Trúc Tổng

- Người dùng thực tế không gọi thẳng backend.
- FE là entry point, BE là API phía sau.
- Nếu vẽ tách rời mà không có luồng ghép, sơ đồ sẽ sai logic sử dụng của hệ thống.
- Khi ghép chung, dễ nhìn được toàn bộ request path và các dịch vụ hỗ trợ.
- `Route 53` chỉ là DNS ở giai đoạn production/custom domain, còn bản hiện tại dùng URL mặc định của Amplify nên không cần vẽ DNS layer.

## Ghi Chú Về Chi Phí

Kiến trúc tổng này vẫn ưu tiên chi phí thấp:

- FE dùng `AWS Amplify Hosting` thay vì tự dựng compute
- BE giữ `1 EC2 instance` và `Single-AZ` ở giai đoạn hiện tại
- chưa bật các thành phần đắt hơn như `Amazon ElastiCache for Redis`, `Multi-AZ`, `AWS Web Application Firewall`
- chưa cần `Route 53` và `AWS Certificate Manager` custom domain cho giai đoạn test/demo nội bộ
- auth hiện tại là `JWT-only`, backend tự quản lý user/password thay vì dùng `Amazon Cognito`

## Kết Luận

Kiến trúc chốt cần xem như một khối duy nhất:

`User -> AWS Amplify Hosting -> Internet Gateway -> Application Load Balancer -> AWS Elastic Beanstalk -> RDS / S3 / SES / Parameter Store / Secrets Manager / CloudWatch`

Đây là luồng đúng để dùng khi triển khai và khi vẽ diagram.
