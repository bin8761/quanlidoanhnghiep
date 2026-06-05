export const employeeAssets = [
  {
    id: 1,
    code: 'LT-0248',
    name: 'Dell Latitude 5440',
    category: 'Laptop',
    assignedAt: '04/06/2026',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    serial: 'DL5440-8K2M19',
  },
  {
    id: 2,
    code: 'MN-0131',
    name: 'Dell P2422H',
    category: 'Màn hình',
    assignedAt: '04/06/2026',
    condition: 'Tốt',
    status: 'Đang sử dụng',
    serial: 'P2422H-31F08',
  },
  {
    id: 3,
    code: 'KB-0084',
    name: 'Logitech K380',
    category: 'Phụ kiện',
    assignedAt: '12/01/2026',
    condition: 'Khá',
    status: 'Đang sử dụng',
    serial: 'K380-92084',
  },
]

export const initialEmployeeRequests = [
  {
    id: 1,
    code: 'MR-1029',
    asset: 'LT-0248',
    issue: 'Pin sạc chậm và nhanh hết',
    createdAt: '03/06/2026',
    status: 'Đang xử lý',
    priority: 'Trung bình',
  },
  {
    id: 2,
    code: 'MR-0987',
    asset: 'MN-0131',
    issue: 'Màn hình chớp trong vài giây khi khởi động',
    createdAt: '18/05/2026',
    status: 'Hoàn thành',
    priority: 'Thấp',
  },
]

export const employeeProfile = {
  employeeCode: 'EMP004',
  fullName: 'Active User Employee',
  email: 'active.employee@company.local',
  department: 'Phòng Kỹ thuật',
  position: 'Kỹ sư phần mềm',
  phone: '090 123 4567',
  joinedAt: '15/08/2024',
}
