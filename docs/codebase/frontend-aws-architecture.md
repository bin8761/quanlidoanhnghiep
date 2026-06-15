# Frontend AWS Architecture

## Mục tiêu

Frontend của hệ thống Enterprise Asset Management là một React SPA. Yêu cầu chính là:

- triển khai đơn giản
- chi phí thấp
- ít vận hành
- vẫn đáp ứng hợp lý 6 trụ cột AWS Well-Architected

Phần tổng thể ghép FE + BE được ghi ở `docs/codebase/fullstack-aws-final-architecture.md`.
Giai đoạn test/demo nội bộ hiện tại dùng URL mặc định của AWS, chưa cần mua domain riêng.

## Kiến trúc được chốt

### Thành phần chính

- `AWS Amplify Hosting` để host và deploy frontend
- `Amazon Route 53` để quản lý domain
- `AWS Certificate Manager` để cấp chứng chỉ TLS/HTTPS
- `Amazon Cognito` để xác thực người dùng nếu FE cần đăng nhập
- `Amazon S3` để lưu file upload hoặc tài nguyên tĩnh nếu cần

### Luồng triển khai

1. Source code frontend được đẩy lên repository.
2. `AWS Amplify Hosting` tự build và deploy ứng dụng.
3. `Amazon Route 53` trỏ domain về ứng dụng Amplify.
4. `AWS Certificate Manager` cung cấp HTTPS cho domain custom.
5. `Amazon Cognito` phục vụ luồng xác thực nếu ứng dụng cần đăng nhập.
6. `Amazon S3` phục vụ file upload hoặc tài nguyên tĩnh nếu cần.

## Vì sao chọn kiến trúc này

- FE là ứng dụng tĩnh sau khi build, nên không cần `Application Load Balancer`, `Amazon EC2`, `Amazon ECS`, hay database.
- `AWS Amplify Hosting` phù hợp với React SPA, có CI/CD tích hợp sẵn, giảm công vận hành.
- `Amazon Route 53` và `AWS Certificate Manager` là lớp tối thiểu để có domain và HTTPS chuẩn.
- `Amazon Cognito` và `Amazon S3` chỉ được dùng khi ứng dụng có yêu cầu auth hoặc upload/static assets.
- Phương án này giữ chi phí thấp hơn đáng kể so với việc dựng một lớp compute riêng cho FE.

## Đáp ứng 6 trụ cột AWS

### 1. Operational Excellence

- Deploy tự động từ repository.
- Dễ rollback theo version build.
- Ít thành phần nên ít điểm lỗi vận hành.

### 2. Security

- HTTPS bằng `AWS Certificate Manager`.
- Không expose compute public cho FE.
- Không cần mở security group cho web server vì không có web server riêng.
- Có thể thêm `AWS WAF` sau nếu hệ thống public-facing cần hardening thêm.

### 3. Reliability

- `AWS Amplify Hosting` là dịch vụ managed.
- Không phụ thuộc vào một instance đơn lẻ.
- Static delivery giúp giảm rủi ro hỏng runtime.

### 4. Performance Efficiency

- Nội dung frontend được phục vụ tối ưu cho SPA.
- Amplify sử dụng lớp phân phối toàn cầu ở phía sau, phù hợp với truy cập đa vùng.

### 5. Cost Optimization

- Không trả chi phí cho server compute luôn bật.
- `ACM` public certificate dùng với dịch vụ tích hợp là miễn phí.
- `Route 53` chỉ tốn phí hosted zone và query.
- Amplify tính theo mức sử dụng.

### 6. Sustainability

- Kiến trúc tĩnh, ít compute.
- Giảm tài nguyên luôn chạy 24/7.
- Cache và delivery managed giúp giảm lãng phí tài nguyên.

## Tài chính ước lượng

Ước lượng thấp nhất cho giai đoạn đầu:

- `AWS Certificate Manager`: `0 USD` cho public certificate tích hợp với AWS services
- `Amazon Route 53`: khoảng `0.50 USD / tháng` cho mỗi hosted zone trong 25 hosted zones đầu tiên
- `AWS Amplify Hosting`: trả theo sử dụng

### Ghi chú về chi phí Amplify

AWS mô tả Amplify Hosting là pay-as-you-go. Chi phí thực tế phụ thuộc vào:

- dung lượng được phục vụ
- số lần build/deploy
- branch preview nếu có

Với app nhỏ hoặc traffic thấp, tổng chi phí thường rất thấp. Với app lớn hơn, chi phí sẽ tăng theo mức phục vụ và build. AWS có ví dụ chi phí hosting khoảng `65.98 USD/tháng` cho một kịch bản mẫu 10,000 DAU, nhưng đó chỉ là ví dụ tham khảo, không phải mức mặc định cho mọi app.

## Không dùng cho FE

Không đưa các dịch vụ sau vào kiến trúc FE:

- `Amazon EC2`
- `Application Load Balancer`
- `Amazon ECS`
- `Amazon EKS`
- `Amazon RDS`

Lý do: FE là SPA tĩnh, không cần lớp ứng dụng server-side riêng.

## Khuyến nghị triển khai

- Giữ FE là build artifact tĩnh.
- Dùng `Amplify` để quản lý build và deploy.
- Dùng `Route 53` + `ACM` cho custom domain và HTTPS.
- Chỉ thêm `AWS WAF` khi có yêu cầu bảo mật public-facing cụ thể.

## Kết luận

Kiến trúc FE tối ưu hiện tại là:

`Amazon Route 53` -> `AWS Amplify Hosting` -> React SPA

với `AWS Certificate Manager` cho TLS/HTTPS, và `Amazon Cognito` / `Amazon S3` khi có nhu cầu chức năng tương ứng.

Đây là phương án đơn giản nhất, rẻ, và đủ tốt cho giai đoạn hiện tại.
