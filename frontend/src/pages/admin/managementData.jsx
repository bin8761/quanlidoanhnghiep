import StatusBadge from '../../components/ui/StatusBadge'

const statusColumn = {
  key: 'status',
  label: 'Trạng thái',
  render: (value) => <StatusBadge status={value} />,
}

export const managementPages = {
  assets: {
    title: 'Quản lý tài sản',
    description: 'Theo dõi thông tin, trạng thái và vị trí của tài sản.',
    actionLabel: 'Thêm tài sản',
    searchPlaceholder: 'Tìm theo mã hoặc tên tài sản...',
    columns: [
      { key: 'code', label: 'Mã tài sản' },
      { key: 'name', label: 'Tên tài sản' },
      { key: 'category', label: 'Danh mục' },
      { key: 'department', label: 'Phòng ban' },
      statusColumn,
    ],
    rows: [
      { id: 1, code: 'LT-0248', name: 'Dell Latitude 5440', category: 'Laptop', department: 'Kỹ thuật', status: 'ASSIGNED' },
      { id: 2, code: 'PR-0018', name: 'HP LaserJet Pro', category: 'Máy in', department: 'Hành chính', status: 'MAINTENANCE' },
      { id: 3, code: 'PJ-0007', name: 'Epson EB-X06', category: 'Máy chiếu', department: 'Kinh doanh', status: 'AVAILABLE' },
      { id: 4, code: 'MN-0131', name: 'Dell P2422H', category: 'Màn hình', department: 'Kỹ thuật', status: 'ASSIGNED' },
    ],
    formFields: [
      { name: 'code', label: 'Mã tài sản', placeholder: 'VD: LT-0249' },
      { name: 'name', label: 'Tên tài sản', placeholder: 'Nhập tên tài sản' },
      { name: 'category', label: 'Danh mục', placeholder: 'Chọn danh mục' },
    ],
  },
  categories: {
    title: 'Danh mục tài sản',
    description: 'Chuẩn hóa nhóm tài sản dùng trong toàn hệ thống.',
    actionLabel: 'Thêm danh mục',
    searchPlaceholder: 'Tìm danh mục...',
    columns: [
      { key: 'name', label: 'Tên danh mục' },
      { key: 'description', label: 'Mô tả' },
      { key: 'assetCount', label: 'Số tài sản' },
      statusColumn,
    ],
    rows: [
      { id: 1, name: 'Laptop', description: 'Máy tính xách tay nhân viên', assetCount: 86, status: 'ACTIVE' },
      { id: 2, name: 'Máy in', description: 'Máy in và thiết bị in ấn', assetCount: 24, status: 'ACTIVE' },
      { id: 3, name: 'Máy chiếu', description: 'Thiết bị trình chiếu phòng họp', assetCount: 12, status: 'ACTIVE' },
    ],
    formFields: [
      { name: 'name', label: 'Tên danh mục', placeholder: 'Nhập tên danh mục' },
      { name: 'description', label: 'Mô tả', placeholder: 'Mô tả ngắn' },
    ],
  },
  employees: {
    title: 'Quản lý nhân viên',
    description: 'Quản lý hồ sơ và tài khoản sử dụng hệ thống.',
    actionLabel: 'Thêm nhân viên',
    searchPlaceholder: 'Tìm theo mã, tên hoặc email...',
    columns: [
      { key: 'code', label: 'Mã nhân viên' },
      { key: 'name', label: 'Họ tên' },
      { key: 'email', label: 'Email' },
      { key: 'department', label: 'Phòng ban' },
      statusColumn,
    ],
    rows: [
      { id: 1, code: 'EMP001', name: 'Nguyễn Minh Anh', email: 'minhanh@company.local', department: 'Kỹ thuật', status: 'ACTIVE' },
      { id: 2, code: 'EMP002', name: 'Trần Hoàng Nam', email: 'hoangnam@company.local', department: 'Kinh doanh', status: 'ACTIVE' },
      { id: 3, code: 'EMP003', name: 'Lê Thu Trang', email: 'thutrang@company.local', department: 'Hành chính', status: 'INACTIVE' },
    ],
    formFields: [
      { name: 'code', label: 'Mã nhân viên', placeholder: 'VD: EMP005' },
      { name: 'name', label: 'Họ và tên', placeholder: 'Nhập họ tên' },
      { name: 'email', label: 'Email công ty', placeholder: 'name@company.local', type: 'email' },
    ],
  },
  departments: {
    title: 'Quản lý phòng ban',
    description: 'Tổ chức nhân sự và tài sản theo đơn vị.',
    actionLabel: 'Thêm phòng ban',
    searchPlaceholder: 'Tìm phòng ban...',
    columns: [
      { key: 'code', label: 'Mã phòng ban' },
      { key: 'name', label: 'Tên phòng ban' },
      { key: 'employees', label: 'Nhân viên' },
      { key: 'assets', label: 'Tài sản' },
      statusColumn,
    ],
    rows: [
      { id: 1, code: 'ENG', name: 'Phòng Kỹ thuật', employees: 38, assets: 74, status: 'ACTIVE' },
      { id: 2, code: 'SAL', name: 'Phòng Kinh doanh', employees: 27, assets: 41, status: 'ACTIVE' },
      { id: 3, code: 'ADM', name: 'Phòng Hành chính', employees: 16, assets: 36, status: 'ACTIVE' },
    ],
    formFields: [
      { name: 'code', label: 'Mã phòng ban', placeholder: 'VD: MKT' },
      { name: 'name', label: 'Tên phòng ban', placeholder: 'Nhập tên phòng ban' },
    ],
  },
  assignments: {
    title: 'Quản lý bàn giao',
    description: 'Theo dõi bàn giao, thu hồi và luân chuyển tài sản.',
    actionLabel: 'Tạo bàn giao',
    searchPlaceholder: 'Tìm tài sản hoặc nhân viên...',
    columns: [
      { key: 'asset', label: 'Tài sản' },
      { key: 'employee', label: 'Nhân viên' },
      { key: 'department', label: 'Phòng ban' },
      { key: 'date', label: 'Ngày bàn giao' },
      statusColumn,
    ],
    rows: [
      { id: 1, asset: 'LT-0248 - Dell Latitude', employee: 'Nguyễn Minh Anh', department: 'Kỹ thuật', date: '04/06/2026', status: 'ACTIVE' },
      { id: 2, asset: 'MN-0131 - Dell P2422H', employee: 'Trần Hoàng Nam', department: 'Kinh doanh', date: '02/06/2026', status: 'ACTIVE' },
      { id: 3, asset: 'LT-0198 - HP EliteBook', employee: 'Lê Thu Trang', department: 'Hành chính', date: '28/05/2026', status: 'RETURNED' },
    ],
    formFields: [
      { name: 'asset', label: 'Tài sản', placeholder: 'Chọn tài sản' },
      { name: 'employee', label: 'Nhân viên nhận', placeholder: 'Chọn nhân viên' },
      { name: 'date', label: 'Ngày bàn giao', type: 'date' },
    ],
  },
  maintenance: {
    title: 'Yêu cầu bảo trì',
    description: 'Tiếp nhận và xử lý sự cố tài sản.',
    actionLabel: 'Tạo yêu cầu',
    searchPlaceholder: 'Tìm mã yêu cầu hoặc tài sản...',
    columns: [
      { key: 'code', label: 'Mã yêu cầu' },
      { key: 'asset', label: 'Tài sản' },
      { key: 'issue', label: 'Sự cố' },
      { key: 'requester', label: 'Người báo' },
      statusColumn,
    ],
    rows: [
      { id: 1, code: 'MR-1032', asset: 'PR-0018', issue: 'Kẹt giấy liên tục', requester: 'Phạm Đức Long', status: 'PENDING' },
      { id: 2, code: 'MR-1029', asset: 'LT-0203', issue: 'Không sạc được pin', requester: 'Nguyễn Minh Anh', status: 'IN_PROGRESS' },
      { id: 3, code: 'MR-1024', asset: 'MN-0088', issue: 'Màn hình nhấp nháy', requester: 'Lê Thu Trang', status: 'COMPLETED' },
    ],
    formFields: [
      { name: 'asset', label: 'Mã tài sản', placeholder: 'VD: LT-0248' },
      { name: 'issue', label: 'Mô tả sự cố', placeholder: 'Mô tả tình trạng' },
    ],
  },
  inventory: {
    title: 'Phiên kiểm kê',
    description: 'Kiểm tra tài sản theo phòng ban và kỳ kiểm kê.',
    actionLabel: 'Tạo phiên kiểm kê',
    searchPlaceholder: 'Tìm phiên hoặc phòng ban...',
    columns: [
      { key: 'name', label: 'Tên phiên' },
      { key: 'department', label: 'Phòng ban' },
      { key: 'period', label: 'Thời gian' },
      { key: 'progress', label: 'Tiến độ' },
      statusColumn,
    ],
    rows: [
      { id: 1, name: 'Kiểm kê quý II/2026', department: 'Kỹ thuật', period: '01-07/06/2026', progress: '52/74', status: 'IN_PROGRESS' },
      { id: 2, name: 'Kiểm kê tháng 5/2026', department: 'Hành chính', period: '26-30/05/2026', progress: '36/36', status: 'COMPLETED' },
      { id: 3, name: 'Kiểm kê quý II/2026', department: 'Kinh doanh', period: '10-14/06/2026', progress: '0/41', status: 'DRAFT' },
    ],
    formFields: [
      { name: 'name', label: 'Tên phiên', placeholder: 'VD: Kiểm kê quý III/2026' },
      { name: 'department', label: 'Phòng ban', placeholder: 'Chọn phòng ban' },
      { name: 'date', label: 'Ngày bắt đầu', type: 'date' },
    ],
  },
  reports: {
    title: 'Báo cáo tài sản',
    description: 'Tổng hợp dữ liệu phục vụ theo dõi và ra quyết định.',
    actionLabel: 'Xuất báo cáo',
    searchPlaceholder: 'Tìm loại báo cáo...',
    columns: [
      { key: 'name', label: 'Báo cáo' },
      { key: 'scope', label: 'Phạm vi' },
      { key: 'updatedAt', label: 'Cập nhật gần nhất' },
      { key: 'owner', label: 'Phụ trách' },
      statusColumn,
    ],
    rows: [
      { id: 1, name: 'Tổng hợp tài sản', scope: 'Toàn công ty', updatedAt: '05/06/2026', owner: 'Hệ thống', status: 'COMPLETED' },
      { id: 2, name: 'Tài sản theo danh mục', scope: 'Toàn công ty', updatedAt: '05/06/2026', owner: 'Hệ thống', status: 'COMPLETED' },
      { id: 3, name: 'Tình trạng bảo trì', scope: 'Tháng 06/2026', updatedAt: '04/06/2026', owner: 'Phòng Hành chính', status: 'ACTIVE' },
    ],
    formFields: [
      { name: 'name', label: 'Tên báo cáo', placeholder: 'Chọn loại báo cáo' },
      { name: 'period', label: 'Kỳ báo cáo', placeholder: 'VD: Tháng 06/2026' },
    ],
  },
}
