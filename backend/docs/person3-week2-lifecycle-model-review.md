# Person 3 - Đánh Giá Mô Hình Vòng Đời Tài Sản Tuần 2

## Phạm Vi

Đánh giá mô hình dữ liệu cốt lõi của Person 2 (`Department`, `Employee`,
`AssetCategory` và `Asset`) dựa trên các quy trình phân bổ, bảo trì, kiểm kê và
báo cáo do Person 3 phụ trách.

## Kết Luận

Mô hình Prisma hiện tại tương thích với các quy trình vòng đời tài sản trong
phạm vi MVP. Các trạng thái và quan hệ của tài sản cung cấp đủ dữ liệu tối thiểu
để triển khai phân bổ, bảo trì, kiểm kê và báo cáo tổng hợp.

Các vấn đề dưới đây cần được xử lý hoặc được nhóm chấp thuận rõ ràng trước khi
triển khai môi trường production.

## Kết Quả Đánh Giá

| Mức ưu tiên | Vấn đề | Ảnh hưởng đến vòng đời tài sản | Khuyến nghị |
| --- | --- | --- | --- |
| Cao | Cơ sở dữ liệu chưa đảm bảo mỗi tài sản chỉ có một bản ghi phân bổ `ACTIVE`. | Các yêu cầu phân bổ hoặc chuyển giao đồng thời có thể tạo ra thông tin người sở hữu mâu thuẫn. | Duy trì các thao tác phân bổ trong transaction và khóa/kiểm tra tài sản. Cân nhắc trường hoặc bảng lưu phân bổ hiện tại nếu cần đảm bảo ở cấp cơ sở dữ liệu. |
| Cao | Phòng ban của tài sản được suy ra từ phân bổ đang hoạt động; `Asset` chưa có phòng ban sở hữu hoặc vị trí. | Tài sản chưa được phân bổ không thể xuất hiện chính xác trong báo cáo hoặc phiên kiểm kê theo phòng ban. | Xác nhận báo cáo theo phòng ban có nghĩa là phòng ban của nhân viên đang nhận tài sản. Nếu không, thêm quan hệ phòng ban sở hữu hoặc vị trí vào `Asset`. |
| Trung bình | `InventoryItem` chưa có ràng buộc duy nhất trên `(sessionId, assetId)`. | Một tài sản có thể bị tính nhiều lần trong cùng một phiên kiểm kê. | Thêm `@@unique([sessionId, assetId])`. |
| Trung bình | Các khóa ngoại và trạng thái của quy trình chưa có index phục vụ truy vấn. | Truy vấn lịch sử, bảo trì đang mở, kiểm kê và báo cáo sẽ chậm khi dữ liệu tăng. | Thêm các index được đề xuất bên dưới trước khi triển khai production. |
| Trung bình | `status` của nhân viên là chuỗi tự do. | Giá trị không hợp lệ có thể vượt qua logic vòng đời vốn kiểm tra trạng thái `ACTIVE`. | Thay bằng enum như `ACTIVE`, `INACTIVE`, hoặc đảm bảo mọi thao tác ghi đều được kiểm tra nhất quán. |
| Thấp | `serialNumber` chưa có ràng buộc duy nhất. | Có thể tạo nhiều bản ghi cho cùng một thiết bị vật lý. | Xác nhận quy tắc nghiệp vụ và thêm ràng buộc duy nhất nếu số serial bắt buộc không trùng. |
| Thấp | Yêu cầu bảo trì chưa lưu thời điểm hoàn tất hoặc hủy riêng biệt. | Báo cáo kiểm toán chỉ có thể suy ra thời điểm thay đổi từ `updatedAt`. | Thêm các trường thời gian vòng đời cụ thể nếu cần báo cáo kiểm toán chi tiết. |

## Index Và Ràng Buộc Được Khuyến Nghị

Các thay đổi dưới đây nên được đưa vào migration sau khi Person 2 xác nhận ý
nghĩa của báo cáo và khả năng tương thích:

```prisma
model AssetAssignment {
  // các trường hiện có
  @@index([assetId, status])
  @@index([employeeId, status])
  @@index([assignedAt])
}

model MaintenanceRequest {
  // các trường hiện có
  @@index([assetId, status])
  @@index([requesterId, status])
  @@index([createdAt])
}

model InventorySession {
  // các trường hiện có
  @@index([departmentId, status])
}

model InventoryItem {
  // các trường hiện có
  @@unique([sessionId, assetId])
  @@index([assetId])
}
```

## Danh Sách Kiểm Tra Khả Năng Tương Thích

- Phân bổ: hỗ trợ luồng `AVAILABLE -> ASSIGNED -> AVAILABLE`.
- Chuyển giao: đóng phân bổ cũ và tạo phân bổ đang hoạt động mới.
- Bảo trì: hỗ trợ luồng `BROKEN/PENDING -> MAINTENANCE -> ASSIGNED hoặc
  AVAILABLE`.
- Kiểm kê: hỗ trợ phiên kiểm kê và kết quả theo từng tài sản.
- Báo cáo theo danh mục: hỗ trợ trực tiếp thông qua `Asset.categoryId`.
- Báo cáo theo phòng ban: chỉ hỗ trợ bằng cách kết nối phân bổ đang hoạt động
  với phòng ban hiện tại của nhân viên.
- An toàn khi xóa: các quan hệ hạn chế xóa giúp bảo toàn lịch sử vòng đời.

## Các Quyết Định Cần Bàn Giao

1. Xác nhận "phòng ban của tài sản" là phòng ban của người đang nhận tài sản hay
   phòng ban sở hữu/vị trí cố định.
2. Xác nhận số serial có bắt buộc duy nhất hay không.
3. Lên lịch bổ sung các index và ràng buộc duy nhất cho kiểm kê trước khi triển
   khai production.
4. Đảm bảo các thao tác phân bổ, thu hồi, chuyển giao và thay đổi trạng thái bảo
   trì tiếp tục được thực hiện nguyên tử bằng Prisma transaction.
