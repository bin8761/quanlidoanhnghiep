import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { departmentApi } from '../../api/departments'
import { employeeApi } from '../../api/employees'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold text-brand-700">Nhân sự sử dụng tài sản</p>
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Quản lý nhân viên</h2>
          <p className="mt-2 text-sm text-slate-500">
            Quản lý hồ sơ nhân viên và liên kết với phòng ban trong doanh nghiệp.
          </p>
        </div>
        <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
          <Plus size={17} />
          Thêm nhân viên
        </Button>
      </header>

      <section className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
