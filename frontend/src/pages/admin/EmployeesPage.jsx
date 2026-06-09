import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, MapPin } from 'lucide-react'
import { departmentApi } from '../../api/departments'
import { employeeApi } from '../../api/employees'
import { locationApi } from '../../api/locations'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const EMPTY_FORM = Object.freeze({
  employeeCode: '',
  fullName: '',
  email: '',
  departmentId: '',
  status: 'ACTIVE',
})

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', departmentId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingEmployee, setEditingEmployee] = useState(null)
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
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(employee) {
    setEditingEmployee(employee)
    setForm({
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: employee.email,
      departmentId: employee.departmentId ? String(employee.departmentId) : '',
      status: employee.status,
    })
    setFormErrors({})
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingEmployee(null)
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
    if (!form.employeeCode.trim()) nextErrors.employeeCode = 'Vui lòng nhập mã nhân viên.'
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
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        status: form.status,
      }

      if (editingEmployee.id) {
        await employeeApi.update(editingEmployee.id, payload)
        setToast({ type: 'success', message: 'Cập nhật nhân viên thành công.' })
      } else {
        await employeeApi.create({
          ...payload,
          employeeCode: form.employeeCode.trim(),
        })
        setToast({ type: 'success', message: 'Thêm nhân viên thành công.' })
      }

      setEditingEmployee(null)
      setForm(EMPTY_FORM)
      await loadEmployees(filters)
    } catch (requestError) {
      if (requestError.errorCode === 'VALIDATION_ERROR') {
        setToast({ type: 'error', message: requestError.message })
      } else {
        setToast({ type: 'error', message: requestError.message })
      }
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
    { key: 'fullName', label: 'Họ tên' },
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
          title={editingEmployee.id ? 'Cập nhật nhân viên' : 'Thêm nhân viên'}
          description="Hồ sơ nhân viên là điều kiện để tạo tài khoản USER và bàn giao tài sản."
          onClose={closeFormModal}
        >
          <form className="grid gap-5" noValidate onSubmit={handleSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Mã nhân viên"
                name="employeeCode"
                value={form.employeeCode}
                error={formErrors.employeeCode}
                placeholder="VD: EMP005"
                disabled={Boolean(editingEmployee.id)}
                onChange={updateField}
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
            <FormField
              label="Email công ty"
              name="email"
              type="email"
              value={form.email}
              error={formErrors.email}
              placeholder="name@company.local"
              onChange={updateField}
            />
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
            </div>
            <div className="form-actions">
              <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                {editingEmployee.id ? 'Lưu thay đổi' : 'Thêm nhân viên'}
              </Button>
            </div>
          </form>
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
