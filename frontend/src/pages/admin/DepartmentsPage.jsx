import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Loader2, Eye, Building, Users, Boxes, Coins, FileText, History, Wrench, ShieldAlert } from 'lucide-react'
import { departmentApi } from '../../api/departments'
import { employeeApi } from '../../api/employees'
import { categoryApi } from '../../api/categories'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import SearchableSelect from '../../components/ui/SearchableSelect'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const EMPTY_FORM = Object.freeze({
  code: '',
  name: '',
  description: '',
  managerId: '',
  email: '',
  phone: '',
  establishedDate: '',
  branch: '',
  status: 'ACTIVE',
  parentId: '',
  annualBudget: '0',
})

// Build tree hierarchy helper
function buildHierarchy(depts, parentId = null, depth = 0) {
  let result = []
  const levelDepts = depts.filter(d => d.parentId === parentId)
  for (const dept of levelDepts) {
    result.push({ ...dept, depth })
    const children = buildHierarchy(depts, dept.id, depth + 1)
    result = result.concat(children)
  }
  if (parentId === null) {
    const visited = new Set(result.map(r => r.id))
    const unvisited = depts.filter(d => !visited.has(d.id))
    for (const dept of unvisited) {
      result.push({ ...dept, depth: 0 })
    }
  }
  return result
}

function formatLogDetails(log) {
  try {
    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details
    if (log.action === 'CREATE') {
      return `Khởi tạo phòng ban: ${details.name || ''} (${details.code || ''})`
    }
    if (log.action === 'UPDATE') {
      const fieldNames = {
        code: 'Mã phòng ban',
        name: 'Tên phòng ban',
        description: 'Mô tả',
        managerId: 'Trưởng bộ phận',
        email: 'Email',
        phone: 'Số điện thoại',
        establishedDate: 'Ngày thành lập',
        branch: 'Chi nhánh',
        status: 'Trạng thái',
        parentId: 'Phòng ban cha',
        annualBudget: 'Ngân sách năm',
      }
      
      return Object.entries(details).map(([key, change]) => {
        const field = fieldNames[key] || key
        let oldVal = change.old
        let newVal = change.new
        
        if (key === 'managerId') {
          oldVal = oldVal ? 'Đã gán' : 'Trống'
          newVal = newVal ? 'Đã gán' : 'Trống'
        } else if (key === 'annualBudget') {
          oldVal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(oldVal || 0))
          newVal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(newVal || 0))
        } else if (key === 'establishedDate') {
          oldVal = oldVal ? new Date(oldVal).toLocaleDateString('vi-VN') : 'Trống'
          newVal = newVal ? new Date(newVal).toLocaleDateString('vi-VN') : 'Trống'
        } else if (key === 'parentId') {
          oldVal = oldVal ? 'Phòng ban khác' : 'Cấp cao nhất'
          newVal = newVal ? 'Phòng ban khác' : 'Cấp cao nhất'
        }
        
        return `${field}: từ "${oldVal ?? 'Trống'}" sang "${newVal ?? 'Trống'}"`
      }).join(', ')
    }
    if (log.action === 'UPDATE_QUOTAS') {
      return 'Cập nhật hạn mức danh mục tài sản'
    }
    return typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
  } catch (e) {
    return typeof log.details === 'string' ? log.details : JSON.stringify(log.details)
  }
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [deletingDepartment, setDeletingDepartment] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  // Dashboard state
  const [summary, setSummary] = useState({
    totalDepartments: 0,
    totalEmployees: 0,
    totalAssets: 0,
    totalAssetValue: 0,
  })

  // Detailing department states
  const [detailingDepartmentId, setDetailingDepartmentId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')
  const [isEditingQuotas, setIsEditingQuotas] = useState(false)
  const [localQuotas, setLocalQuotas] = useState({})
  const [employeeSearch, setEmployeeSearch] = useState('')

  useAutoDismiss(toast, setToast)

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await departmentApi.list()
      setDepartments(data)
      const summaryData = await departmentApi.getDashboardSummary()
      setSummary(summaryData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load departments and dashboard on mount
  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  // Load employees for dropdown manager selection
  useEffect(() => {
    employeeApi.list()
      .then((data) => {
        setEmployees(data)
      })
      .catch((err) => {
        console.error('Lỗi tải danh sách nhân sự:', err)
      })
  }, [])

  // Load categories for quotas setup when detailing modal opens
  useEffect(() => {
    if (detailingDepartmentId) {
      categoryApi.list()
        .then((data) => {
          setCategories(data)
        })
        .catch((err) => {
          console.error('Lỗi tải danh sách danh mục tài sản:', err)
        })
    }
  }, [detailingDepartmentId])

  // Load detailed department data
  useEffect(() => {
    if (!detailingDepartmentId) {
      setDetailData(null)
      return
    }
    let isActive = true
    setIsDetailLoading(true)
    departmentApi.get(detailingDepartmentId, true)
      .then((data) => {
        if (isActive) setDetailData(data)
      })
      .catch((err) => {
        if (isActive) setToast({ type: 'error', message: `Không thể tải chi tiết phòng ban: ${err.message}` })
      })
      .finally(() => {
        if (isActive) setIsDetailLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [detailingDepartmentId])

  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return buildHierarchy(departments)
    }

    return departments.filter((department) =>
      `${department.name} ${department.code} ${department.description || ''} ${department.branch || ''}`
        .toLowerCase()
        .includes(keyword),
    )
  }, [departments, search])

  const employeeOptions = useMemo(() => {
    return [
      { value: '', label: 'Không chỉ định (Trống)' },
      ...employees.map((emp) => ({
        value: emp.id,
        label: `${emp.fullName} (${emp.employeeCode})`,
      })),
    ]
  }, [employees])

  const parentOptions = useMemo(() => {
    return [
      { value: '', label: 'Không có (Cấp cao nhất)' },
      ...departments
        .filter((d) => !editingDepartment || d.id !== editingDepartment.id)
        .map((d) => ({
          value: d.id,
          label: `${d.name} (${d.code})`,
        })),
    ]
  }, [departments, editingDepartment])

  function openCreateModal() {
    setEditingDepartment({ id: null })
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(department) {
    setEditingDepartment(department)
    setForm({
      code: department.code || '',
      name: department.name,
      description: department.description || '',
      managerId: department.managerId || '',
      email: department.email || '',
      phone: department.phone || '',
      establishedDate: department.establishedDate ? new Date(department.establishedDate).toISOString().split('T')[0] : '',
      branch: department.branch || '',
      status: department.status || 'ACTIVE',
      parentId: department.parentId || '',
      annualBudget: department.annualBudget ? String(Number(department.annualBudget)) : '0',
    })
    setFormErrors({})
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingDepartment(null)
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
    if (!form.code.trim()) {
      nextErrors.code = 'Mã phòng ban là bắt buộc.'
    } else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) {
      nextErrors.code = 'Mã phòng ban chỉ chứa chữ, số, gạch ngang và gạch dưới.'
    } else if (form.code.trim().length < 2 || form.code.trim().length > 50) {
      nextErrors.code = 'Mã phòng ban phải từ 2 đến 50 ký tự.'
    }

    if (form.name.trim().length < 2) nextErrors.name = 'Tên phòng ban cần ít nhất 2 ký tự.'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Email không đúng định dạng.'
    
    if (form.annualBudget && isNaN(Number(form.annualBudget))) {
      nextErrors.annualBudget = 'Ngân sách phải là số hợp lệ.'
    } else if (Number(form.annualBudget) < 0) {
      nextErrors.annualBudget = 'Ngân sách không được âm.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        managerId: form.managerId || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        establishedDate: form.establishedDate || null,
        branch: form.branch.trim() || null,
        status: form.status,
        parentId: form.parentId ? Number(form.parentId) : null,
        annualBudget: form.annualBudget ? Number(form.annualBudget) : 0,
      }

      if (editingDepartment.id) {
        await departmentApi.update(editingDepartment.id, payload)
        setToast({ type: 'success', message: 'Cập nhật phòng ban thành công.' })
      } else {
        await departmentApi.create(payload)
        setToast({ type: 'success', message: 'Thêm phòng ban thành công.' })
      }

      setEditingDepartment(null)
      setForm(EMPTY_FORM)
      setFormErrors({})
      await loadDepartments()
    } catch (requestError) {
      if (requestError.errorCode === 'VALIDATION_ERROR') {
        const msg = requestError.message
        if (msg.includes('Mã')) {
          setFormErrors({ code: msg })
        } else if (msg.includes('Tên')) {
          setFormErrors({ name: msg })
        } else if (msg.includes('cha-con') || msg.includes('vòng lặp')) {
          setFormErrors({ parentId: msg })
        } else {
          setFormErrors({ name: msg })
        }
      } else {
        setToast({ type: 'error', message: requestError.message })
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await departmentApi.remove(deletingDepartment.id)
      setDeletingDepartment(null)
      setToast({ type: 'success', message: 'Xóa phòng ban thành công.' })
      await loadDepartments()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsDeleting(false)
    }
  }

  async function saveQuotas() {
    try {
      const quotasPayload = Object.entries(localQuotas)
        .filter(([_, qty]) => Number(qty) >= 0)
        .map(([catId, qty]) => ({
          categoryId: Number(catId),
          maxQuantity: Number(qty)
        }))

      await departmentApi.updateQuotas(detailingDepartmentId, quotasPayload)
      setToast({ type: 'success', message: 'Cập nhật hạn mức tài sản thành công.' })
      
      const refreshed = await departmentApi.get(detailingDepartmentId, true)
      setDetailData(refreshed)
      setIsEditingQuotas(false)
    } catch (err) {
      setToast({ type: 'error', message: `Không thể lưu hạn mức: ${err.message}` })
    }
  }

  const groupedAssets = useMemo(() => {
    if (!detailData?.ownedAssets) return {}
    return detailData.ownedAssets.reduce((groups, asset) => {
      const catName = asset.category?.name || 'Mặc định'
      if (!groups[catName]) groups[catName] = []
      groups[catName].push(asset)
      return groups
    }, {})
  }, [detailData])

  const filteredDetailEmployees = useMemo(() => {
    if (!detailData?.employees) return []
    const kw = employeeSearch.trim().toLowerCase()
    if (!kw) return detailData.employees
    return detailData.employees.filter(emp =>
      `${emp.fullName} ${emp.employeeCode} ${emp.position}`.toLowerCase().includes(kw)
    )
  }, [detailData, employeeSearch])

  const columns = [
    {
      key: 'code',
      label: 'Mã PB',
      render: (value) => <span className="font-mono font-bold text-slate-700 text-xs">{value}</span>,
    },
    {
      key: 'name',
      label: 'Tên phòng ban',
      render: (value, department) => {
        const indent = department.depth ? ' '.repeat(department.depth) + '└── ' : ''
        return (
          <div className="flex items-center">
            {indent && <span className="text-slate-400 font-mono text-xs mr-1">{indent}</span>}
            <button
              type="button"
              onClick={() => {
                setDetailTab('overview')
                setDetailingDepartmentId(department.id)
              }}
              className="font-bold text-brand-600 hover:text-brand-800 hover:underline text-left text-xs"
              title="Bấm để xem chi tiết phòng ban"
            >
              {value}
            </button>
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value) => {
        const configs = {
          ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          SUSPENDED: { label: 'Tạm ngưng', className: 'bg-amber-50 text-amber-700 border-amber-100' },
          DISSOLVED: { label: 'Giải thể', className: 'bg-red-50 text-red-700 border-red-100' },
        }
        const config = configs[value] || { label: value, className: 'bg-slate-50 text-slate-600 border-slate-100' }
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${config.className}`}>
            {config.label}
          </span>
        )
      },
    },
    {
      key: 'branch',
      label: 'Chi nhánh',
      render: (value) => value || <span className="text-slate-400 italic text-xs">Mặc định</span>,
    },
    {
      key: 'manager',
      label: 'Trưởng bộ phận',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          {value.avatarUrl ? (
            <img
              src={value.avatarUrl.startsWith('http') ? value.avatarUrl : `http://localhost:5000${value.avatarUrl}`}
              alt={value.fullName}
              className="size-6 shrink-0 rounded-full object-cover border border-slate-200"
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[9px] font-extrabold text-brand-700 border border-brand-100">
              {value.fullName.split(' ').slice(-2).map(p => p[0]).join('').toUpperCase()}
            </span>
          )}
          <span className="text-slate-700 text-xs font-semibold">{value.fullName}</span>
        </div>
      ) : (
        <span className="text-slate-400 text-xs italic">Chưa chỉ định</span>
      ),
    },
    {
      key: '_count',
      label: 'Nhân sự',
      render: (value, department) => (
        <button
          type="button"
          onClick={() => {
            setDetailTab('employees')
            setDetailingDepartmentId(department.id)
          }}
          className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-100 hover:bg-blue-100 hover:text-blue-800 transition"
        >
          {value?.employees ?? 0} người
        </button>
      ),
    },
    {
      key: '_count_assets',
      label: 'Tài sản',
      render: (_, department) => (
        <button
          type="button"
          onClick={() => {
            setDetailTab('assets')
            setDetailingDepartmentId(department.id)
          }}
          className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800 transition"
        >
          {department._count?.ownedAssets ?? 0} thiết bị
        </button>
      ),
    },
    {
      key: 'totalAssetValue',
      label: 'Tổng giá trị',
      render: (value) => (
        <span className="font-semibold text-slate-800 text-xs">
          {value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '0 ₫'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, department) => (
        <div className="flex items-center gap-1">
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            type="button"
            title={`Xem chi tiết ${department.name}`}
            onClick={() => {
              setDetailTab('overview')
              setDetailingDepartmentId(department.id)
            }}
          >
            <Eye size={16} />
          </button>
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
            type="button"
            title={`Sửa ${department.name}`}
            onClick={() => openEditModal(department)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700"
            type="button"
            title={`Xóa ${department.name}`}
            onClick={() => setDeletingDepartment(department)}
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
        eyebrow="Cơ cấu doanh nghiệp"
        title="Quản lý phòng ban"
        description="Tổ chức nhân sự và tài sản theo từng đơn vị trong doanh nghiệp."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Thêm phòng ban
          </Button>
        )}
      />

      {/* Dashboard Summary Statistics */}
      <div className="grid gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Building size={24} />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng phòng ban</span>
            <strong className="text-xl font-black text-slate-800">{summary.totalDepartments} đơn vị</strong>
          </div>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng nhân viên</span>
            <strong className="text-xl font-black text-slate-800">{summary.totalEmployees} người</strong>
          </div>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Boxes size={24} />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng tài sản</span>
            <strong className="text-xl font-black text-slate-800">{summary.totalAssets} thiết bị</strong>
          </div>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Coins size={24} />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị tài sản</span>
            <strong className="text-lg font-black text-slate-800">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(summary.totalAssetValue)}
            </strong>
          </div>
        </div>
      </div>

      {error && !isLoading && <ResourceError message={error} onRetry={loadDepartments} />}

      {isLoading ? (
        <ResourceTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredDepartments}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên, mã phòng ban hoặc mô tả..."
        />
      )}

      {editingDepartment && (
        <Modal
          title={editingDepartment.id ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}
          description="Cấu trúc cơ bản quản lý hành chính, tổ chức và ngân sách."
          size="lg"
          onClose={closeFormModal}
        >
          <form className="grid gap-5 max-h-[80vh] overflow-y-auto pr-1" noValidate onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Mã phòng ban"
                name="code"
                value={form.code}
                error={formErrors.code}
                placeholder="VD: IT"
                maxLength={50}
                autoFocus={!editingDepartment.id}
                onChange={updateField}
              />
              <FormField
                label="Tên phòng ban"
                name="name"
                value={form.name}
                error={formErrors.name}
                placeholder="VD: Phòng Công nghệ thông tin"
                maxLength={100}
                onChange={updateField}
              />
              
              <SearchableSelect
                label="Trưởng bộ phận"
                placeholder="Chọn nhân viên làm trưởng phòng..."
                options={employeeOptions}
                value={form.managerId}
                onChange={(val) => setForm((current) => ({ ...current, managerId: val }))}
              />
              <FormField
                as="select"
                label="Phòng ban cha"
                name="parentId"
                value={form.parentId}
                error={formErrors.parentId}
                options={parentOptions}
                onChange={updateField}
              />

              <FormField
                label="Chi nhánh"
                name="branch"
                value={form.branch}
                error={formErrors.branch}
                placeholder="VD: Chi nhánh miền Bắc"
                maxLength={100}
                onChange={updateField}
              />
              <FormField
                as="select"
                label="Trạng thái"
                name="status"
                value={form.status}
                error={formErrors.status}
                options={[
                  { value: 'ACTIVE', label: '🟢 Hoạt động' },
                  { value: 'SUSPENDED', label: '🟡 Tạm ngưng' },
                  { value: 'DISSOLVED', label: '🔴 Giải thể' },
                ]}
                onChange={updateField}
              />

              <FormField
                label="Email phòng ban"
                name="email"
                type="email"
                value={form.email}
                error={formErrors.email}
                placeholder="VD: it-dept@company.com"
                maxLength={255}
                onChange={updateField}
              />
              <FormField
                label="Số điện thoại"
                name="phone"
                value={form.phone}
                error={formErrors.phone}
                placeholder="VD: 024-12345678"
                maxLength={50}
                onChange={updateField}
              />

              <FormField
                label="Ngày thành lập"
                name="establishedDate"
                type="date"
                value={form.establishedDate}
                error={formErrors.establishedDate}
                onChange={updateField}
              />
              <FormField
                label="Ngân sách năm (VND)"
                name="annualBudget"
                type="number"
                value={form.annualBudget}
                error={formErrors.annualBudget}
                placeholder="VD: 500000000"
                onChange={updateField}
              />
            </div>

            <FormField
              as="textarea"
              label="Mô tả"
              name="description"
              value={form.description}
              error={formErrors.description}
              hint={`${form.description.length}/500`}
              placeholder="Mô tả chức năng của phòng ban"
              maxLength={500}
              onChange={updateField}
            />

            <div className="form-actions mt-6">
              <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                {editingDepartment.id ? 'Lưu thay đổi' : 'Thêm phòng ban'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {detailingDepartmentId && (
        <Modal
          title={detailData ? `Phòng ban: ${detailData.name}` : 'Đang tải chi tiết...'}
          description={detailData?.description || 'Xem thông tin quản lý hành chính, nhân sự, tài sản và ngân sách liên kết.'}
          size="lg"
          onClose={() => setDetailingDepartmentId(null)}
        >
          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-brand-600 size-10" />
              <p className="text-sm text-slate-500 font-medium">Đang liên kết dữ liệu...</p>
            </div>
          ) : detailData ? (
            <div className="space-y-6">
              {/* Stats overview cards */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nhân viên</span>
                    <strong className="text-base font-black text-slate-800">{detailData._count?.employees ?? 0} người</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tài sản</span>
                    <strong className="text-base font-black text-slate-800">{detailData._count?.ownedAssets ?? 0} thiết bị</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <Coins size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị</span>
                    <strong className="text-sm font-black text-slate-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.totalAssetValue || 0)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="grid size-9 place-items-center rounded-lg bg-purple-50 text-purple-600">
                    <Coins size={18} />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ngân sách năm</span>
                    <strong className="text-sm font-black text-slate-800">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.annualBudget || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Manager info */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Building size={20} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trưởng phòng</span>
                  {detailData.manager ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-slate-800">{detailData.manager.fullName}</span>
                      <span className="text-xs text-slate-500">({detailData.manager.email})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa chỉ định trưởng phòng</span>
                  )}
                </div>
              </div>

              {/* Tab navigation */}
              <div className="border-b border-slate-100">
                <nav className="flex flex-wrap gap-4">
                  {[
                    { key: 'overview', label: 'Tổng quan' },
                    { key: 'employees', label: `Nhân viên (${detailData.employees?.length ?? 0})` },
                    { key: 'assets', label: `Tài sản (${detailData.ownedAssets?.length ?? 0})` },
                    { key: 'requests', label: `Yêu cầu (${detailData.supportRequests?.length ?? 0})` },
                    { key: 'reports', label: 'Báo cáo' },
                    { key: 'history', label: `Lịch sử (${detailData.auditLogs?.length ?? 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setIsEditingQuotas(false)
                        setDetailTab(tab.key)
                      }}
                      className={`pb-3 text-xs font-extrabold uppercase tracking-wider border-b-2 transition-all ${
                        detailTab === tab.key
                          ? 'border-brand-600 text-brand-600'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab contents */}
              <div className="max-h-[350px] overflow-y-auto pr-1">
                {detailTab === 'overview' && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Thông tin chung</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="block text-slate-400 font-semibold">Mã phòng ban</span>
                          <span className="font-mono font-bold text-slate-800">{detailData.code}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold">Chi nhánh</span>
                          <span className="font-bold text-slate-800">{detailData.branch || 'Mặc định'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold">Ngày thành lập</span>
                          <span className="font-bold text-slate-800">
                            {detailData.establishedDate ? new Date(detailData.establishedDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold">Trạng thái</span>
                          <span className="font-bold text-slate-800">
                            {detailData.status === 'ACTIVE' ? '🟢 Hoạt động' : detailData.status === 'SUSPENDED' ? '🟡 Tạm ngưng' : '🔴 Giải thể'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold">Email liên hệ</span>
                          <span className="font-bold text-slate-800">{detailData.email || 'Chưa có'}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 font-semibold">Số điện thoại</span>
                          <span className="font-bold text-slate-800">{detailData.phone || 'Chưa có'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-slate-400 font-semibold">Phòng ban cha</span>
                          <span className="font-bold text-slate-800">
                            {detailData.parent ? `${detailData.parent.name} (${detailData.parent.code})` : 'Cấp cao nhất'}
                          </span>
                        </div>
                      </div>

                      {/* Budget Section */}
                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">Tình hình ngân sách</h4>
                        <div className="grid grid-cols-3 gap-2 text-[11px] mb-2">
                          <div>
                            <span className="block text-slate-400">Ngân sách năm</span>
                            <strong className="text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.annualBudget || 0)}</strong>
                          </div>
                          <div>
                            <span className="block text-slate-400">Đã sử dụng</span>
                            <strong className="text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.budgetUsed || 0)}</strong>
                          </div>
                          <div>
                            <span className="block text-slate-400">Còn lại</span>
                            <strong className="text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.budgetRemaining || 0)}</strong>
                          </div>
                        </div>
                        {/* Progress bar */}
                        {(() => {
                          const pct = detailData.annualBudget > 0 ? (detailData.budgetUsed / detailData.annualBudget) * 100 : 0
                          const progressColor = pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          return (
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          )
                        })()}
                      </div>
                    </div>

                    {/* Quotas Section */}
                    <div className="border-l border-slate-100 pl-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Hạn mức tài sản</h4>
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingQuotas) {
                              saveQuotas()
                            } else {
                              const initialLocal = {}
                              categories.forEach(cat => {
                                const q = detailData.quotas?.find(item => item.categoryId === cat.id)
                                initialLocal[cat.id] = q ? q.maxQuantity : 0
                              })
                              setLocalQuotas(initialLocal)
                              setIsEditingQuotas(true)
                            }
                          }}
                          className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          {isEditingQuotas ? 'Lưu hạn mức' : 'Điều chỉnh'}
                        </button>
                      </div>

                      <div className="max-h-60 overflow-y-auto pr-1">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="py-2">Danh mục</th>
                              <th className="py-2 text-right">Đã cấp / Tối đa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {categories.map((cat) => {
                              const currentAllocated = detailData.ownedAssets?.filter(a => a.category?.id === cat.id).length || 0
                              const maxQty = isEditingQuotas
                                ? (localQuotas[cat.id] ?? 0)
                                : (detailData.quotas?.find(q => q.categoryId === cat.id)?.maxQuantity ?? 0)
                              
                              return (
                                <tr key={cat.id} className="text-slate-700">
                                  <td className="py-2.5 font-semibold">{cat.name}</td>
                                  <td className="py-2.5 text-right font-medium">
                                    {isEditingQuotas ? (
                                      <div className="flex items-center justify-end gap-2">
                                        <span className="text-[10px] text-slate-400">Đang có: {currentAllocated} | Tối đa:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right text-xs focus:border-brand-500 focus:outline-none"
                                          value={localQuotas[cat.id] ?? 0}
                                          onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0)
                                            setLocalQuotas(prev => ({ ...prev, [cat.id]: val }))
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <span className={currentAllocated > maxQty && maxQty > 0 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                                        {currentAllocated} / {maxQty > 0 ? `${maxQty} thiết bị` : 'Không hạn chế'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'employees' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <input
                        type="text"
                        placeholder="Tìm nhân viên trong phòng ban..."
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full sm:w-64 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    {filteredDetailEmployees.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5">Họ tên</th>
                            <th className="py-2.5">Mã NV</th>
                            <th className="py-2.5">Chức vụ</th>
                            <th className="py-2.5">Email</th>
                            <th className="py-2.5 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredDetailEmployees.map((emp) => (
                            <tr key={emp.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-2.5 font-bold flex items-center gap-2">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl.startsWith('http') ? emp.avatarUrl : `http://localhost:5000${emp.avatarUrl}`}
                                    alt={emp.fullName}
                                    className="size-6 rounded-full object-cover border border-slate-200"
                                    onError={e => { e.target.style.display = 'none' }}
                                  />
                                ) : (
                                  <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-500">
                                    {emp.fullName.split(' ').slice(-2).map(p => p[0]).join('').toUpperCase()}
                                  </span>
                                )}
                                {emp.fullName}
                              </td>
                              <td className="py-2.5 font-mono text-slate-500">{emp.employeeCode}</td>
                              <td className="py-2.5">{emp.position}</td>
                              <td className="py-2.5">{emp.email}</td>
                              <td className="py-2.5 text-right">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                  emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                                }`}>
                                  {emp.status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic text-xs">
                        Không tìm thấy nhân viên trực thuộc.
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'assets' && (
                  <div className="space-y-6">
                    {Object.keys(groupedAssets).length > 0 ? (
                      Object.entries(groupedAssets).map(([catName, list]) => {
                        const catTotalValue = list.reduce((s, a) => s + (a.value ? Number(a.value) : 0), 0)
                        return (
                          <div key={catName} className="space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-brand-500" />
                                {catName} ({list.length} thiết bị)
                              </h5>
                              <span className="text-[11px] font-bold text-slate-400">
                                Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(catTotalValue)}
                              </span>
                            </div>
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  <th className="py-1">Mã TS</th>
                                  <th className="py-1">Tên tài sản</th>
                                  <th className="py-1">Giá trị</th>
                                  <th className="py-1 text-right">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {list.map((asset) => (
                                  <tr key={asset.id} className="text-slate-600 hover:bg-slate-50/50">
                                    <td className="py-2 font-mono font-bold text-slate-800">{asset.assetCode}</td>
                                    <td className="py-2 font-medium">{asset.name}</td>
                                    <td className="py-2 text-slate-500">
                                      {asset.value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(asset.value) : '0 ₫'}
                                    </td>
                                    <td className="py-2 text-right">
                                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                        asset.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                                        asset.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700' :
                                        asset.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                      }`}>
                                        {asset.status === 'AVAILABLE' ? 'Sẵn sàng' :
                                         asset.status === 'ASSIGNED' ? 'Đã cấp' :
                                         asset.status === 'MAINTENANCE' ? 'Bảo trì' : 'Hỏng/Mất'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-10 text-xs text-slate-400 italic">
                        Không có tài sản nào thuộc sở hữu của phòng ban này.
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'requests' && (
                  <div>
                    {detailData.supportRequests?.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5">Mã phiếu</th>
                            <th className="py-2.5">Loại yêu cầu</th>
                            <th className="py-2.5">Độ ưu tiên</th>
                            <th className="py-2.5">Người yêu cầu</th>
                            <th className="py-2.5">Mô tả</th>
                            <th className="py-2.5">Chi phí dự kiến</th>
                            <th className="py-2.5 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {detailData.supportRequests.map((req) => {
                            const requestTypeLabels = {
                              MAINTENANCE: 'Bảo trì / Sửa chữa',
                              NEW_ALLOCATION: 'Cấp phát mới',
                              EXCHANGE: 'Thay thế thiết bị',
                              RECALL: 'Thu hồi tài sản',
                              INCIDENT: 'Sự cố hỏng hóc',
                              SOFTWARE_INSTALL: 'Cài đặt phần mềm',
                              ACCESS_GRANT: 'Cấp quyền truy cập',
                            }
                            const priorityLabels = {
                              LOW: 'Thấp',
                              MEDIUM: 'Trung bình',
                              HIGH: 'Cao'
                            }
                            const statusLabels = {
                              PENDING: 'Chờ duyệt',
                              APPROVED: 'Đã duyệt',
                              IN_PROGRESS: 'Đang xử lý',
                              WAITING_USER: 'Chờ phản hồi',
                              COMPLETED: 'Hoàn thành',
                              REJECTED: 'Từ chối',
                              CANCELLED: 'Hủy bỏ',
                            }
                            return (
                              <tr key={req.id} className="text-slate-700 hover:bg-slate-50/50">
                                <td className="py-2.5 font-mono text-slate-500">{req.id.substring(0, 8).toUpperCase()}</td>
                                <td className="py-2.5 font-semibold">{requestTypeLabels[req.type] || req.type}</td>
                                <td className="py-2.5">
                                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                    req.priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    req.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    'bg-slate-50 text-slate-600 border border-slate-100'
                                  }`}>
                                    {priorityLabels[req.priority] || req.priority}
                                  </span>
                                </td>
                                <td className="py-2.5">{req.requester?.fullName}</td>
                                <td className="py-2.5 max-w-xs truncate" title={req.description}>{req.description}</td>
                                <td className="py-2.5 font-semibold text-slate-600">
                                  {req.repairCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(req.repairCost) : '0 ₫'}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                    req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                    req.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                                    req.status === 'REJECTED' || req.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                  }`}>
                                    {statusLabels[req.status] || req.status}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10 text-xs text-slate-400 italic">
                        Không có yêu cầu tài sản nào từ nhân viên thuộc phòng ban.
                      </div>
                    )}
                  </div>
                )}

                {detailTab === 'reports' && (
                  <div className="grid gap-5 sm:grid-cols-3 text-xs">
                    {/* Category stats card */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText size={15} className="text-slate-500" />
                        Phân bổ theo danh mục
                      </h5>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {Object.entries(groupedAssets).length > 0 ? (
                          Object.entries(groupedAssets).map(([catName, list]) => {
                            const pct = detailData.ownedAssets?.length ? (list.length / detailData.ownedAssets.length) * 100 : 0
                            return (
                              <div key={catName}>
                                <div className="flex justify-between text-[11px] mb-0.5 text-slate-600">
                                  <span>{catName}</span>
                                  <strong>{list.length} TS ({pct.toFixed(0)}%)</strong>
                                </div>
                                <div className="w-full bg-slate-200/60 rounded-full h-1">
                                  <div className="bg-brand-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-slate-400 italic text-[11px] py-4 text-center">Chưa có tài sản</div>
                        )}
                      </div>
                    </div>

                    {/* Rates card */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldAlert size={15} className="text-slate-500" />
                        Chỉ số hỏng hóc & Bảo trì
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <span className="block text-slate-400">Tỷ lệ hư hỏng (Broken/Lost)</span>
                          {(() => {
                            const broken = detailData.ownedAssets?.filter(a => a.status === 'BROKEN' || a.status === 'LOST').length || 0
                            const total = detailData.ownedAssets?.length || 0
                            const rate = total > 0 ? ((broken / total) * 100).toFixed(1) : '0.0'
                            return (
                              <div className="flex items-baseline gap-2 mt-1">
                                <strong className="text-2xl font-black text-slate-800">{rate}%</strong>
                                <span className="text-[10px] text-slate-400">({broken}/{total} thiết bị)</span>
                              </div>
                            )
                          })()}
                        </div>
                        <div>
                          <span className="block text-slate-400">Tổng chi phí bảo trì (đã hoàn thành)</span>
                          {(() => {
                            const cost = detailData.supportRequests
                              ?.filter(r => r.status === 'COMPLETED')
                              .reduce((s, r) => s + Number(r.repairCost || 0), 0) || 0
                            return (
                              <strong className="text-base font-black text-slate-800 mt-1 block">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cost)}
                              </strong>
                            )
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Depreciation Card */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
                      <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Wrench size={15} className="text-slate-500" />
                        Dự báo Khấu hao (Hàng năm)
                      </h5>
                      <div className="space-y-2">
                        <div>
                          <span className="block text-slate-400">Tổng nguyên giá tài sản</span>
                          <strong className="text-sm font-black text-slate-700 block mt-0.5">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detailData.totalAssetValue || 0)}
                          </strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                          <div>
                            <span className="block text-[10px] text-slate-400">Khấu hao năm (10%)</span>
                            <strong className="text-xs font-black text-red-600 block mt-0.5">
                              -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((detailData.totalAssetValue || 0) * 0.1)}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[10px] text-slate-400">Giá trị còn lại</span>
                            <strong className="text-xs font-black text-emerald-600 block mt-0.5">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((detailData.totalAssetValue || 0) * 0.9)}
                            </strong>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal pt-1.5">
                          * Dữ liệu dựa trên tỷ lệ khấu hao giả định chung 10% mỗi năm đối với toàn bộ danh mục tài sản thuộc phòng ban.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'history' && (
                  <div>
                    {detailData.auditLogs?.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 w-36">Thời gian</th>
                            <th className="py-2.5 w-32">Người thực hiện</th>
                            <th className="py-2.5 w-28">Hành động</th>
                            <th className="py-2.5">Nội dung thay đổi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {detailData.auditLogs.map((log) => {
                            const actionLabels = {
                              CREATE: 'Khởi tạo',
                              UPDATE: 'Cập nhật',
                              DELETE: 'Xóa bỏ',
                              UPDATE_QUOTAS: 'Cập nhật hạn mức',
                            }
                            const actorName = log.actor?.employee?.fullName || log.actor?.email || 'Hệ thống'
                            return (
                              <tr key={log.id} className="text-slate-700 hover:bg-slate-50/50">
                                <td className="py-2.5 text-slate-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                                <td className="py-2.5 font-bold text-slate-700">{actorName}</td>
                                <td className="py-2.5">
                                  <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                    log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    'bg-purple-50 text-purple-700 border border-purple-100'
                                  }`}>
                                    {actionLabels[log.action] || log.action}
                                  </span>
                                </td>
                                <td className="py-2.5 text-slate-600 max-w-md break-words">{formatLogDetails(log)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-10 text-xs text-slate-400 italic">
                        Không có lịch sử thay đổi nào được ghi lại.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-red-500 text-xs font-semibold">
              Đã xảy ra lỗi khi tải dữ liệu phòng ban.
            </div>
          )}
          <div className="form-actions mt-6">
            <Button type="button" onClick={() => setDetailingDepartmentId(null)}>Đóng</Button>
          </div>
        </Modal>
      )}

      {deletingDepartment && (
        <ConfirmDialog
          title={`Xóa phòng ban "${deletingDepartment.name}"?`}
          message="Không thể xóa phòng ban đang có nhân viên trực thuộc hoặc phòng ban con."
          confirmLabel="Xóa phòng ban"
          isSubmitting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => !isDeleting && setDeletingDepartment(null)}
        />
      )}

      {toast && <Toast {...toast} onClose={() =>Toast && setToast(null)} />}
    </div>
  )
}
