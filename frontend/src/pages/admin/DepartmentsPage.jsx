import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { departmentApi } from '../../api/departments'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const EMPTY_FORM = Object.freeze({ name: '', description: '' })

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([])
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

  useAutoDismiss(toast, setToast)

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      setDepartments(await departmentApi.list())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    departmentApi
      .list()
      .then((data) => {
        if (isActive) setDepartments(data)
      })
      .catch((requestError) => {
        if (isActive) setError(requestError.message)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const filteredDepartments = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return departments

    return departments.filter((department) =>
      `${department.name} ${department.description || ''}`.toLowerCase().includes(keyword),
    )
  }, [departments, search])

  function openCreateModal() {
    setEditingDepartment({ id: null })
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(department) {
    setEditingDepartment(department)
    setForm({ name: department.name, description: department.description || '' })
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
    if (form.name.trim().length < 2) nextErrors.name = 'Tên phòng ban cần ít nhất 2 ký tự.'
    if (form.description.length > 500) nextErrors.description = 'Mô tả không được vượt quá 500 ký tự.'
    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
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
        setFormErrors({ name: requestError.message })
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

  const columns = [
    { key: 'name', label: 'Tên phòng ban' },
    {
      key: 'description',
      label: 'Mô tả',
      render: (value) => value || 'Chưa có mô tả',
    },
    {
      key: 'updatedAt',
      label: 'Cập nhật',
      render: (value) => new Intl.DateTimeFormat('vi-VN').format(new Date(value)),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, department) => (
        <div className="flex items-center gap-1">
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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold text-brand-700">Cơ cấu doanh nghiệp</p>
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Quản lý phòng ban</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tổ chức nhân sự và tài sản theo từng đơn vị trong doanh nghiệp.
          </p>
        </div>
        <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
          <Plus size={17} />
          Thêm phòng ban
        </Button>
      </header>

      {error && !isLoading && <ResourceError message={error} onRetry={loadDepartments} />}

      {isLoading ? (
        <ResourceTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredDepartments}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên hoặc mô tả phòng ban..."
        />
      )}

      {editingDepartment && (
        <Modal
          title={editingDepartment.id ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}
          description="Phòng ban được sử dụng để phân nhóm nhân viên và phạm vi kiểm kê."
          onClose={closeFormModal}
        >
          <form className="grid gap-5" noValidate onSubmit={handleSave}>
            <FormField
              label="Tên phòng ban"
              name="name"
              value={form.name}
              error={formErrors.name}
              placeholder="VD: Phòng Kỹ thuật"
              maxLength={100}
              autoFocus
              onChange={updateField}
            />
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
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
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

      {deletingDepartment && (
        <ConfirmDialog
          title={`Xóa phòng ban "${deletingDepartment.name}"?`}
          message="Không thể xóa phòng ban đang có nhân viên."
          confirmLabel="Xóa phòng ban"
          isSubmitting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => !isDeleting && setDeletingDepartment(null)}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
