import { useCallback, useEffect, useState } from 'react'
import { CircleAlert, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { categoryApi } from '../../api/categories'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'

const EMPTY_FORM = Object.freeze({
  name: '',
  description: '',
})

function CategoryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div className="h-11 w-full max-w-[390px] animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
      <div className="grid gap-4 p-5">
        {[1, 2, 3, 4].map((row) => (
          <div className="grid grid-cols-4 gap-5" key={row}>
            {[1, 2, 3, 4].map((cell) => (
              <div className="h-5 animate-pulse rounded-md bg-slate-100" key={cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const loadCategories = useCallback(async (searchValue = '') => {
    setIsLoading(true)
    setError('')

    try {
      const data = await categoryApi.list(searchValue)
      setCategories(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCategories(search)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [loadCategories, search])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function openCreateModal() {
    setEditingCategory({ id: null })
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(category) {
    setEditingCategory(category)
    setForm({
      name: category.name,
      description: category.description || '',
    })
    setFormErrors({})
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingCategory(null)
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

    if (form.name.trim().length < 2) {
      nextErrors.name = 'Tên danh mục phải có ít nhất 2 ký tự.'
    }

    if (form.description.length > 500) {
      nextErrors.description = 'Mô tả không được vượt quá 500 ký tự.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave(event) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      }

      if (editingCategory.id) {
        await categoryApi.update(editingCategory.id, payload)
        setToast({ type: 'success', message: 'Cập nhật danh mục thành công.' })
      } else {
        await categoryApi.create(payload)
        setToast({ type: 'success', message: 'Thêm danh mục thành công.' })
      }

      setEditingCategory(null)
      setForm(EMPTY_FORM)
      setFormErrors({})
      await loadCategories(search)
    } catch (requestError) {
      if (requestError.errorCode === 'CATEGORY_ALREADY_EXISTS') {
        setFormErrors({ name: 'Tên danh mục này đã tồn tại.' })
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
      await categoryApi.remove(deletingCategory.id)
      setDeletingCategory(null)
      setToast({ type: 'success', message: 'Xóa danh mục thành công.' })
      await loadCategories(search)
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
      { key: 'name', label: 'Tên danh mục' },
      {
        key: 'description',
        label: 'Mô tả',
        render: (value) => value || 'Chưa có mô tả',
      },
      {
        key: 'status',
        label: 'Trạng thái',
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: 'actions',
        label: 'Thao tác',
        render: (_value, category) => (
          <div className="flex items-center gap-1">
            <button
              className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
              type="button"
              title={`Sửa ${category.name}`}
              onClick={() => openEditModal(category)}
            >
              <Pencil size={16} />
            </button>
            <button
              className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700"
              type="button"
              title={`Xóa ${category.name}`}
              onClick={() => setDeletingCategory(category)}
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
        eyebrow="Quản lý dữ liệu"
        title="Danh mục tài sản"
        description="Chuẩn hóa nhóm tài sản dùng trong toàn hệ thống."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Thêm danh mục
          </Button>
        )}
      />

      {error && !isLoading && (
        <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 shrink-0" size={18} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" type="button" onClick={() => loadCategories(search)}>
            <RefreshCw size={15} />
            Thử lại
          </Button>
        </div>
      )}

      {isLoading ? (
        <CategoryTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={categories}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm danh mục..."
        />
      )}

      {editingCategory && (
        <Modal
          title={editingCategory.id ? 'Cập nhật danh mục' : 'Thêm danh mục'}
          description="Thông tin này sẽ được sử dụng khi tạo và phân loại tài sản."
          onClose={closeFormModal}
        >
          <form className="grid gap-5" onSubmit={handleSave}>
            <FormField
              label="Tên danh mục"
              name="name"
              value={form.name}
              error={formErrors.name}
              placeholder="VD: Laptop"
              maxLength={100}
              autoFocus
              required
              onChange={updateField}
            />
            <FormField
              as="textarea"
              label="Mô tả"
              name="description"
              value={form.description}
              error={formErrors.description}
              hint={`${form.description.length}/500`}
              placeholder="Mô tả ngắn về nhóm tài sản"
              maxLength={500}
              onChange={updateField}
            />
            <div className="form-actions mt-1">
              <Button
                className="w-full sm:w-auto"
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={closeFormModal}
              >
                Hủy
              </Button>
              <Button className="w-full sm:w-auto" type="submit" disabled={isSaving}>
                {isSaving && (
                  <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
                )}
                {editingCategory.id ? 'Lưu thay đổi' : 'Thêm danh mục'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deletingCategory && (
        <ConfirmDialog
          title={`Xóa danh mục "${deletingCategory.name}"?`}
          message="Danh mục sẽ bị xóa khỏi hệ thống."
          confirmLabel="Xóa danh mục"
          isSubmitting={isDeleting}
          onConfirm={handleDelete}
          onClose={() => !isDeleting && setDeletingCategory(null)}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
