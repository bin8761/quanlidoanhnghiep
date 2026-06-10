import { useCallback, useEffect, useState } from 'react'
import {
  Pencil,
  Plus,
  Trash2,
  MapPin,
  Briefcase,
  User,
  GraduationCap,
  FileText,
  History,
  UploadCloud,
  FileCheck,
  Download
} from 'lucide-react'
import { departmentApi } from '../../api/departments'
import { employeeApi } from '../../api/employees'
import { locationApi } from '../../api/locations'
import { API_BASE_URL } from '../../api/client'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'
import VietnamAddressSelector from '../../components/ui/VietnamAddressSelector'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { VIETNAMESE_ETHNICITIES, NATIONALITIES } from '../../data/vietnam-static'
import useAutoDismiss from '../../hooks/useAutoDismiss'
import AvatarUpload from '../../components/ui/AvatarUpload'

const FIELD_LABELS = {
  fullName: 'Họ và tên',
  avatarUrl: 'Ảnh đại diện',
  phone: 'Số điện thoại',
  personalEmail: 'Email cá nhân',
  dateOfBirth: 'Ngày sinh',
  gender: 'Giới tính',
  permanentAddress: 'Địa chỉ thường trú',
  currentAddress: 'Địa chỉ hiện tại',
  emergencyContact: 'Liên hệ khẩn cấp',
  education: 'Trình độ học vấn',
  skills: 'Kỹ năng',
  certificates: 'Chứng chỉ',
  hometown: 'Quê quán',
  ethnicity: 'Dân tộc',
  nationality: 'Quốc tịch',
  identityCardNumber: 'Số CCCD',
  allowProfileUpdate: 'Quyền tự cập nhật hồ sơ',
  position: 'Chức vụ',
  status: 'Trạng thái nhân viên',
  departmentId: 'Phòng ban',
  joinDate: 'Ngày vào làm'
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
  } catch {
    return 'Chưa cập nhật'
  }
}

function toInputDateString(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

function getFileTypeFromExtension(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  if (['pdf', 'doc', 'docx'].includes(ext)) return 'CV'
  if (['jpg', 'jpeg', 'png'].includes(ext)) return 'CCCD'
  return 'OTHER'
}

function getFullImageUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url
  // API_BASE_URL = 'http://localhost:5000/api' -> strip '/api' to get base host
  const baseHost = API_BASE_URL.replace(/\/api$/, '')
  return `${baseHost}${url}`
}

function EmployeeAvatar({ avatarUrl, fullName }) {
  const [imgError, setImgError] = useState(false)
  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  if (avatarUrl && !imgError) {
    return (
      <img
        src={getFullImageUrl(avatarUrl)}
        alt={fullName}
        className="size-8 shrink-0 rounded-full object-cover border border-slate-200"
        onError={() => setImgError(true)}
      />
    )
  }

  const initials = fullName
    ? fullName.split(' ').slice(-2).map(p => p[0]).join('').toUpperCase()
    : '?'

  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-extrabold text-brand-700 border border-brand-200">
      {initials}
    </span>
  )
}

const POSITION_OPTIONS = Object.freeze([
  { value: 'Giám đốc', label: 'Giám đốc' },
  { value: 'Trưởng phòng', label: 'Trưởng phòng' },
  { value: 'Phó phòng', label: 'Phó phòng' },
  { value: 'Nhân viên', label: 'Nhân viên' },
  { value: 'Kỹ thuật viên', label: 'Kỹ thuật viên' },
  { value: 'Kế toán', label: 'Kế toán' },
  { value: 'Khác', label: 'Khác' },
])

const EMPTY_FORM = Object.freeze({
  employeeCode: '',
  fullName: '',
  email: '',
  departmentId: '',
  status: 'ACTIVE',
  position: 'Nhân viên',
  joinDate: '',
  allowProfileUpdate: true,
  avatarUrl: '',
  phone: '',
  personalEmail: '',
  dateOfBirth: '',
  gender: 'Nam',
  identityCardNumber: '',
  hometown: '',
  ethnicity: '',
  nationality: '',
  permanentAddress: '',
  currentAddress: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  education: [],
  skills: '',
  certificates: ''
})

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', departmentId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editingEmployeeDetail, setEditingEmployeeDetail] = useState(null)
  const [editModalTab, setEditModalTab] = useState('job')
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [logs, setLogs] = useState([])
  
  const [deletingEmployee, setDeletingEmployee] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Pinning desk states
  const [pinningEmployee, setPinningEmployee] = useState(null)
  const [locList, setLocList] = useState([])
  const [selectedLocId, setSelectedLocId] = useState('')
  const [selectedLocDetail, setSelectedLocDetail] = useState(null)
  const [pinCoords, setPinCoords] = useState(null)
  const [isSavingPin, setIsSavingPin] = useState(false)

  // Attachment form state (inside modal)
  const [attachForm, setAttachForm] = useState({
    fileName: '',
    fileType: 'CV',
    fileUrl: '',
    fileSize: '0 KB'
  })
  const [isUploading, setIsUploading] = useState(false)

  useAutoDismiss(toast, setToast)

  const loadEmployees = useCallback(async (activeFilters = filters) => {
    setIsLoading(true)
    setError('')
    try {
      setEmployees(await employeeApi.list(activeFilters))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    departmentApi.list().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadEmployees(filters), 300)
    return () => window.clearTimeout(timer)
  }, [filters, loadEmployees])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingEmployee({ id: null })
    setEditingEmployeeDetail(null)
    setForm({
      ...EMPTY_FORM,
      joinDate: toInputDateString(new Date())
    })
    setFormErrors({})
  }

  async function openEditModal(employee) {
    setEditingEmployee(employee)
    setEditModalTab('job')
    setIsLoadingEdit(true)
    setFormErrors({})
    try {
      const detail = await employeeApi.getById(employee.id)
      setEditingEmployeeDetail(detail)

      const emergency = detail.emergencyContact || {}
      setForm({
        employeeCode: detail.employeeCode || '',
        fullName: detail.fullName || '',
        email: detail.email || '',
        departmentId: detail.departmentId ? String(detail.departmentId) : '',
        status: detail.status || 'ACTIVE',
        position: detail.position || 'Nhân viên',
        joinDate: toInputDateString(detail.joinDate),
        allowProfileUpdate: detail.allowProfileUpdate ?? true,
        avatarUrl: detail.avatarUrl || '',
        phone: detail.phone || '',
        personalEmail: detail.personalEmail || '',
        dateOfBirth: toInputDateString(detail.dateOfBirth),
        gender: detail.gender || 'Nam',
        identityCardNumber: detail.identityCardNumber || '',
        hometown: detail.hometown || '',
        ethnicity: detail.ethnicity || '',
        nationality: detail.nationality || '',
        permanentAddress: detail.permanentAddress || '',
        currentAddress: detail.currentAddress || '',
        emergencyName: emergency.name || '',
        emergencyPhone: emergency.phone || '',
        emergencyRelation: emergency.relation || '',
        education: Array.isArray(detail.education) ? detail.education : [],
        skills: Array.isArray(detail.skills) ? detail.skills.join(', ') : '',
        certificates: Array.isArray(detail.certificates) ? detail.certificates.join(', ') : ''
      })

      const [attachList, logList] = await Promise.all([
        employeeApi.getAttachments(employee.id),
        employeeApi.getLogs(employee.id)
      ])
      setAttachments(attachList)
      setLogs(logList)
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Lỗi tải chi tiết nhân viên.' })
      setEditingEmployee(null)
    } finally {
      setIsLoadingEdit(false)
    }
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingEmployee(null)
      setEditingEmployeeDetail(null)
      setForm(EMPTY_FORM)
      setFormErrors({})
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: undefined }))
  }

  function validateForm() {
    const nextErrors = {}
    if (form.fullName.trim().length < 2) nextErrors.fullName = 'Họ tên cần ít nhất 2 ký tự.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email không hợp lệ.'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    try {
      let payload
      if (editingEmployee.id) {
        // Full payload for Edit
        payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          status: form.status,
          position: form.position?.trim() || 'Nhân viên',
          joinDate: form.joinDate ? new Date(form.joinDate) : new Date(),
          allowProfileUpdate: form.allowProfileUpdate,
          avatarUrl: form.avatarUrl || null,
          phone: form.phone?.trim() || null,
          personalEmail: form.personalEmail?.trim() || null,
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : null,
          gender: form.gender || null,
          identityCardNumber: form.identityCardNumber?.trim() || null,
          hometown: form.hometown?.trim() || null,
          ethnicity: form.ethnicity?.trim() || null,
          nationality: form.nationality?.trim() || null,
          permanentAddress: form.permanentAddress?.trim() || null,
          currentAddress: form.currentAddress?.trim() || null,
          emergencyContact: {
            name: form.emergencyName?.trim() || null,
            phone: form.emergencyPhone?.trim() || null,
            relation: form.emergencyRelation?.trim() || null
          },
          education: form.education || [],
          skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          certificates: form.certificates ? form.certificates.split(',').map(c => c.trim()).filter(Boolean) : []
        }
        await employeeApi.update(editingEmployee.id, payload)
        setToast({ type: 'success', message: 'Cập nhật nhân viên thành công.' })
      } else {
        // Basic payload for Create (employeeCode auto-generated by backend)
        payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          status: form.status,
          position: form.position?.trim() || 'Nhân viên',
          joinDate: form.joinDate ? new Date(form.joinDate) : new Date()
        }
        await employeeApi.create(payload)
        setToast({ type: 'success', message: 'Thêm nhân viên thành công.' })
      }

      setEditingEmployee(null)
      setEditingEmployeeDetail(null)
      setForm(EMPTY_FORM)
      await loadEmployees(filters)
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function openPinModal(employee) {
    setPinningEmployee(employee)
    setPinCoords(employee.deskX !== null ? { x: employee.deskX, y: employee.deskY } : null)
    setSelectedLocId(employee.locationId ? String(employee.locationId) : '')
    setSelectedLocDetail(null)
    
    try {
      const data = await locationApi.list()
      setLocList(data)
      if (employee.locationId) {
        const detail = await locationApi.get(employee.locationId)
        setSelectedLocDetail(detail)
      } else if (data.length > 0) {
        setSelectedLocId(String(data[0].id))
        const detail = await locationApi.get(data[0].id)
        setSelectedLocDetail(detail)
      }
    } catch {
      setToast({ type: 'error', message: 'Lỗi tải danh sách sơ đồ' })
    }
  }

  async function handleLocChange(e) {
    const locId = e.target.value
    setSelectedLocId(locId)
    setPinCoords(null)
    if (locId) {
      try {
        const detail = await locationApi.get(locId)
        setSelectedLocDetail(detail)
        if (pinningEmployee.locationId === Number(locId)) {
          setPinCoords({ x: pinningEmployee.deskX, y: pinningEmployee.deskY })
        }
      } catch {
        setSelectedLocDetail(null)
      }
    } else {
      setSelectedLocDetail(null)
    }
  }

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPinCoords({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
  }

  async function handleSavePin() {
    setIsSavingPin(true)
    try {
      const payload = {
        locationId: selectedLocId ? Number(selectedLocId) : null,
        deskX: pinCoords ? pinCoords.x : null,
        deskY: pinCoords ? pinCoords.y : null,
      }
      await employeeApi.update(pinningEmployee.id, payload)
      setToast({ type: 'success', message: 'Cập nhật vị trí bàn làm việc nhân viên thành công.' })
      setPinningEmployee(null)
      await loadEmployees(filters)
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setIsSavingPin(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await employeeApi.remove(deletingEmployee.id)
      setDeletingEmployee(null)
      setToast({ type: 'success', message: 'Xóa nhân viên thành công.' })
      await loadEmployees(filters)
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const departmentOptions = [
    { value: '', label: 'Chưa phân phòng ban' },
    ...departments.map((department) => ({ value: String(department.id), label: department.name })),
  ]

  const columns = [
    { key: 'employeeCode', label: 'Mã nhân viên' },
    {
      key: 'fullName',
      label: 'Họ tên',
      render: (value, employee) => (
        <div className="flex items-center gap-2.5">
          <EmployeeAvatar avatarUrl={employee.avatarUrl} fullName={value} />
          <span className="font-semibold text-slate-800">{value}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'department',
      label: 'Phòng ban',
      render: (value) => value?.name || 'Chưa phân phòng',
    },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, employee) => (
        <div className="flex items-center gap-1">
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
            type="button"
            title={`Định vị bàn làm việc của ${employee.fullName}`}
            onClick={() => openPinModal(employee)}
          >
            <MapPin size={16} />
          </button>
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
            type="button"
            title={`Sửa ${employee.fullName}`}
            onClick={() => openEditModal(employee)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700"
            type="button"
            title={`Xóa ${employee.fullName}`}
            onClick={() => setDeletingEmployee(employee)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Nhân sự sử dụng tài sản"
        title="Quản lý nhân viên"
        description="Quản lý hồ sơ nhân viên và liên kết với phòng ban trong doanh nghiệp."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Thêm nhân viên
          </Button>
        )}
      />

      <section className="filter-panel sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          as="select"
          label="Phòng ban"
          name="departmentFilter"
          value={filters.departmentId}
          options={[{ value: '', label: 'Tất cả phòng ban' }, ...departmentOptions.slice(1)]}
          onChange={(event) => updateFilter('departmentId', event.target.value)}
        />
        <FormField
          as="select"
          label="Trạng thái"
          name="statusFilter"
          value={filters.status}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'ACTIVE', label: 'Đang hoạt động' },
            { value: 'INACTIVE', label: 'Ngừng hoạt động' },
          ]}
          onChange={(event) => updateFilter('status', event.target.value)}
        />
        <div className="flex items-end">
          <Button
            className="w-full"
            variant="secondary"
            type="button"
            onClick={() => setFilters({ keyword: '', status: '', departmentId: '' })}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={() => loadEmployees(filters)} />}

      {isLoading ? (
        <ResourceTableSkeleton columns={6} />
      ) : (
        <DataTable
          columns={columns}
          rows={employees}
          searchValue={filters.keyword}
          onSearchChange={(value) => updateFilter('keyword', value)}
          searchPlaceholder="Tìm theo mã, tên hoặc email..."
        />
      )}

      {editingEmployee && (
        <Modal
          title={editingEmployee.id ? `Cập nhật nhân viên: ${form.fullName}` : 'Thêm nhân viên'}
          description="Hồ sơ nhân viên là điều kiện để tạo tài khoản USER và bàn giao tài sản."
          onClose={closeFormModal}
          size={editingEmployee.id ? 'lg' : 'md'}
        >
          {isLoadingEdit ? (
            <div className="grid min-h-[300px] place-items-center">
              <div className="text-center">
                <div className="mx-auto size-8 rounded-full border-3 border-brand-100 border-t-brand-600 animate-spin" />
                <p className="mt-4 text-xs font-semibold text-slate-500">Đang tải thông tin chi tiết...</p>
              </div>
            </div>
          ) : editingEmployee.id ? (
            // EDIT MODE WITH 5 TABS
            <div className="space-y-5">
              {/* Tab Navigation */}
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 -mx-5 -mt-5">
                <nav className="flex space-x-6 overflow-x-auto" aria-label="Tabs">
                  {[
                    { id: 'job', label: 'Thông tin công việc', icon: Briefcase },
                    { id: 'personal', label: 'Thông tin cá nhân', icon: User },
                    { id: 'resume', label: 'Sơ yếu lý lịch', icon: GraduationCap },
                    { id: 'attachments', label: 'Tài liệu & Đính kèm', icon: FileText },
                    { id: 'logs', label: 'Lịch sử cập nhật', icon: History }
                  ].map(tab => {
                    const Icon = tab.icon
                    const active = editModalTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setEditModalTab(tab.id)}
                        className={`flex items-center gap-2 border-b-2 py-4 text-xs font-bold transition focus:outline-none whitespace-nowrap ${
                          active
                            ? 'border-brand-600 text-brand-700'
                            : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        <Icon size={15} />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>

              <form className="grid gap-5" noValidate onSubmit={handleSave}>
                {/* TAB 1: Job Info */}
                {editModalTab === 'job' && (
                  <div className="grid gap-5">
                    {/* Avatar row */}
                    <div className="flex items-center gap-5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <AvatarUpload
                        value={form.avatarUrl}
                        onChange={val => setForm(c => ({ ...c, avatarUrl: val }))}
                        name={form.fullName}
                        size="md"
                        showLabel={true}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold text-slate-700">'Ảnh đại diện nhân viên</p>
                        <p className="text-[11px] text-slate-400">Chấp nhận PNG, JPG, WEBP tối đa 5MB. Ảnh sẽ được tự động cắt và tối ưu.</p>
                        {form.avatarUrl && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            ✓ Đã có ảnh đại diện
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        label="Mã nhân viên"
                        name="employeeCode"
                        value={form.employeeCode}
                        error={formErrors.employeeCode}
                        placeholder="VD: EMP005"
                        disabled
                      />
                      <FormField
                        label="Họ và tên"
                        name="fullName"
                        value={form.fullName}
                        error={formErrors.fullName}
                        placeholder="Nhập họ và tên"
                        onChange={updateField}
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        label="Email công ty"
                        name="email"
                        type="email"
                        value={form.email}
                        error={formErrors.email}
                        placeholder="name@company.local"
                        onChange={updateField}
                      />
                      <FormField
                        as="select"
                        label="Chức vụ"
                        name="position"
                        value={form.position}
                        onChange={updateField}
                        options={POSITION_OPTIONS}
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        as="select"
                        label="Phòng ban"
                        name="departmentId"
                        value={form.departmentId}
                        options={departmentOptions}
                        onChange={updateField}
                      />
                      <FormField
                        label="Ngày vào làm"
                        name="joinDate"
                        type="date"
                        value={form.joinDate}
                        onChange={updateField}
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField
                        as="select"
                        label="Trạng thái"
                        name="status"
                        value={form.status}
                        options={[
                          { value: 'ACTIVE', label: 'Đang hoạt động' },
                          { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                        ]}
                        onChange={updateField}
                      />
                      <div className="flex items-center gap-3 pt-6">
                        <input
                          type="checkbox"
                          id="allowProfileUpdate"
                          name="allowProfileUpdate"
                          checked={form.allowProfileUpdate}
                          onChange={(e) => setForm(current => ({ ...current, allowProfileUpdate: e.target.checked }))}
                          className="size-4 rounded border-slate-355 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="allowProfileUpdate" className="text-xs font-bold text-slate-700 cursor-pointer">
                          Cho phép nhân viên tự cập nhật thông tin cá nhân
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Personal Info */}
                {editModalTab === 'personal' && (
                  <div className="grid gap-5">
                    <div className="grid gap-5 sm:grid-cols-3">
                      <FormField
                        label="Số điện thoại"
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                      />
                      <FormField
                        label="Email cá nhân"
                        name="personalEmail"
                        type="email"
                        value={form.personalEmail}
                        onChange={updateField}
                      />
                      <FormField
                        label="Ngày sinh"
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={updateField}
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                      <FormField
                        as="select"
                        label="Giới tính"
                        name="gender"
                        value={form.gender}
                        options={[
                          { value: 'Nam', label: 'Nam' },
                          { value: 'Nữ', label: 'Nữ' },
                          { value: 'Khác', label: 'Khác' }
                        ]}
                        onChange={updateField}
                      />
                      <FormField
                        label="Số CCCD"
                        name="identityCardNumber"
                        value={form.identityCardNumber}
                        onChange={updateField}
                      />
                      {/* Quê quán - dropdown tỉnh/thành */}
                      <SearchableSelect
                        label="Quê quán (Tỉnh/Thành phố)"
                        options={[
                          { value: '', label: '-- Chưa chọn --' },
                          ...[
                            'Hà Nội','TP Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ',
                            'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
                            'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước',
                            'Bình Thuận','Cà Mau','Cao Bằng','Đắk Lắk','Đắk Nông',
                            'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang',
                            'Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình',
                            'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu',
                            'Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định',
                            'Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên',
                            'Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị',
                            'Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
                            'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang',
                            'Vĩnh Long','Vĩnh Phúc','Yên Bái'
                          ].map(t => ({ value: t, label: t }))
                        ]}
                        value={form.hometown}
                        onChange={val => setForm(c => ({ ...c, hometown: val }))}
                        placeholder="Chọn tỉnh/thành"
                      />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {/* Dân tộc - dropdown 54 dân tộc */}
                      <SearchableSelect
                        label="Dân tộc"
                        options={[
                          { value: '', label: '-- Chưa chọn --' },
                          ...VIETNAMESE_ETHNICITIES.map(e => ({ value: e, label: e }))
                        ]}
                        value={form.ethnicity}
                        onChange={val => setForm(c => ({ ...c, ethnicity: val }))}
                        placeholder="Chọn dân tộc"
                      />
                      {/* Quốc tịch - searchable autocomplete */}
                      <SearchableSelect
                        label="Quốc tịch"
                        options={[{ value: '', label: '-- Chưa chọn --' }, ...NATIONALITIES]}
                        value={form.nationality}
                        onChange={val => setForm(c => ({ ...c, nationality: val }))}
                        placeholder="Tìm và chọn quốc tịch"
                      />
                    </div>
                    {/* Địa chỉ bằng API cấp hành chính */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <VietnamAddressSelector
                        label="Địa chỉ thường trú"
                        value={form.permanentAddress}
                        onChange={val => setForm(c => ({ ...c, permanentAddress: val }))}
                        includeStreet={true}
                      />
                      <VietnamAddressSelector
                        label="Địa chỉ hiện tại"
                        value={form.currentAddress}
                        onChange={val => setForm(c => ({ ...c, currentAddress: val }))}
                        includeStreet={true}
                      />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-1">Người liên hệ khẩn cấp</h4>
                      <div className="grid gap-5 sm:grid-cols-3">
                        <FormField
                          label="Họ tên"
                          name="emergencyName"
                          value={form.emergencyName}
                          onChange={updateField}
                        />
                        <FormField
                          label="Số điện thoại"
                          name="emergencyPhone"
                          value={form.emergencyPhone}
                          onChange={updateField}
                        />
                        <FormField
                          label="Mối quan hệ"
                          name="emergencyRelation"
                          value={form.emergencyRelation}
                          onChange={updateField}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: Resume */}
                {editModalTab === 'resume' && (
                  <div className="grid gap-5">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Học vấn & Trình độ</h4>
                        <Button type="button" variant="secondary" size="sm" onClick={() => {
                          setForm(current => ({
                            ...current,
                            education: [...current.education, { school: '', major: '', degree: 'Đại học', graduateYear: new Date().getFullYear() }]
                          }))
                        }}>
                          <Plus size={14} /> Thêm trình độ
                        </Button>
                      </div>

                      {form.education.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">Chưa cập nhật thông tin học vấn.</p>
                      ) : (
                        <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                          {form.education.map((item, idx) => (
                            <div key={idx} className="relative grid gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-4 items-end">
                              <FormField
                                label="Trường học"
                                name={`school-${idx}`}
                                value={item.school || ''}
                                onChange={e => {
                                  const nextEd = [...form.education]
                                  nextEd[idx] = { ...nextEd[idx], school: e.target.value }
                                  setForm(current => ({ ...current, education: nextEd }))
                                }}
                              />
                              <FormField
                                label="Chuyên ngành"
                                name={`major-${idx}`}
                                value={item.major || ''}
                                onChange={e => {
                                  const nextEd = [...form.education]
                                  nextEd[idx] = { ...nextEd[idx], major: e.target.value }
                                  setForm(current => ({ ...current, education: nextEd }))
                                }}
                              />
                              <FormField
                                as="select"
                                label="Bằng cấp"
                                name={`degree-${idx}`}
                                value={item.degree || 'Đại học'}
                                options={[
                                  { value: 'Trung cấp', label: 'Trung cấp' },
                                  { value: 'Cao đẳng', label: 'Cao đẳng' },
                                  { value: 'Đại học', label: 'Đại học' },
                                  { value: 'Thạc sĩ', label: 'Thạc sĩ' },
                                  { value: 'Tiến sĩ', label: 'Tiến sĩ' },
                                  { value: 'Khác', label: 'Khác' }
                                ]}
                                onChange={e => {
                                  const nextEd = [...form.education]
                                  nextEd[idx] = { ...nextEd[idx], degree: e.target.value }
                                  setForm(current => ({ ...current, education: nextEd }))
                                }}
                              />
                              <div className="flex gap-2 items-center">
                                <FormField
                                  label="Năm tốt nghiệp"
                                  name={`graduateYear-${idx}`}
                                  type="number"
                                  value={item.graduateYear || ''}
                                  onChange={e => {
                                    const nextEd = [...form.education]
                                    nextEd[idx] = { ...nextEd[idx], graduateYear: Number(e.target.value) }
                                    setForm(current => ({ ...current, education: nextEd }))
                                  }}
                                />
                                <button
                                  type="button"
                                  className="mt-6 p-2 rounded-lg text-slate-400 hover:text-red-650 transition hover:bg-red-50"
                                  onClick={() => {
                                    const nextEd = form.education.filter((_, i) => i !== idx)
                                    setForm(current => ({ ...current, education: nextEd }))
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 border-t pt-4">
                      <FormField
                        as="textarea"
                        label="Kỹ năng chuyên môn"
                        name="skills"
                        value={form.skills}
                        hint="Nhập các kỹ năng, phân cách bằng dấu phẩy (,)"
                        placeholder="VD: Node.js, React, SQL..."
                        onChange={updateField}
                      />
                      <FormField
                        as="textarea"
                        label="Chứng chỉ chuyên môn"
                        name="certificates"
                        value={form.certificates}
                        hint="Nhập các chứng chỉ, phân cách bằng dấu phẩy (,)"
                        placeholder="VD: AWS, PMP..."
                        onChange={updateField}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: Attachments */}
                {editModalTab === 'attachments' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thêm tài liệu đính kèm</h4>
                      <div className="grid gap-4 sm:grid-cols-3 items-end">
                        <FormField
                          as="select"
                          label="Loại tài liệu"
                          name="fileType"
                          value={attachForm.fileType}
                          options={[
                            { value: 'CV', label: 'CV / Sơ yếu lý lịch' },
                            { value: 'CCCD', label: 'Căn cước công dân' },
                            { value: 'DEGREE', label: 'Bằng cấp tốt nghiệp' },
                            { value: 'CERTIFICATE', label: 'Chứng chỉ chuyên môn' },
                            { value: 'OTHER', label: 'Tài liệu khác' }
                          ]}
                          onChange={e => setAttachForm(c => ({ ...c, fileType: e.target.value }))}
                        />
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-slate-700">Chọn tệp tin</label>
                          <div className="relative flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 cursor-pointer hover:border-slate-400 transition min-h-11">
                            <input
                              type="file"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  let sizeStr = '0 KB'
                                  if (file.size > 1024 * 1024) sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
                                  else sizeStr = (file.size / 1024).toFixed(0) + ' KB'
                                  setAttachForm({
                                    fileName: file.name,
                                    fileType: getFileTypeFromExtension(file.name),
                                    fileUrl: `/mock-uploads/${Date.now()}_${file.name}`,
                                    fileSize: sizeStr
                                  })
                                }
                              }}
                            />
                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                              <UploadCloud size={16} />
                              {attachForm.fileName ? attachForm.fileName : 'Chọn tệp...'}
                            </span>
                          </div>
                        </div>
                        <Button type="button" disabled={isUploading || !attachForm.fileName} className="w-full" onClick={async () => {
                          setIsUploading(true)
                          try {
                            await employeeApi.uploadAttachment(editingEmployee.id, {
                              fileName: attachForm.fileName,
                              fileType: attachForm.fileType,
                              fileUrl: attachForm.fileUrl
                            })
                            setToast({ type: 'success', message: 'Thêm tài liệu đính kèm thành công.' })
                            setAttachForm({ fileName: '', fileType: 'CV', fileUrl: '', fileSize: '0 KB' })
                            const updatedList = await employeeApi.getAttachments(editingEmployee.id)
                            setAttachments(updatedList)
                          } catch (err) {
                            setToast({ type: 'error', message: err.message || 'Lỗi thêm tài liệu' })
                          } finally {
                            setIsUploading(false)
                          }
                        }}>
                          Đính kèm tài liệu
                        </Button>
                      </div>
                    </div>

                    {/* Attachments List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tài liệu đã đính kèm ({attachments.length})</h4>
                      {attachments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có tài liệu đính kèm.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 max-h-[200px] overflow-y-auto pr-1">
                          {attachments.map(file => (
                            <div key={file.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                                  <FileCheck size={16} />
                                </span>
                                <div className="min-w-0">
                                  <h5 className="truncate text-xs font-bold text-slate-800" title={file.fileName}>{file.fileName}</h5>
                                  <span className="text-[9px] text-slate-400">Tải lên: {formatDate(file.uploadedAt)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-850"
                                >
                                  <Download size={14} />
                                </a>
                                <button
                                  type="button"
                                  className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-750"
                                  onClick={async () => {
                                    if (!confirm('Xóa tài liệu này?')) return
                                    try {
                                      await employeeApi.deleteAttachment(editingEmployee.id, file.id)
                                      setToast({ type: 'success', message: 'Xóa tài liệu thành công.' })
                                      const updatedList = await employeeApi.getAttachments(editingEmployee.id)
                                      setAttachments(updatedList)
                                    } catch (err) {
                                      setToast({ type: 'error', message: err.message || 'Lỗi xóa tài liệu' })
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: Logs */}
                {editModalTab === 'logs' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nhật ký thay đổi hồ sơ ({logs.length})</h4>
                    {logs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có nhật ký thay đổi nào.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[250px]">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 sticky top-0">
                              <th className="p-2.5">Thời gian</th>
                              <th className="p-2.5">Người đổi</th>
                              <th className="p-2.5">Trường đổi</th>
                              <th className="p-2.5">Giá trị cũ</th>
                              <th className="p-2.5">Giá trị mới</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {logs.map(log => {
                              const actorName = log.actor ? (log.actor.employee?.fullName || log.actor.email) : 'System'
                              const fieldLabel = FIELD_LABELS[log.fieldName] || log.fieldName
                              return (
                                <tr key={log.id} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 whitespace-nowrap text-slate-400">
                                    {new Intl.DateTimeFormat('vi-VN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    }).format(new Date(log.changedAt))}
                                  </td>
                                  <td className="p-2.5 font-semibold">{actorName}</td>
                                  <td className="p-2.5 font-bold text-brand-700">{fieldLabel}</td>
                                  <td className="p-2.5 truncate max-w-[120px]" title={log.oldValue}>{log.oldValue || '-'}</td>
                                  <td className="p-2.5 truncate max-w-[120px]" title={log.newValue}>{log.newValue || '-'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer buttons for data tabs */}
                {['job', 'personal', 'resume'].includes(editModalTab) && (
                  <div className="form-actions border-t pt-4">
                    <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            // CREATE MODE (SIMPLE FORM)
            <form className="grid gap-5" noValidate onSubmit={handleSave}>
              {/* Auto-generated employee code notice */}
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Mã nhân viên tự động sinh</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">Hệ thống sẽ tự động tạo mã nhân viên theo định dạng <strong>EMP001, EMP002...</strong> khi lưu.</p>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Mã nhân viên</label>
                  <div className="flex min-h-11 w-full items-center gap-2 rounded-[10px] border border-dashed border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <span className="text-sm font-semibold text-slate-400 italic">(Tự động sinh)</span>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Auto</span>
                  </div>
                </div>
                <FormField
                  label="Họ và tên"
                  name="fullName"
                  value={form.fullName}
                  error={formErrors.fullName}
                  placeholder="Nhập họ và tên"
                  onChange={updateField}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Email công ty"
                  name="email"
                  type="email"
                  value={form.email}
                  error={formErrors.email}
                  placeholder="name@company.local"
                  onChange={updateField}
                />
                <FormField
                  label="Chức vụ"
                  name="position"
                  value={form.position}
                  placeholder="VD: Kỹ sư phần mềm"
                  onChange={updateField}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  as="select"
                  label="Phòng ban"
                  name="departmentId"
                  value={form.departmentId}
                  options={departmentOptions}
                  onChange={updateField}
                />
                <FormField
                  label="Ngày vào làm"
                  name="joinDate"
                  type="date"
                  value={form.joinDate}
                  onChange={updateField}
                />
              </div>
              <FormField
                as="select"
                label="Trạng thái"
                name="status"
                value={form.status}
                options={[
                  { value: 'ACTIVE', label: 'Đang hoạt động' },
                  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                ]}
                onChange={updateField}
              />
              <div className="form-actions border-t pt-4">
                <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                  Thêm nhân viên
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {deletingEmployee && (
        <ConfirmDialog
          title={`Xóa nhân viên "${deletingEmployee.fullName}"?`}
          message="Không thể xóa nhân viên đã có tài khoản hoặc đang được bàn giao tài sản."
          confirmLabel="Xóa nhân viên"
          isSubmitting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => !isDeleting && setDeletingEmployee(null)}
        />
      )}

      {pinningEmployee && (
        <Modal
          title={`Định vị bàn làm việc: ${pinningEmployee.fullName}`}
          description="Ghim vị trí bàn làm việc cố định của nhân viên trên sơ đồ văn phòng."
          onClose={() => setPinningEmployee(null)}
        >
          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">Chọn sơ đồ mặt bằng</label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:border-emerald-500 focus:bg-white focus:outline-none"
                value={selectedLocId}
                onChange={handleLocChange}
              >
                <option value="">-- Chọn sơ đồ mặt bằng --</option>
                {locList.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {selectedLocDetail ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-slate-400 italic">💡 Click trực tiếp vào ảnh sơ đồ bên dưới để đặt chấm định vị bàn làm việc.</p>
                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-[300px]">
                  <div className="relative cursor-crosshair" onClick={handleMapClick}>
                    <img
                      src={selectedLocDetail.floorPlanUrl}
                      alt={selectedLocDetail.name}
                      className="max-w-full max-h-[300px] object-contain block"
                    />
                    
                    {pinCoords && (
                      <div
                        style={{ left: `${pinCoords.x}%`, top: `${pinCoords.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 border border-white text-white text-[10px] font-bold shadow-lg">
                          👤
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              selectedLocId && (
                <div className="text-center py-4 text-xs text-slate-400">Đang tải ảnh sơ đồ...</div>
              )
            )}

            <div className="form-actions mt-2">
              <Button type="button" variant="secondary" onClick={() => setPinningEmployee(null)}>
                Hủy
              </Button>
              <Button 
                type="button" 
                disabled={isSavingPin || !selectedLocId} 
                onClick={handleSavePin}
              >
                {isSavingPin && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                Lưu vị trí bàn làm việc
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
