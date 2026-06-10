import { createContext, useContext, useState, useEffect } from 'react'

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
  "Sơ đồ mặt bằng": "Locations",
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
  "ngày": "days",
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
  "giờ": "hours",

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
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('eam_locale') || 'vi'
  })

  useEffect(() => {
    localStorage.setItem('eam_locale', locale)
  }, [locale])

  const t = (key) => {
    if (!key) return ''
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key]
    }
    if (locale === 'en' && fallbackDictionary[key]) {
      return fallbackDictionary[key]
    }
    return translations['vi'][key] || key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
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
