/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react'

const translations = {
  vi: {
    // Settings & Global
    settings: 'Cài đặt',
    general: 'Chung',
    security: 'Bảo mật',
    faq: 'Câu hỏi thường gặp (FAQ)',
    feedback: 'Góp ý & Phản hồi',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    selectLanguage: 'Chọn ngôn ngữ',
    darkMode: 'Chế độ tối',
    lightMode: 'Chế độ sáng',
    save: 'Lưu thay đổi',
    cancel: 'Hủy',
    history: 'Lịch sử',
    search: 'Tìm kiếm',
    all: 'Tất cả',
    submit: 'Gửi',
    loading: 'Đang tải...',
    
    // Attendance widget
    attendanceToday: 'Chấm công hôm nay',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    checkedInAt: 'Check-In lúc',
    checkedOutAt: 'Check-Out lúc',
    totalHours: 'Tổng giờ làm',
    attendanceHistory: 'Lịch sử chấm công',
    noAttendanceData: 'Không có dữ liệu chấm công cho khoảng thời gian này.',

    // FAQ Management
    faqManagement: 'Quản lý FAQ',
    addFaq: 'Thêm FAQ',
    editFaq: 'Sửa FAQ',
    deleteFaq: 'Xóa FAQ',
    question: 'Câu hỏi',
    answer: 'Câu trả lời',
    category: 'Danh mục',
    status: 'Trạng thái',
    show: 'Hiển thị',
    hide: 'Ẩn',
    searchFaq: 'Tìm kiếm câu hỏi...',
    faqDeletedSuccess: 'Đã xóa câu hỏi thành công',
    faqSavedSuccess: 'Đã lưu câu hỏi thành công',

    // Feedback
    feedbackPortal: 'Cổng góp ý & phản hồi',
    feedbackHistory: 'Lịch sử góp ý',
    newFeedback: 'Gửi góp ý mới',
    title: 'Tiêu đề',
    content: 'Nội dung',
    type: 'Loại góp ý',
    priority: 'Độ ưu tiên',
    attachment: 'Tài liệu đính kèm',
    statusPending: 'Chờ xử lý',
    statusProcessing: 'Đang xử lý',
    statusResolved: 'Đã xử lý',
    statusCompleted: 'Đã xử lý',
    statusRejected: 'Từ chối',
    typeBug: 'Lỗi hệ thống',
    typeFeature: 'Đề xuất tính năng',
    typeUI: 'Giao diện & Trải nghiệm',
    typeOther: 'Góp ý khác',
    priorityLow: 'Thấp',
    priorityMedium: 'Trung bình',
    priorityHigh: 'Cao',
    feedbackSuccess: 'Gửi góp ý thành công!',

    // Login History
    loginHistory: 'Lịch sử đăng nhập',
    time: 'Thời gian',
    ipAddress: 'Địa chỉ IP',
    browser: 'Trình duyệt',
    os: 'Hệ điều hành',
    device: 'Thiết bị',
    loginStatus: 'Trạng thái đăng nhập',
    loginSuccess: 'Thành công',
    loginFailed: 'Thất bại',
  },
  en: {
    // Settings & Global
    settings: 'Settings',
    general: 'General',
    security: 'Security',
    faq: 'FAQs',
    feedback: 'Feedback & Suggestions',
    theme: 'Theme',
    language: 'Language',
    selectLanguage: 'Select Language',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    save: 'Save Changes',
    cancel: 'Cancel',
    history: 'History',
    search: 'Search',
    all: 'All',
    submit: 'Submit',
    loading: 'Loading...',

    // Attendance widget
    attendanceToday: 'Attendance Today',
    checkIn: 'Check-In',
    checkOut: 'Check-Out',
    checkedInAt: 'Checked-In at',
    checkedOutAt: 'Checked-Out at',
    totalHours: 'Total Hours',
    attendanceHistory: 'Attendance History',
    noAttendanceData: 'No attendance data found for this period.',

    // FAQ Management
    faqManagement: 'FAQ Management',
    addFaq: 'Add FAQ',
    editFaq: 'Edit FAQ',
    deleteFaq: 'Delete FAQ',
    question: 'Question',
    answer: 'Answer',
    category: 'Category',
    status: 'Status',
    show: 'Show',
    hide: 'Hide',
    searchFaq: 'Search questions...',
    faqDeletedSuccess: 'FAQ deleted successfully',
    faqSavedSuccess: 'FAQ saved successfully',

    // Feedback
    feedbackPortal: 'Feedback & Suggestion Portal',
    feedbackHistory: 'Feedback History',
    newFeedback: 'Submit New Feedback',
    title: 'Title',
    content: 'Content',
    type: 'Feedback Type',
    priority: 'Priority',
    attachment: 'Attachment',
    statusPending: 'Pending',
    statusProcessing: 'Processing',
    statusResolved: 'Resolved',
    statusCompleted: 'Completed',
    statusRejected: 'Rejected',
    typeBug: 'System Bug',
    typeFeature: 'Feature Proposal',
    typeUI: 'UI & UX',
    typeOther: 'Other Feedback',
    priorityLow: 'Low',
    priorityMedium: 'Medium',
    priorityHigh: 'High',
    feedbackSuccess: 'Feedback submitted successfully!',

    // Login History
    loginHistory: 'Login History',
    time: 'Time',
    ipAddress: 'IP Address',
    browser: 'Browser',
    os: 'Operating System',
    device: 'Device',
    loginStatus: 'Login Status',
    loginSuccess: 'Success',
    loginFailed: 'Failed',
  }
}

const fallbackDictionary = {
  // Sidebar & Navigation
  "Tổng quan": "Dashboard",
  "Tài sản": "Assets",
  "Danh mục": "Categories",
  "Nhân viên": "Employees",
  "Phòng ban": "Departments",
  "Bàn giao": "Assignments",
  "Bảo trì": "Maintenance",
  "Kiểm kê": "Inventory",
  "Báo cáo": "Reports",
  "Sơ đồ mặt bằng": "Floor Plans",
  "Quản lý FAQ": "FAQ Management",
  "Góp ý & Phản hồi": "Feedback & Suggestions",
  "Lịch sử chấm công": "Attendance History",
  "Lịch sử đăng nhập": "Login History",
  "Cài đặt": "Settings",
  "Cài đặt hệ thống": "System Settings",
  "Tài sản của tôi": "My Assets",
  "Yêu cầu hỗ trợ": "Support Requests",
  "Hồ sơ cá nhân": "My Profile",
  "Đổi mật khẩu": "Change Password",
  "Lịch sử": "History",
  "Lịch sử hoạt động": "Activity History",
  "Hỏi đáp (FAQ)": "FAQ Support",
  "Không gian quản trị": "Administration space",
  "Không gian cá nhân": "Personal space",
  "Cổng thông tin nhân viên": "Employee Portal",
  "Cổng thông tin quản trị": "Admin Portal",
  "Đăng xuất": "Logout",
  "Quản trị viên": "Administrator",
  "Quét mã QR": "Scan QR Code",
  "Tìm kiếm nhanh...": "Quick Search...",
  "Hệ thống hoạt động": "System Active",
  "Đã đồng bộ": "Synced",
  "Đang đồng bộ": "Syncing",
  "Mất kết nối": "Disconnected",
  "Thông báo": "Notifications",
  "Không có thông báo mới": "No new notifications",
  "Đánh dấu tất cả đã đọc": "Mark all as read",
  "Tất cả đã đọc": "All read",
  "Chưa có thông báo.": "No notifications yet.",
  "Đi tới chức năng": "Go to Feature",
  "Tìm nhanh một khu vực trong không gian quản trị.": "Quickly find an area in the administration space.",
  "Nhập tên chức năng...": "Enter feature name...",
  "Không tìm thấy chức năng phù hợp.": "No matching features found.",

  // Dashboard & Widget Texts
  "Dữ liệu đã cập nhật": "Data updated",
  "Chấm công hôm nay": "Attendance Today",
  "Đang làm việc": "Working",
  "Chưa Check-In": "Not Checked-In",
  "Chưa check-in": "Not Checked-In",
  "Hoàn thành": "Completed",
  "Tổng giờ làm": "Total Hours",
  "Chấm công tuần này": "Attendance this week",
  "Tổng số tài sản": "Total Assets",
  "Đang sử dụng": "In Use",
  "Sẵn sàng sử dụng": "Available",
  "Đang bảo trì/hỏng": "In Maintenance/Broken",
  "Thống kê tổng hợp": "Summary Statistics",
  "Phân bổ theo trạng thái": "Allocation by Status",
  "Ngày xuất báo cáo": "Report Export Date",
  "Tỷ lệ sử dụng": "Utilization Rate",
  "Tỷ lệ khả dụng": "Availability Rate",
  "Yêu cầu bảo trì": "Maintenance Requests",

  // Profile & general labels
  "Họ và tên": "Full Name",
  "Ảnh đại diện": "Avatar",
  "Số điện thoại": "Phone Number",
  "Email cá nhân": "Personal Email",
  "Ngày sinh": "Date of Birth",
  "Giới tính": "Gender",
  "Địa chỉ thường trú": "Permanent Address",
  "Địa chỉ hiện tại": "Current Address",
  "Liên hệ khẩn cấp": "Emergency Contact",
  "Trình độ học vấn": "Education Level",
  "Kỹ năng": "Skills",
  "Chứng chỉ": "Certificates",
  "Quê quán": "Hometown",
  "Dân tộc": "Ethnicity",
  "Quốc tịch": "Nationality",
  "Số CCCD": "ID Card Number",
  "Quyền tự cập nhật hồ sơ": "Profile self-update permission",
  "Chức vụ": "Position",
  "Trạng thái nhân viên": "Employee Status",
  "Ngày vào làm": "Join Date",
  "Đang hoạt động": "Active",
  "Ngừng hoạt động": "Inactive",
  "Chưa cập nhật": "Not updated",
  "Quyền tự cập nhật thông tin cá nhân của bạn đã bị khóa bởi Quản trị viên. Bạn chỉ có thể xem dữ liệu.": "Your permission to self-update personal profile has been locked by the Administrator. You can only view the data.",
  "Thông tin nhân sự": "Personnel Info",
  "Mã nhân viên": "Employee Code",
  "Email công ty": "Company Email",
  "Trạng thái": "Status",
  "Vị trí & Tổ chức": "Position & Organization",
  "Vai trò hệ thống": "System Role",
  "Quản trị viên (Admin)": "Administrator (Admin)",
  "Nhân viên (User)": "Employee (User)",
  "Thông tin công việc": "Job Information",
  "Thông tin cá nhân": "Personal Info",
  "Sơ yếu lý lịch": "Resume / CV",
  "Tài liệu & Đính kèm": "Documents & Attachments",
  "Lịch sử cập nhật": "Update History",
  "Tải lên tài liệu đính kèm thành công.": "Uploaded attachment successfully.",
  "Lỗi tải lên tài liệu đính kèm.": "Error uploading attachment.",
  "Bạn có chắc chắn muốn xóa tài liệu đính kèm này?": "Are you sure you want to delete this attachment?",
  "Xóa tài liệu đính kèm thành công.": "Deleted attachment successfully.",
  "Lỗi xóa tài liệu đính kèm.": "Error deleting attachment.",
  "Đang tải thông tin hồ sơ...": "Loading profile information...",
  "Đã xảy ra lỗi": "An error occurred",
  "Nhật ký chấm công": "Attendance Log",
  "Theo dõi toàn bộ lịch sử chấm công Check-In và Check-Out hàng ngày của bạn.": "Track your daily Check-In and Check-Out attendance history.",
  "Số giờ làm việc": "Working hours",

  // Settings page
  "Tùy chỉnh hệ thống & hỗ trợ": "System Customization & Support",
  "Quản lý giao diện, ngôn ngữ, xem câu hỏi thường gặp hoặc gửi phản hồi góp ý.": "Manage theme, language, view FAQs or submit feedback and suggestions.",
  "Thay đổi giao diện sáng tối phù hợp với bạn.": "Change light/dark mode theme to fit your preference.",
  "Chuyển đổi ngôn ngữ hiển thị trên toàn bộ trang web.": "Switch the displayed language across the entire website.",
  "Không tìm thấy câu hỏi phù hợp.": "No matching questions found.",
  "Chọn file đính kèm": "Choose attachment file",
  "Chưa chọn file nào": "No file chosen",
  "Bạn chưa gửi góp ý nào.": "You have not submitted any feedback.",
  "Không có lịch sử đăng nhập nào được ghi lại.": "No login history recorded."
  ,
  // Shared layouts and settings
  "Đóng menu": "Close menu",
  "Mở menu": "Open menu",
  "Điều hướng quản trị": "Admin navigation",
  "Điều hướng nhân viên": "Employee navigation",
  "Tìm kiếm": "Search",
  "Chuyển sang tiếng Anh": "Switch to English",
  "Chuyển sang tiếng Việt": "Switch to Vietnamese",
  "Chuyển sang chế độ sáng": "Switch to light mode",
  "Chuyển sang chế độ tối": "Switch to dark mode",
  "Cá nhân hóa cách không gian làm việc hiển thị trên thiết bị của bạn.": "Personalize how your workspace appears on this device.",
  "Chọn độ sáng phù hợp với môi trường làm việc.": "Choose the appearance that best fits your environment.",
  "Sáng rõ, phù hợp ban ngày": "Bright and clear for daytime use",
  "Dịu mắt trong môi trường tối": "Comfortable viewing in low-light environments",
  "Ngôn ngữ được lưu riêng trên trình duyệt này.": "Your language preference is saved in this browser.",

  // Admin page titles and dashboard
  "Quản trị tài sản": "Asset Management",
  "Tổng quan vận hành": "Operations Overview",
  "Số liệu được tổng hợp trực tiếp từ hoạt động quản lý tài sản.": "Metrics are aggregated directly from asset management operations.",
  "Tổng tài sản": "Total Assets",
  "Đang bàn giao": "Currently Assigned",
  "Bảo trì cần xử lý": "Maintenance Pending",
  "Phiên kiểm kê": "Inventory Sessions",
  "Xem danh sách tài sản": "View asset list",
  "Quản lý người sử dụng": "Manage assignees",
  "Mở hàng đợi bảo trì": "Open maintenance queue",
  "Theo dõi tiến độ": "Track progress",
  "Hoạt động gần đây": "Recent Activity",
  "Bàn giao và kiểm kê mới nhất": "Latest assignments and inventory activity",
  "Xem lịch sử": "View history",
  "Chưa có hoạt động": "No activity yet",
  "Các lượt bàn giao và kiểm kê sẽ xuất hiện tại đây.": "Assignment and inventory activity will appear here.",
  "Trạng thái tài sản": "Asset Status",
  "Phân bổ theo dữ liệu hiện tại": "Distribution based on current data",
  "Tỷ lệ tài sản đang sử dụng": "Assets in use",
  "Xem báo cáo": "View reports",
  "Làm mới dữ liệu": "Refresh data",
  "Chào buổi sáng": "Good morning",
  "Chào buổi chiều": "Good afternoon",
  "Chào buổi tối": "Good evening",
  "Cập nhật": "Updated",

  // Core admin modules
  "Vòng đời sử dụng tài sản": "Asset Lifecycle",
  "Quản lý bàn giao": "Assignment Management",
  "Bàn giao, thu hồi, chuyển người sử dụng và truy vết toàn bộ lịch sử tài sản.": "Assign, return, transfer and trace the complete asset history.",
  "Tạo bàn giao": "Create Assignment",
  "Tổng lượt bàn giao": "Total Assignments",
  "Nhân viên đang sử dụng": "Employees Using Assets",
  "Tiếp nhận và xử lý các yêu cầu hỗ trợ, bảo trì và sự cố tài sản.": "Receive and process support, maintenance and asset incident requests.",
  "Vận hành hỗ trợ": "Support Operations",
  "Tiếp nhận, duyệt, xử lý và hoàn tất ticket theo đúng nghiệp vụ.": "Receive, approve, process and complete tickets through the proper workflow.",
  "Tạo yêu cầu": "Create Request",
  "Quản lý kiểm kê": "Inventory Management",
  "Tạo và theo dõi các phiên kiểm kê tài sản theo phòng ban.": "Create and track department asset inventory sessions.",
  "Đối soát tài sản thực tế": "Physical Asset Reconciliation",
  "Tạo đợt kiểm kê và ghi nhận tài sản đầy đủ, thiếu hoặc hư hỏng.": "Create inventory sessions and record assets as verified, missing or damaged.",
  "Tạo phiên kiểm kê": "Create Inventory Session",
  "Phân tích dữ liệu vận hành": "Operational Analytics",
  "Báo cáo tài sản": "Asset Reports",
  "KPI snapshot hiện tại, tài sản ghi nhận mới và kiểm soát chất lượng dữ liệu.": "Current KPI snapshot, newly recorded assets and data quality controls.",
  "Theo danh mục": "By Category",
  "Phòng ban sở hữu": "Owning Department",
  "Phòng ban sử dụng": "Using Department",
  "Tài sản được ghi nhận mới theo tháng": "New Assets by Month",
  "Chất lượng dữ liệu": "Data Quality",
  "Tài sản cần chuẩn hóa dữ liệu": "Assets Requiring Data Cleanup",
  "Làm mới": "Refresh",
  "Tất cả trạng thái": "All Statuses",
  "Tất cả danh mục": "All Categories",
  "Tất cả vị trí": "All Locations",
  "Sẵn sàng": "Available",
  "Đang bảo trì": "In Maintenance",
  "Bị hỏng": "Broken",
  "Thất lạc": "Lost",
  "Đã thanh lý": "Disposed",
  "Thêm sơ đồ": "Add Floor Plan",
  "Tìm sơ đồ...": "Search floor plans...",
  "Xem bản đồ": "View Map",
  "Ghim vị trí": "Pin Locations",
  "Cấu hình ghim vị trí": "Location Pinning",
  "Chưa có sơ đồ văn phòng nào": "No Office Floor Plans",
  "Thêm sơ đồ ngay": "Add a Floor Plan"
  ,
  // Shared CRUD and data tables
  "Quản lý dữ liệu": "Data Management",
  "Không tìm thấy dữ liệu": "No data found",
  "Thử thay đổi từ khóa hoặc điều kiện lọc.": "Try changing the keyword or filter conditions.",
  "Hiển thị": "Showing",
  "kết quả": "results",
  "Dữ liệu được cập nhật gần đây": "Data was updated recently",
  "Thao tác": "Actions",
  "Mô tả": "Description",
  "Tên": "Name",
  "Ngày bàn giao": "Assigned Date",
  "Ngày kết thúc": "End Date",
  "Thời gian": "Period",
  "Tiến độ": "Progress",
  "Xóa bộ lọc": "Clear Filters",
  "Xóa lọc": "Clear Filters",
  "Tất cả phòng ban": "All Departments",
  "Tất cả nhân viên": "All Employees",
  "Tất cả tài sản": "All Assets",
  "Tất cả loại": "All Types",
  "Tất cả mức": "All Priorities",
  "Chưa có mô tả": "No description",
  "Chưa xác định": "Not specified",
  "Chưa bàn giao": "Not assigned",
  "Đã bàn giao": "Assigned",
  "Đã thu hồi": "Returned",
  "Đã chuyển giao": "Transferred",
  "Đã hoàn tất": "Completed",
  "Đang xử lý": "In Progress",
  "Chờ xử lý": "Pending",
  "Chờ tiếp nhận": "Pending Review",
  "Đã duyệt": "Approved",
  "Chờ bổ sung": "Waiting for User",
  "Hoàn tất": "Completed",
  "Từ chối": "Rejected",
  "Đã hủy": "Cancelled",
  "Bản nháp": "Draft",
  "Đang kiểm kê": "Inventory in Progress",
  "Ưu tiên": "Priority",
  "Ưu tiên cao": "High Priority",
  "Thấp": "Low",
  "Trung bình": "Medium",
  "Cao": "High",
  "Loại": "Type",
  "Người yêu cầu": "Requester",
  "Nội dung": "Content",
  "Vị trí": "Location",

  // Asset, employee, category and department management
  "Quản lý tài sản": "Asset Management",
  "Danh mục tài sản doanh nghiệp": "Enterprise Asset Catalog",
  "Theo dõi thông tin, trạng thái và người đang sử dụng từng tài sản.": "Track information, status and current assignee for every asset.",
  "Nhập Excel": "Import Excel",
  "Thêm tài sản": "Add Asset",
  "Mã tài sản": "Asset Code",
  "Tên tài sản": "Asset Name",
  "Đang sử dụng bởi": "Used By",
  "Danh mục tài sản": "Asset Categories",
  "Chuẩn hóa nhóm tài sản dùng trong toàn hệ thống.": "Standardize asset groups used throughout the system.",
  "Thêm danh mục": "Add Category",
  "Tên danh mục": "Category Name",
  "Quản lý nhân viên": "Employee Management",
  "Nhân sự sử dụng tài sản": "Asset Users",
  "Quản lý hồ sơ nhân viên và liên kết với phòng ban trong doanh nghiệp.": "Manage employee profiles and their department relationships.",
  "Thêm nhân viên": "Add Employee",
  "Họ tên": "Full Name",
  "Quản lý phòng ban": "Department Management",
  "Cơ cấu doanh nghiệp": "Organization Structure",
  "Tổ chức nhân sự và tài sản theo từng đơn vị trong doanh nghiệp.": "Organize employees and assets by business unit.",
  "Thêm phòng ban": "Add Department",
  "Tên phòng ban": "Department Name",
  "Ngày cập nhật": "Updated Date",

  // Assignment, maintenance and inventory
  "Tổng yêu cầu": "Total Requests",
  "Đang mở": "Open",
  "Báo hỏng tài sản": "Report Broken Asset",
  "Yêu cầu cấp phát mới": "New Allocation Request",
  "Yêu cầu đổi tài sản": "Asset Exchange Request",
  "Yêu cầu thu hồi tài sản": "Asset Recall Request",
  "Yêu cầu cài phần mềm": "Software Installation Request",
  "Yêu cầu cấp quyền": "Access Request",
  "Yêu cầu hỗ trợ khác": "Other Support Request",
  "Không liên kết": "Not Linked",
  "Phiên đang thực hiện": "Active Sessions",
  "Tài sản đã kiểm tra": "Assets Checked",
  "Cần xử lý": "Needs Attention",
  "Tên phiên": "Session Name",

  // Reports
  "Khoảng ngày chỉ áp dụng cho biểu đồ tài sản được ghi nhận mới. KPI snapshot, phân bổ và chất lượng dữ liệu luôn phản ánh trạng thái hiện tại.": "The date range only applies to the new-assets chart. KPI snapshots, distributions and data quality always reflect the current state.",
  "tài sản có thể vận hành": "operational assets",
  "lỗi dữ liệu được phát hiện": "data issues detected",
  "Tính theo thời điểm tài sản được tạo trong hệ thống, không phải ngày mua hoặc ngày thanh lý.": "Based on when assets were created in the system, not their purchase or disposal dates.",
  "Đang sử dụng nhưng không có bàn giao": "Assigned without an active assignment",
  "Có bàn giao nhưng trạng thái không khớp": "Active assignment status mismatch",
  "Có nhiều bàn giao đang hoạt động": "Multiple active assignments",
  "Trạng thái không hợp lệ vẫn đang bàn giao": "Invalid status with active assignment",
  "Thiếu phòng ban sở hữu": "Missing owning department",
  "Thiếu vị trí cố định và vị trí người sử dụng": "Missing fixed and user locations",
  "Thiếu serial number": "Missing serial number",
  "Trùng serial number": "Duplicate serial number",
  "Trang trước": "Previous Page",
  "Trang sau": "Next Page",

  // Supporting admin modules
  "Cổng hỗ trợ & Hướng dẫn": "Support & Guidance",
  "Quản lý bộ câu hỏi thường gặp hiển thị cho nhân viên trong phần Cài đặt.": "Manage frequently asked questions displayed to employees in Settings.",
  "Thêm FAQ": "Add FAQ",
  "Tương tác & Cải tiến": "Engagement & Improvement",
  "Quản lý Góp ý & Phản hồi": "Feedback & Suggestions Management",
  "Duyệt các đề xuất tính năng, báo lỗi và phản hồi chất lượng hệ thống từ nhân viên.": "Review feature suggestions, bug reports and system quality feedback from employees.",
  "Quản lý nhân sự": "Workforce Management",
  "Kiểm tra thời gian check-in, check-out và tổng số giờ làm việc thực tế của nhân sự.": "Review employee check-in, check-out and total working hours.",
  "An ninh & Hệ thống": "Security & System",
  "Lịch sử đăng nhập hệ thống": "System Login History",
  "Ghi nhận hoạt động đăng nhập của toàn bộ tài khoản để kiểm soát an ninh thông tin.": "Track account login activity for information security oversight.",

  // Seed labels shown in filters and reports
  "Ban Giám đốc": "Executive Board",
  "Phòng bảo trì": "Maintenance Department",
  "Phòng Hành chính": "Administration Department",
  "Phòng Kinh doanh": "Sales Department",
  "Phòng kỹ thuật": "Engineering Department",
  "Phòng Kỹ thuật": "Engineering Department",
  "Phòng Marketing": "Marketing Department",
  "Phòng Nhân sự": "Human Resources Department",
  "Phòng Tài chính": "Finance Department",
  "Chuột": "Mouse",
  "Màn hình": "Monitor",
  "Máy chiếu": "Projector",
  "Máy chủ & Lưu trữ": "Servers & Storage",
  "Máy in": "Printer",
  "Thiết bị di động": "Mobile Device",
  "Thiết bị mạng": "Network Equipment",
  "Thiết bị ngoại vi": "Peripherals",
  "Thiết bị phòng họp": "Meeting Room Equipment",
  "Thiết bị văn phòng": "Office Equipment",
  "Tầng 1 - Phòng Hành chính & Kinh doanh": "Floor 1 - Administration & Sales",
  "Tầng 2 - Phòng Kỹ thuật & R&D": "Floor 2 - Engineering & R&D",
  "Bàn làm việc": "Employee Desk",
  "Thiết bị cố định": "Fixed Equipment"
  ,
  // Authentication
  "Không gian quản trị doanh nghiệp": "Enterprise Administration",
  "Chào mừng trở lại": "Welcome Back",
  "Đăng nhập để quản lý tài sản, bàn giao, bảo trì và báo cáo trong một không gian làm việc thống nhất.": "Sign in to manage assets, assignments, maintenance and reports in one unified workspace.",
  "Mật khẩu": "Password",
  "Đăng nhập hệ thống": "Sign In",
  "Đang đăng nhập...": "Signing in...",
  "Chưa có tài khoản?": "Don't have an account?",
  "Đăng ký bằng mã nhân viên": "Register with employee code",
  "Quản trị an toàn và nhất quán": "Secure and Consistent Administration",
  "Kiểm soát toàn diện tài sản doanh nghiệp.": "Complete Control of Enterprise Assets.",
  "Từ cấp phát thiết bị đến bảo trì và kiểm kê, mọi hoạt động đều được tổ chức rõ ràng để đội ngũ vận hành hiệu quả hơn.": "From equipment allocation to maintenance and inventory, every operation is organized for a more efficient team.",
  "Theo dõi toàn bộ vòng đời tài sản": "Track the Complete Asset Lifecycle",
  "Bàn giao và bảo trì tập trung": "Centralized Assignments and Maintenance",
  "Quản lý bàn giao và bảo trì tập trung": "Centralized Assignments and Maintenance",
  "Báo cáo trạng thái theo thời gian thực": "Real-time Status Reports",

  // Employee dashboard and assets
  "Không gian làm việc cá nhân": "Personal Workspace",
  "Chào bạn": "Hello",
  "Theo dõi tài sản, công việc và các yêu cầu hỗ trợ của bạn tại một nơi.": "Track your assets, tasks and support requests in one place.",
  "Tài sản đang giữ": "Assigned Assets",
  "Yêu cầu đang xử lý": "Active Requests",
  "Công việc cần làm": "Tasks to Complete",
  "Tài sản gần đây": "Recent Assets",
  "Thiết bị đang được bàn giao cho bạn": "Devices currently assigned to you",
  "Xem tất cả": "View All",
  "Bạn chưa được bàn giao tài sản nào.": "No assets have been assigned to you.",
  "Việc cần hoàn thành": "Tasks to Complete",
  "Các đầu việc liên quan đến tài sản": "Asset-related action items",
  "Không có việc cần hoàn thành.": "No tasks to complete.",
  "Thiết bị được bàn giao": "Assigned Devices",
  "Danh sách thiết bị và tài sản hiện đang được bàn giao cho bạn.": "Devices and assets currently assigned to you.",
  "Nhận ngày": "Received on",

  // Employee requests and profile
  "Trung tâm hỗ trợ": "Support Center",
  "Gửi yêu cầu, theo dõi trạng thái xử lý và lịch sử phản hồi.": "Submit requests and track their processing status and response history.",
  "Mã yêu cầu": "Request ID",
  "Phụ trách": "Assignee",
  "Chưa phân công": "Unassigned",
  "Quản lý tài khoản": "Account Management",
  "Hồ sơ nhân viên": "Employee Profile",
  "Quản lý thông tin hồ sơ cá nhân, sơ yếu lý lịch và hồ sơ chứng chỉ đính kèm.": "Manage your personal profile, resume and attached certificates.",
  "Mã NV": "Employee ID",

  // Password
  "Bảo mật tài khoản": "Account Security",
  "Cập nhật mật khẩu đăng nhập. Đảm bảo mật khẩu mới đủ mạnh và bảo mật.": "Update your sign-in password and ensure the new password is strong and secure.",
  "Mật khẩu được mã hóa và lưu trữ an toàn.": "Your password is encrypted and stored securely.",
  "Mật khẩu hiện tại": "Current Password",
  "Mật khẩu mới": "New Password",
  "Ít nhất 8 ký tự, gồm chữ và số": "At least 8 characters including letters and numbers",
  "Xác nhận mật khẩu mới": "Confirm New Password",
  "Cập nhật mật khẩu": "Update Password",
  "Nếu quên mật khẩu hiện tại, hãy liên hệ quản trị viên để được hỗ trợ.": "If you forgot your current password, contact an administrator for support.",
  "Tiếng Việt": "Vietnamese"
  ,
  // Registration and remaining interactive states
  "Quay lại đăng nhập": "Back to Sign In",
  "Đăng ký tài khoản": "Create an Account",
  "Sử dụng mã nhân viên và email công ty đã được lưu trong hệ thống để tạo tài khoản truy cập.": "Use the employee code and company email stored in the system to create your account.",
  "Xác nhận mật khẩu": "Confirm Password",
  "Tạo tài khoản": "Create Account",
  "Chuyển giao": "Transfer",
  "Thu hồi": "Return",
  "Đang được sử dụng bởi": "Currently used by",
  "Chuyển từ": "Transfer from",
  "sang người sử dụng mới.": "to a new assignee.",
  "Xóa tài liệu này?": "Delete this document?",
  "Bạn có chắc chắn muốn xóa câu hỏi FAQ này không? Hành động này không thể hoàn tác.": "Are you sure you want to delete this FAQ? This action cannot be undone.",
  "VD: Làm cách nào để đổi mật khẩu?": "Example: How do I change my password?",
  "Ghim ở": "Pinned at"
}

const LanguageContext = createContext()
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'title', 'aria-label']

function translateUiString(value) {
  if (!value || typeof value !== 'string') return value
  if (fallbackDictionary[value]) return fallbackDictionary[value]

  return Object.entries(fallbackDictionary)
    .sort(([left], [right]) => right.length - left.length)
    .reduce(
      (translated, [source, target]) => translated.includes(source)
        ? translated.split(source).join(target)
        : translated,
      value,
    )
}

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('eam_locale') === 'en' ? 'en' : 'vi'
  })

  useLayoutEffect(() => {
    localStorage.setItem('eam_locale', locale)
    document.documentElement.lang = locale
    document.documentElement.dataset.locale = locale
  }, [locale])

  useLayoutEffect(() => {
    const trackedTextNodes = new Map()
    const trackedAttributes = new Map()

    function translateTextNode(node) {
      if (!node.nodeValue?.trim()) return
      const translated = translateUiString(node.nodeValue)
      if (translated === node.nodeValue) return

      if (!trackedTextNodes.has(node)) trackedTextNodes.set(node, node.nodeValue)
      node.nodeValue = translated
    }

    function translateElementAttributes(element) {
      for (const attribute of TRANSLATABLE_ATTRIBUTES) {
        const value = element.getAttribute(attribute)
        if (!value) continue
        const translated = translateUiString(value)
        if (translated === value) continue

        if (!trackedAttributes.has(element)) trackedAttributes.set(element, new Map())
        const originals = trackedAttributes.get(element)
        if (!originals.has(attribute)) originals.set(attribute, value)
        element.setAttribute(attribute, translated)
      }
    }

    function translateTree(root) {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root)
        return
      }
      if (!(root instanceof Element)) return

      translateElementAttributes(root)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) translateTextNode(current)
        else translateElementAttributes(current)
        current = walker.nextNode()
      }
    }

    if (locale !== 'en') return undefined

    translateTree(document.body)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') translateTextNode(mutation.target)
        mutation.addedNodes.forEach(translateTree)
        if (mutation.type === 'attributes') translateElementAttributes(mutation.target)
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      trackedTextNodes.forEach((original, node) => {
        if (node.isConnected) node.nodeValue = original
      })
      trackedAttributes.forEach((attributes, element) => {
        if (!element.isConnected) return
        attributes.forEach((original, attribute) => element.setAttribute(attribute, original))
      })
    }
  }, [locale])

  const t = useCallback((key) => {
    if (!key) return ''
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key]
    }
    if (locale === 'en' && fallbackDictionary[key]) {
      return fallbackDictionary[key]
    }
    return translations['vi'][key] || key
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
