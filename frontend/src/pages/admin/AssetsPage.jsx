import { useCallback, useEffect, useState } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { assetApi } from '../../api/assets'
import { categoryApi } from '../../api/categories'
import { departmentApi } from '../../api/departments'
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

const ASSET_STATUSES = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'ASSIGNED', label: 'Đã bàn giao' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'BROKEN', label: 'Bị hỏng' },
  { value: 'LOST', label: 'Thất lạc' },
  { value: 'DISPOSED', label: 'Đã thanh lý' },
]

const EMPTY_FORM = Object.freeze({
  assetCode: '',
  name: '',
  categoryId: '',
  serialNumber: '',
  purchaseDate: '',
  value: '',
  status: 'AVAILABLE',
  imageUrl: '',
  notes: '',
})

function toDateInputValue(value) {
  return value ? String(value).slice(0, 10) : ''
}

function formatCurrency(value) {
  if (value === null || typeof value === 'undefined') return 'Chưa cập nhật'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
}

export default function AssetsPage() {
  const [searchParams] = useSearchParams()
  const [assets, setAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [filters, setFilters] = useState({
    keyword: searchParams.get('search') || '',
    status: '',
    categoryId: '',
    departmentId: '',
  })

  useEffect(() => {
    const searchVal = searchParams.get('search') || ''
    setFilters((current) => ({ ...current, keyword: searchVal }))
  }, [searchParams])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingAsset, setEditingAsset] = useState(null)
  const [viewingAsset, setViewingAsset] = useState(null)
  const [deletingAsset, setDeletingAsset] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  useAutoDismiss(toast, setToast)

  const loadAssets = useCallback(async (activeFilters = filters) => {
    setIsLoading(true)
    setError('')
    try {
      setAssets(await assetApi.list(activeFilters))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    Promise.all([categoryApi.list(), departmentApi.list()])
      .then(([categoryData, departmentData]) => {
        setCategories(categoryData)
        setDepartments(departmentData)
      })
      .catch(() => {
        setCategories([])
        setDepartments([])
      })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadAssets(filters), 300)
    return () => window.clearTimeout(timer)
  }, [filters, loadAssets])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openCreateModal() {
    setEditingAsset({ id: null })
    setForm(EMPTY_FORM)
    setFormErrors({})
  }

  function openEditModal(asset) {
    setEditingAsset(asset)
    setForm({
      assetCode: asset.assetCode,
      name: asset.name,
      categoryId: String(asset.categoryId),
      serialNumber: asset.serialNumber || '',
      purchaseDate: toDateInputValue(asset.purchaseDate),
      value: asset.value === null ? '' : String(asset.value),
      status: asset.status,
      imageUrl: asset.imageUrl || '',
      notes: asset.notes || '',
    })
    setFormErrors({})
  }

  function closeFormModal() {
    if (!isSaving) {
      setEditingAsset(null)
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
    if (!form.assetCode.trim()) nextErrors.assetCode = 'Vui lòng nhập mã tài sản.'
    if (form.name.trim().length < 2) nextErrors.name = 'Tên tài sản cần ít nhất 2 ký tự.'
    if (!form.categoryId) nextErrors.categoryId = 'Vui lòng chọn danh mục.'
    if (form.value !== '' && Number(form.value) < 0) nextErrors.value = 'Giá trị không được nhỏ hơn 0.'
    if (form.imageUrl && !/^https?:\/\/.+/i.test(form.imageUrl)) nextErrors.imageUrl = 'URL hình ảnh không hợp lệ.'
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
        categoryId: Number(form.categoryId),
        serialNumber: form.serialNumber.trim() || null,
        purchaseDate: form.purchaseDate ? `${form.purchaseDate}T00:00:00.000Z` : null,
        value: form.value === '' ? null : Number(form.value),
        status: form.status,
        imageUrl: form.imageUrl.trim() || null,
        notes: form.notes.trim() || null,
      }

      if (editingAsset.id) {
        await assetApi.update(editingAsset.id, payload)
        setToast({ type: 'success', message: 'Cập nhật tài sản thành công.' })
      } else {
        await assetApi.create({ ...payload, assetCode: form.assetCode.trim() })
        setToast({ type: 'success', message: 'Thêm tài sản thành công.' })
      }

      setEditingAsset(null)
      setForm(EMPTY_FORM)
      await loadAssets(filters)
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await assetApi.remove(deletingAsset.id)
      setDeletingAsset(null)
      setToast({ type: 'success', message: 'Xóa tài sản thành công.' })
      await loadAssets(filters)
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsDeleting(false)
    }
  }

  const categoryOptions = [
    { value: '', label: 'Chọn danh mục' },
    ...categories.map((category) => ({ value: String(category.id), label: category.name })),
  ]
  const departmentOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...departments.map((department) => ({ value: String(department.id), label: department.name })),
  ]

  const columns = [
    { key: 'assetCode', label: 'Mã tài sản' },
    { key: 'name', label: 'Tên tài sản' },
    { key: 'category', label: 'Danh mục', render: (value) => value?.name || 'Chưa phân loại' },
    {
      key: 'assignments',
      label: 'Đang sử dụng bởi',
      render: (value) => value?.[0]?.employee?.fullName || 'Chưa bàn giao',
    },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, asset) => (
        <div className="flex items-center gap-1">
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800" type="button" title={`Xem ${asset.name}`} onClick={() => setViewingAsset(asset)}>
            <Eye size={16} />
          </button>
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700" type="button" title={`Sửa ${asset.name}`} onClick={() => openEditModal(asset)}>
            <Pencil size={16} />
          </button>
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700" type="button" title={`Xóa ${asset.name}`} onClick={() => setDeletingAsset(asset)}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Danh mục tài sản doanh nghiệp"
        title="Quản lý tài sản"
        description="Theo dõi thông tin, trạng thái và người đang sử dụng từng tài sản."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Thêm tài sản
          </Button>
        )}
      />

      <section className="filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <FormField as="select" label="Danh mục" name="categoryFilter" value={filters.categoryId} options={[{ value: '', label: 'Tất cả danh mục' }, ...categoryOptions.slice(1)]} onChange={(event) => updateFilter('categoryId', event.target.value)} />
        <FormField as="select" label="Trạng thái" name="statusFilter" value={filters.status} options={[{ value: '', label: 'Tất cả trạng thái' }, ...ASSET_STATUSES]} onChange={(event) => updateFilter('status', event.target.value)} />
        <FormField as="select" label="Phòng ban sử dụng" name="departmentFilter" value={filters.departmentId} options={departmentOptions} onChange={(event) => updateFilter('departmentId', event.target.value)} />
        <div className="flex items-end">
          <Button className="w-full" variant="secondary" type="button" onClick={() => setFilters({ keyword: '', status: '', categoryId: '', departmentId: '' })}>
            Xóa bộ lọc
          </Button>
        </div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={() => loadAssets(filters)} />}

      {isLoading ? (
        <ResourceTableSkeleton columns={6} />
      ) : (
        <DataTable columns={columns} rows={assets} searchValue={filters.keyword} onSearchChange={(value) => updateFilter('keyword', value)} searchPlaceholder="Tìm theo mã, tên hoặc serial..." />
      )}

      {editingAsset && (
        <Modal size="lg" title={editingAsset.id ? 'Cập nhật tài sản' : 'Thêm tài sản'} description="Thông tin tài sản được sử dụng trong bàn giao, bảo trì, kiểm kê và báo cáo." onClose={closeFormModal}>
          <form className="grid gap-5" noValidate onSubmit={handleSave}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Mã tài sản" name="assetCode" value={form.assetCode} error={formErrors.assetCode} placeholder="VD: LT-0249" disabled={Boolean(editingAsset.id)} onChange={updateField} />
              <FormField label="Tên tài sản" name="name" value={form.name} error={formErrors.name} placeholder="VD: Dell Latitude 5440" onChange={updateField} />
              <FormField as="select" label="Danh mục" name="categoryId" value={form.categoryId} error={formErrors.categoryId} options={categoryOptions} onChange={updateField} />
              <FormField label="Số serial" name="serialNumber" value={form.serialNumber} placeholder="Nhập số serial" onChange={updateField} />
              <FormField label="Ngày mua" name="purchaseDate" type="date" value={form.purchaseDate} onChange={updateField} />
              <FormField label="Giá trị (VND)" name="value" type="number" min="0" value={form.value} error={formErrors.value} placeholder="VD: 25000000" onChange={updateField} />
              <FormField as="select" label="Trạng thái" name="status" value={form.status} options={ASSET_STATUSES} onChange={updateField} />
              <FormField label="URL hình ảnh" name="imageUrl" type="url" value={form.imageUrl} error={formErrors.imageUrl} placeholder="https://..." onChange={updateField} />
            </div>
            <FormField as="textarea" label="Ghi chú" name="notes" value={form.notes} hint={`${form.notes.length}/1000`} maxLength={1000} placeholder="Thông tin bổ sung về tài sản" onChange={updateField} />
            <div className="form-actions">
              <Button type="button" variant="secondary" disabled={isSaving} onClick={closeFormModal}>Hủy</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
                {editingAsset.id ? 'Lưu thay đổi' : 'Thêm tài sản'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewingAsset && (
        <Modal title={viewingAsset.name} description={`Mã tài sản: ${viewingAsset.assetCode}`} onClose={() => setViewingAsset(null)}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ['Danh mục', viewingAsset.category?.name || 'Chưa phân loại'],
              ['Serial', viewingAsset.serialNumber || 'Chưa cập nhật'],
              ['Ngày mua', viewingAsset.purchaseDate ? new Intl.DateTimeFormat('vi-VN').format(new Date(viewingAsset.purchaseDate)) : 'Chưa cập nhật'],
              ['Giá trị', formatCurrency(viewingAsset.value)],
              ['Trạng thái', ASSET_STATUSES.find((item) => item.value === viewingAsset.status)?.label || viewingAsset.status],
              ['Người sử dụng', viewingAsset.assignments?.[0]?.employee?.fullName || 'Chưa bàn giao'],
            ].map(([label, value]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 font-bold text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
          {viewingAsset.notes && <p className="mt-4 rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">{viewingAsset.notes}</p>}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã QR tài sản</h4>
            <div className="mx-auto mt-3 grid size-44 place-items-center rounded-2xl border border-slate-200 bg-white p-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/employee/assets/${viewingAsset.assetCode}`)}`}
                alt={`Mã QR của ${viewingAsset.assetCode}`}
                className="size-40"
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-400 truncate max-w-xs mx-auto font-medium">{`${window.location.origin}/employee/assets/${viewingAsset.assetCode}`}</p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 transition"
              onClick={() => {
                const link = document.createElement('a')
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/employee/assets/${viewingAsset.assetCode}`)}`
                link.download = `QR-${viewingAsset.assetCode}.png`
                link.target = '_blank'
                link.click()
              }}
            >
              Tải xuống mã QR
            </button>
          </div>
        </Modal>
      )}

      {deletingAsset && (
        <ConfirmDialog title={`Xóa tài sản "${deletingAsset.name}"?`} message="Không thể xóa tài sản đang được bàn giao cho nhân viên." confirmLabel="Xóa tài sản" isSubmitting={isDeleting} onConfirm={handleDelete} onClose={() => !isDeleting && setDeletingAsset(null)} />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
