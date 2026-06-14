const HEADER_ALIASES = {
  assetCode: ['ma_tai_san', 'mã_tài_sản', 'asset_code', 'assetcode'],
  name: ['ten_tai_san', 'tên_tài_sản', 'asset_name', 'name'],
  category: ['danh_muc', 'danh_mục', 'category', 'category_id'],
  ownerDepartment: ['phong_ban_so_huu', 'phòng_ban_sở_hữu', 'department', 'owner_department'],
  serialNumber: ['so_serial', 'số_serial', 'serial', 'serial_number'],
  purchaseDate: ['ngay_mua', 'ngày_mua', 'purchase_date'],
  value: ['gia_tri', 'giá_trị', 'value'],
  status: ['trang_thai', 'trạng_thái', 'status'],
  notes: ['ghi_chu', 'ghi_chú', 'notes'],
  employeeCode: ['ma_nhan_vien', 'mã_nhân_viên', 'employee_code', 'employeecode'],
  fullName: ['ho_va_ten', 'họ_và_tên', 'full_name', 'fullname'],
  email: ['email', 'email_cong_ty', 'email_công_ty'],
  department: ['phong_ban', 'phòng_ban', 'department', 'department_id'],
  position: ['chuc_vu', 'chức_vụ', 'position'],
  joinDate: ['ngay_vao_lam', 'ngày_vào_làm', 'join_date'],
  phone: ['so_dien_thoai', 'số_điện_thoại', 'phone'],
}

export const ASSET_TEMPLATE = Object.freeze({
  fileName: 'mau_import_tai_san.xlsx',
  sheetName: 'Tai san',
  columns: [
    { key: 'ma_tai_san', header: 'ma_tai_san', width: 18, example: 'ASSET-101' },
    { key: 'ten_tai_san', header: 'ten_tai_san', width: 28, example: 'Laptop Dell Latitude' },
    { key: 'danh_muc', header: 'danh_muc', width: 22, example: 'Laptop' },
    { key: 'phong_ban_so_huu', header: 'phong_ban_so_huu', width: 24, example: 'Kỹ thuật' },
    { key: 'so_serial', header: 'so_serial', width: 20, example: 'DL-2026-001' },
    { key: 'ngay_mua', header: 'ngay_mua', width: 16, example: '2026-06-10' },
    { key: 'gia_tri', header: 'gia_tri', width: 16, example: 25000000 },
    { key: 'trang_thai', header: 'trang_thai', width: 18, example: 'AVAILABLE' },
    { key: 'ghi_chu', header: 'ghi_chu', width: 32, example: 'Thiết bị nhập mới' },
  ],
})

export const EMPLOYEE_TEMPLATE = Object.freeze({
  fileName: 'mau_import_nhan_vien.xlsx',
  sheetName: 'Nhan vien',
  columns: [
    { key: 'ma_nhan_vien', header: 'ma_nhan_vien', width: 18, example: 'EMP101' },
    { key: 'ho_va_ten', header: 'ho_va_ten', width: 28, example: 'Nguyễn Văn An' },
    { key: 'email', header: 'email', width: 30, example: 'an.nguyen@company.local' },
    { key: 'phong_ban', header: 'phong_ban', width: 22, example: 'Kỹ thuật' },
    { key: 'chuc_vu', header: 'chuc_vu', width: 22, example: 'Nhân viên' },
    { key: 'ngay_vao_lam', header: 'ngay_vao_lam', width: 18, example: '2026-06-10' },
    { key: 'so_dien_thoai', header: 'so_dien_thoai', width: 20, example: '0901234567' },
    { key: 'trang_thai', header: 'trang_thai', width: 18, example: 'ACTIVE' },
  ],
})

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi')
}

function readAlias(raw, key) {
  const aliases = HEADER_ALIASES[key] || [key]
  const normalizedEntries = Object.entries(raw).map(([header, value]) => [
    normalizeText(header),
    value,
  ])
  const found = normalizedEntries.find(([header]) =>
    aliases.some((alias) => normalizeText(alias) === header),
  )
  return found?.[1] ?? ''
}

function findLookup(value, items) {
  if (value === '' || value === null || typeof value === 'undefined') return null
  const numericId = Number(value)
  if (Number.isInteger(numericId) && numericId > 0) {
    return items.find((item) => item.id === numericId) || null
  }
  return items.find((item) => normalizeText(item.name) === normalizeText(value)) || null
}

function toIsoDate(value) {
  if (!value) return null
  let date
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'number' && value >= 20000 && value <= 80000) {
    date = new Date(Math.round((value - 25569) * 86400 * 1000))
  } else {
    date = new Date(value)
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeStatus(value, allowed, fallback) {
  const normalized = String(value || fallback).trim().toUpperCase()
  return allowed.includes(normalized) ? normalized : null
}

export function buildAssetImportRow(raw, rowNumber, lookups) {
  const assetCode = String(readAlias(raw, 'assetCode') || '').trim()
  const name = String(readAlias(raw, 'name') || '').trim()
  const categoryValue = readAlias(raw, 'category')
  const departmentValue = readAlias(raw, 'ownerDepartment')
  const category = findLookup(categoryValue, lookups.categories)
  const department = findLookup(departmentValue, lookups.departments)
  const purchaseDateValue = readAlias(raw, 'purchaseDate')
  const purchaseDate = toIsoDate(purchaseDateValue)
  const valueText = readAlias(raw, 'value')
  const numericValue = valueText === '' ? null : Number(valueText)
  const status = normalizeStatus(
    readAlias(raw, 'status'),
    ['AVAILABLE', 'MAINTENANCE', 'BROKEN', 'LOST', 'DISPOSED'],
    'AVAILABLE',
  )
  const errors = []

  if (!assetCode) errors.push('Thiếu mã tài sản')
  if (!name) errors.push('Thiếu tên tài sản')
  if (!category) errors.push(`Không tìm thấy danh mục "${categoryValue}"`)
  if (departmentValue && !department) errors.push(`Không tìm thấy phòng ban "${departmentValue}"`)
  if (purchaseDateValue && !purchaseDate) errors.push('Ngày mua không hợp lệ')
  if (valueText !== '' && (!Number.isFinite(numericValue) || numericValue < 0)) {
    errors.push('Giá trị phải là số không âm')
  }
  if (!status) errors.push('Trạng thái tài sản không hợp lệ')

  return {
    rowNumber,
    data: {
      rowNumber,
      assetCode,
      name,
      categoryId: category?.id,
      ownerDepartmentId: department?.id || null,
      serialNumber: String(readAlias(raw, 'serialNumber') || '').trim() || null,
      purchaseDate,
      value: numericValue,
      status: status || 'AVAILABLE',
      notes: String(readAlias(raw, 'notes') || '').trim() || null,
    },
    preview: {
      code: assetCode,
      name,
      reference: category?.name || String(categoryValue || ''),
      secondary: department?.name || String(departmentValue || ''),
      status: status || String(readAlias(raw, 'status') || ''),
    },
    errors,
  }
}

export function buildEmployeeImportRow(raw, rowNumber, lookups) {
  const employeeCode = String(readAlias(raw, 'employeeCode') || '').trim()
  const fullName = String(readAlias(raw, 'fullName') || '').trim()
  const email = String(readAlias(raw, 'email') || '').trim().toLowerCase()
  const departmentValue = readAlias(raw, 'department')
  const department = findLookup(departmentValue, lookups.departments)
  const joinDateValue = readAlias(raw, 'joinDate')
  const joinDate = toIsoDate(joinDateValue)
  const status = normalizeStatus(readAlias(raw, 'status'), ['ACTIVE', 'INACTIVE'], 'ACTIVE')
  const errors = []

  if (!fullName) errors.push('Thiếu họ và tên')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email không hợp lệ')
  if (departmentValue && !department) errors.push(`Không tìm thấy phòng ban "${departmentValue}"`)
  if (joinDateValue && !joinDate) errors.push('Ngày vào làm không hợp lệ')
  if (!status) errors.push('Trạng thái nhân viên không hợp lệ')

  return {
    rowNumber,
    data: {
      rowNumber,
      employeeCode: employeeCode || null,
      fullName,
      email,
      departmentId: department?.id || null,
      position: String(readAlias(raw, 'position') || '').trim() || 'Staff',
      joinDate,
      phone: String(readAlias(raw, 'phone') || '').trim() || null,
      status: status || 'ACTIVE',
    },
    preview: {
      code: employeeCode || 'Tự sinh',
      name: fullName,
      reference: email,
      secondary: department?.name || String(departmentValue || ''),
      status: status || String(readAlias(raw, 'status') || ''),
    },
    errors,
  }
}
