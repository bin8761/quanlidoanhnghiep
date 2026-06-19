# Enterprise Asset Management - AWS Architecture Presentation

Em chào anh/chị admin và mọi người, em xin đại diện nhóm trình bày sơ bộ về kiến trúc triển khai AWS của dự án **Enterprise Asset Management**.

Dự án là một hệ thống quản lý tài sản doanh nghiệp, phục vụ hai nhóm người dùng chính là quản trị viên và nhân viên. Hệ thống cho phép đăng nhập, quản lý tài sản, phân công, thu hồi, chuyển giao, báo cáo, tải lên tệp đính kèm, gửi email OTP, và lưu trữ dữ liệu nghiệp vụ tập trung.

Về kiến trúc tổng quan, hệ thống được triển khai trên AWS theo hướng chi phí thấp, dễ vận hành, và phù hợp với giai đoạn MVP/test-demo nội bộ. Hiện tại kiến trúc chốt gồm các thành phần chính: AWS Amplify Hosting, Application Load Balancer, AWS Elastic Beanstalk, Amazon RDS for MySQL Single-AZ, Amazon S3 private bucket, Amazon SES, AWS Secrets Manager, AWS Systems Manager Parameter Store, Amazon CloudWatch, AWS CloudTrail, và AWS Systems Manager Session Manager.

Tech Stack:
* Frontend: React + Vite, build thành static asset và host trên AWS Amplify Hosting
* Backend: Node.js + Express.js, chạy trên AWS Elastic Beanstalk phía sau Application Load Balancer
* Database: Amazon RDS for MySQL Single-AZ
* Storage: Amazon S3 private bucket cho file upload và asset nội bộ
* Email: Amazon SES cho OTP và email thông báo
* Secrets/Config: AWS Secrets Manager và AWS Systems Manager Parameter Store
* Observability: Amazon CloudWatch Logs và CloudWatch Alarms
* Audit/Ops: AWS CloudTrail và AWS Systems Manager Session Manager

1. LUỒNG NGƯỜI DÙNG (USER FLOW)
* Người dùng truy cập URL mặc định của AWS Amplify Hosting.
* Frontend React được tải xuống trình duyệt.
* Người dùng đăng nhập bằng form trên frontend.
* Sau khi xác thực thành công, frontend nhận JWT từ backend và lưu phiên làm việc.
* Từ thời điểm đó, người dùng tương tác với hệ thống qua các màn hình quản lý tài sản, yêu cầu, báo cáo và cấu hình.

2. LUỒNG ỨNG DỤNG (APPLICATION FLOW)
* USER mở ứng dụng trên trình duyệt và truy cập frontend từ AWS Amplify Hosting.
* Frontend gọi API qua đường dẫn tương đối `/api`.
* AWS Amplify Hosting rewrite `/api/<*>` sang DNS name của Application Load Balancer.
* Application Load Balancer chuyển request vào backend chạy trên AWS Elastic Beanstalk.
* Backend Node.js + Express.js xử lý đăng nhập, đăng ký, quên mật khẩu, phát hành JWT và xử lý nghiệp vụ hệ thống.
* Backend đọc và ghi dữ liệu qua Amazon RDS for MySQL Single-AZ.
* Backend lưu file lên Amazon S3 private bucket khi có chức năng upload.
* Backend gửi OTP hoặc email thông báo qua Amazon SES.
* Backend đọc secret từ AWS Secrets Manager và config từ AWS Systems Manager Parameter Store.
* Log và cảnh báo đi vào Amazon CloudWatch Logs và CloudWatch Alarms.

3. TẦNG DỮ LIỆU (DATA LAYER)
* Amazon RDS for MySQL Single-AZ là cơ sở dữ liệu chính của hệ thống.
* Dữ liệu tài sản, người dùng, phân công, lịch sử xử lý và báo cáo nghiệp vụ đều được lưu trong RDS.
* Amazon S3 private bucket lưu tài liệu đính kèm, hình ảnh tài sản và file upload từ người dùng.
* AWS Secrets Manager lưu các secret nhạy cảm như mật khẩu kết nối, khóa ứng dụng và thông tin bảo mật.
* AWS Systems Manager Parameter Store lưu các tham số cấu hình không nhạy cảm hoặc ít nhạy cảm theo môi trường.
* AWS Backup có thể được dùng làm lớp sao lưu tập trung cho RDS và EC2/EBS trong giai đoạn vận hành.

4. LUỒNG TÍCH HỢP VÀ XỬ LÝ DỮ LIỆU
* Khi người dùng tải lên tài liệu, frontend gửi request upload lên backend.
* Backend kiểm tra quyền, xác thực dữ liệu, rồi lưu file vào Amazon S3.
* Khi hệ thống cần gửi OTP hoặc thông báo email, backend gọi Amazon SES để phát thư.
* Khi cần đọc cấu hình runtime, backend lấy giá trị từ Parameter Store.
* Khi cần đọc secret an toàn, backend lấy từ Secrets Manager.
* Khi cần xử lý báo cáo hoặc truy vết sự kiện, backend phát log vào CloudWatch để phục vụ giám sát.

5. KIẾN TRÚC MẠNG (NETWORK ARCHITECTURE)
* Hệ thống triển khai theo mô hình một Region.
* Frontend được host trên AWS Amplify Hosting, còn backend nằm trong AWS Elastic Beanstalk phía sau Application Load Balancer.
* RDS đặt trong private subnet để không truy cập trực tiếp từ Internet.
* EC2 của backend cũng nằm trong private subnet hoặc môi trường quản lý tương đương của Elastic Beanstalk.
* Luồng vào của ứng dụng đi theo hướng: User -> Amplify -> ALB -> Backend.
* Luồng ra của backend đi tới RDS, S3, SES, Secrets Manager, Parameter Store và CloudWatch.

6. KHẢ NĂNG MỞ RỘNG VÀ KHẢ NĂNG KHÔI PHỤC (SCALABILITY & RECOVERY)
* Giai đoạn hiện tại ưu tiên chi phí thấp nên backend chạy 1 instance và RDS ở chế độ Single-AZ.
* Khi tải tăng, backend có thể mở rộng bằng cách tăng số instance hoặc nâng cấp môi trường Elastic Beanstalk.
* Database có thể scale theo chiều dọc bằng cách tăng cấu hình instance class hoặc chuyển sang Multi-AZ ở giai đoạn sau.
* Dữ liệu quan trọng có thể được bảo vệ bằng AWS Backup, snapshot định kỳ và chính sách lưu giữ phù hợp.
* Nếu cần production mạnh hơn, có thể bổ sung Multi-AZ, Auto Scaling, và các cơ chế HA cao hơn.

7. BẢO MẬT (SECURITY ARCHITECTURE)
* Người dùng truy cập hệ thống qua HTTPS.
* Backend không public trực tiếp ra Internet, mà chỉ nhận request qua ALB.
* RDS nằm trong private subnet và chỉ cho phép backend kết nối qua security group.
* Secret không hardcode trong source code mà được lưu ở Secrets Manager.
* Config môi trường được tách riêng trong Parameter Store hoặc biến môi trường của nền tảng.
* File upload được kiểm soát qua backend và S3 private bucket, không cấp quyền ghi trực tiếp rộng rãi cho client.
* Hiện tại auth của hệ thống là JWT-only, backend tự quản lý user/password, chưa dùng Amazon Cognito trong phase demo nội bộ.

8. GIÁM SÁT VÀ VẬN HÀNH (MONITORING & OPERATIONS)
* Các log vận hành được đẩy về Amazon CloudWatch Logs.
* CloudWatch Alarms theo dõi các ngưỡng như CPU cao, lỗi backend, hoặc trạng thái bất thường.
* AWS CloudTrail ghi lại hoạt động quản trị và truy vết thay đổi tài nguyên AWS.
* AWS Systems Manager Session Manager hỗ trợ quản trị máy an toàn, không cần SSH public.
* Các cảnh báo có thể được mở rộng qua SNS nếu cần thông báo cho đội vận hành.

9. KẾT LUẬN TỔNG QUAN KIẾN TRÚC
Tóm lại, kiến trúc AWS của dự án Enterprise Asset Management được thiết kế theo mô hình ứng dụng web tách lớp, trong đó frontend React được host trên AWS Amplify Hosting, backend Node.js + Express.js chạy sau Application Load Balancer và AWS Elastic Beanstalk, còn dữ liệu tập trung ở Amazon RDS for MySQL. Các thành phần hỗ trợ như Amazon S3, Amazon SES, Secrets Manager, Parameter Store, CloudWatch, CloudTrail và Session Manager giúp hệ thống vận hành ổn định, bảo mật và dễ mở rộng theo từng giai đoạn.

Kiến trúc này ưu tiên đúng nhu cầu hiện tại của dự án: chi phí thấp, dễ triển khai, dễ bảo trì, và đủ rõ ràng để team có thể đi từ môi trường demo nội bộ lên production trong các giai đoạn sau.

Em xin kết thúc phần trình bày. Kính mong nhận được ý kiến đóng góp của anh/chị và mọi người.
