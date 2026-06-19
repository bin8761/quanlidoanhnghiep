# Enterprise Asset Management - AWS Architecture Presentation

Em chào anh/chị admin và mọi người, em xin đại diện nhóm trình bày sơ bộ về kiến trúc AWS của dự án Enterprise Asset Management

Tech Stack:

- Frontend: React + Vite, build thành static asset và host trên `AWS Amplify Hosting`
- Authentication: `Amazon Cognito`
- Backend: Node.js + Express.js, chạy trên `AWS Elastic Beanstalk` phía sau `Application Load Balancer`
- Database: `Amazon RDS for MySQL Single-AZ`
- Storage: `Amazon S3` cho static assets, file upload và tài liệu đính kèm
- Email: `Amazon SES` cho OTP và email thông báo
- Security/Config: `AWS Secrets Manager`, `AWS Systems Manager Parameter Store`, `AWS Certificate Manager`
- DNS: `Amazon Route 53`
- Monitoring/Ops: `Amazon CloudWatch`, `AWS CloudTrail`, `AWS Systems Manager Session Manager`

1. LUỒNG NGƯỜI DÙNG (USER FLOW)

- Người dùng truy cập domain của hệ thống thông qua `Amazon Route 53`.
- `Route 53` phân giải hostname frontend về `AWS Amplify Hosting`.
- Frontend React được tải xuống trình duyệt từ Amplify.
- Người dùng đăng nhập qua `Amazon Cognito` trên giao diện frontend.
- Sau khi xác thực thành công, frontend nhận thông tin phiên đăng nhập và JWT hoặc token tương ứng từ luồng auth.
- Từ thời điểm đó, người dùng tương tác với hệ thống qua các màn hình quản lý tài sản, yêu cầu, báo cáo và cấu hình.

2. LUỒNG ỨNG DỤNG (APPLICATION FLOW)

- USER truy cập hệ thống qua domain public.
- `Amazon Route 53` phân giải `app.domain.com` về `AWS Amplify Hosting`.
- Frontend React được tải từ Amplify và hiển thị giao diện người dùng.
- Frontend gọi luồng xác thực qua `Amazon Cognito`.
- Sau khi đăng nhập, frontend gọi API qua domain backend, ví dụ `api.domain.com`.
- `Amazon Route 53` phân giải `api.domain.com` về `Application Load Balancer`.
- `Application Load Balancer` chuyển request vào backend chạy trên `AWS Elastic Beanstalk`.
- Backend Node.js + Express.js xử lý đăng nhập, nghiệp vụ hệ thống, phát hành JWT, và thao tác dữ liệu.
- Backend đọc và ghi dữ liệu qua `Amazon RDS for MySQL Single-AZ`.
- Backend lưu file lên `Amazon S3` private bucket khi có chức năng upload.
- Backend gửi OTP hoặc email thông báo qua `Amazon SES`.
- Backend đọc secret từ `AWS Secrets Manager` và config từ `AWS Systems Manager Parameter Store`.
- Log và cảnh báo đi vào `Amazon CloudWatch Logs` và `CloudWatch Alarms`.

3. TẦNG DỮ LIỆU (DATA LAYER)

- `Amazon RDS for MySQL Single-AZ` là cơ sở dữ liệu chính của hệ thống.
- Dữ liệu tài sản, người dùng, phân công, lịch sử xử lý và báo cáo nghiệp vụ đều được lưu trong RDS.
- `Amazon S3` lưu tài liệu đính kèm, hình ảnh tài sản, file upload từ người dùng và static asset nếu cần.
- `AWS Secrets Manager` lưu các secret nhạy cảm như mật khẩu kết nối, khóa ứng dụng và thông tin bảo mật.
- `AWS Systems Manager Parameter Store` lưu các tham số cấu hình theo môi trường.
- `AWS Backup` có thể dùng làm lớp sao lưu tập trung cho cả `RDS` và `EC2/EBS`.

4. LUỒNG TÍCH HỢP VÀ XỬ LÝ DỮ LIỆU

- Khi người dùng tải lên tài liệu, frontend gửi request upload lên backend.
- Backend kiểm tra quyền, xác thực dữ liệu, rồi lưu file vào `Amazon S3`.
- Khi hệ thống cần gửi OTP hoặc thông báo email, backend gọi `Amazon SES` để phát thư.
- Khi cần đọc cấu hình runtime, backend lấy giá trị từ `Parameter Store`.
- Khi cần đọc secret an toàn, backend lấy từ `Secrets Manager`.
- Khi cần quản lý đăng nhập, frontend đi qua `Amazon Cognito` để xác thực người dùng.
- Khi cần xử lý báo cáo hoặc truy vết sự kiện, backend phát log vào `CloudWatch` để phục vụ giám sát.

5. KIẾN TRÚC MẠNG (NETWORK ARCHITECTURE)

- Hệ thống triển khai theo mô hình một Region.
- `Amazon Route 53` là lớp DNS đầu vào cho cả frontend và backend.
- `AWS Amplify Hosting` phục vụ frontend public.
- `Application Load Balancer` phục vụ API backend.
- `AWS Certificate Manager` cấp chứng chỉ TLS cho `app.domain.com` và `api.domain.com`.
- `RDS` đặt trong private subnet để không truy cập trực tiếp từ Internet.
- EC2 của backend cũng nằm trong private subnet hoặc môi trường quản lý tương đương của `Elastic Beanstalk`.
- Luồng vào của ứng dụng đi theo hướng: `User -> Route 53 -> Amplify` và `User -> Route 53 -> ALB -> Backend`.
- Luồng ra của backend đi tới `RDS`, `S3`, `SES`, `Secrets Manager`, `Parameter Store` và `CloudWatch`.

6. KHẢ NĂNG MỞ RỘNG VÀ KHẢ NĂNG KHÔI PHỤC (SCALABILITY & RECOVERY)

- Giai đoạn hiện tại ưu tiên chi phí thấp nên backend chạy 1 instance và `RDS` ở chế độ `Single-AZ`.
- Khi tải tăng, backend có thể mở rộng bằng cách tăng số instance hoặc bật `Auto Scaling` cho `Elastic Beanstalk`.
- Database có thể scale theo chiều dọc bằng cách tăng cấu hình instance class hoặc chuyển sang `Multi-AZ` ở giai đoạn sau.
- Dữ liệu quan trọng có thể được bảo vệ bằng `AWS Backup`, snapshot định kỳ và chính sách lưu giữ phù hợp.
- Nếu cần production mạnh hơn, có thể bổ sung `Multi-AZ`, `Auto Scaling`, và cơ chế HA cao hơn.

7. BẢO MẬT (SECURITY ARCHITECTURE)

- Người dùng truy cập hệ thống qua `HTTPS`.
- `AWS Certificate Manager` cấp và quản lý chứng chỉ TLS cho frontend và backend.
- Backend không public trực tiếp ra Internet, mà chỉ nhận request qua `ALB`.
- `RDS` nằm trong private subnet và chỉ cho phép backend kết nối qua security group.
- Secret không hardcode trong source code mà được lưu ở `Secrets Manager`.
- Config môi trường được tách riêng trong `Parameter Store` hoặc biến môi trường của nền tảng.
- File upload được kiểm soát qua backend và `S3` private bucket.
- Luồng đăng nhập được tách sang `Amazon Cognito`, giảm bớt gánh nặng tự quản lý mật khẩu ở lớp ứng dụng.

8. GIÁM SÁT VÀ VẬN HÀNH (MONITORING & OPERATIONS)

- Các log vận hành được đẩy về `Amazon CloudWatch Logs`.
- `CloudWatch Alarms` theo dõi các ngưỡng như CPU cao, lỗi backend, hoặc trạng thái bất thường.
- `AWS CloudTrail` ghi lại hoạt động quản trị và truy vết thay đổi tài nguyên AWS.
- `AWS Systems Manager Session Manager` hỗ trợ quản trị máy an toàn, không cần SSH public.
- Các cảnh báo có thể được mở rộng qua `SNS` nếu cần thông báo cho đội vận hành.

9. KẾT LUẬN TỔNG QUAN KIẾN TRÚC
   Tóm lại, kiến trúc AWS của dự án Enterprise Asset Management theo sơ đồ cũ được thiết kế theo mô hình ứng dụng web tách lớp và có `Route 53` làm điểm phân giải DNS trung tâm. Frontend React được host trên `AWS Amplify Hosting`, xác thực người dùng đi qua `Amazon Cognito`, backend Node.js + Express.js chạy sau `Application Load Balancer` và `AWS Elastic Beanstalk`, còn dữ liệu tập trung ở `Amazon RDS for MySQL`. Các thành phần hỗ trợ như `Amazon S3`, `Amazon SES`, `Secrets Manager`, `Parameter Store`, `CloudWatch`, `CloudTrail` và `Session Manager` giúp hệ thống vận hành ổn định, bảo mật và có khả năng mở rộng theo từng giai đoạn.

Em xin kết thúc phần trình bày. Kính mong nhận được ý kiến đóng góp của anh/chị và mọi người.
