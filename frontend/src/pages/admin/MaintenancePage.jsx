import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, Clock3, Eye, Plus, Wrench } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { assetApi } from '../../api/assets'
import { employeeApi } from '../../api/employees'
import { maintenanceApi } from '../../api/maintenance'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const requestTypeLabels = {
  INCIDENT: 'Báo hỏng tài sản (Sự cố)',
  MAINTENANCE: 'Yêu cầu bảo trì',
  NEW_ALLOCATION: 'Yêu cầu cấp phát mới',
  EXCHANGE: 'Yêu cầu đổi tài sản',
  RECALL: 'Yêu cầu thu hồi tài sản',
  SOFTWARE_INSTALL: 'Yêu cầu cài đặt phần mềm',
  ACCESS_GRANT: 'Yêu cầu cấp quyền truy cập',
  OTHER: 'Yêu cầu hỗ trợ khác',
}

const typesRequiringAsset = ['INCIDENT', 'MAINTENANCE', 'EXCHANGE', 'RECALL']

const EMPTY_CREATE = Object.freeze({ type: 'INCIDENT', assetId: '', requesterId: '', description: '', notes: '' })
const EMPTY_UPDATE = Object.freeze({
  status: 'IN_PROGRESS',
  repairCost: '',
  assetStatus: 'MAINTENANCE',
  notes: '',
})

function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMoney(value) {
  if (value === null || typeof value === 'undefined') return 'Chưa cập nhật'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="metric-card flex items-center gap-4 p-4">
      <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <strong className="block text-2xl font-extrabold text-slate-950">{value}</strong>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
    </article>
  )
}

export default function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [assets, setAssets] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', requesterId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [updateForm, setUpdateForm] = useState(EMPTY_UPDATE)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useAutoDismiss(toast, setToast)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [assetData, employeeData] = await Promise.all([assetApi.list(), employeeApi.list()])
      const activeEmployees = employeeData.filter((employee) => employee.status === 'ACTIVE')
      const requestGroups = await Promise.all(
        activeEmployees.map((employee) => maintenanceApi.list({ requesterId: employee.id })),
      )
      setAssets(assetData)
      setEmployees(employeeData)
      setRequests(
        requestGroups
          .flat()
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    if (isLoading || !requests.length) return

    const requestId = searchParams.get('requestId')
    if (!requestId) return

    const request = requests.find((item) => item.id === requestId)
    if (!request) return

    const timer = window.setTimeout(() => {
      if (['COMPLETED', 'CANCELLED'].includes(request.status)) {
        setSelected(request)
        setModal('detail')
      } else {
        openProcess(request)
      }

      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('requestId')
        return next
      }, { replace: true })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isLoading, requests, searchParams, setSearchParams])

  const filteredRequests = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return requests.filter((request) => {
      if (filters.status && request.status !== filters.status) return false
      if (filters.requesterId && request.requesterId !== filters.requesterId) return false
      if (!keyword) return true
      return [
        request.asset?.assetCode,
        request.asset?.name,
        request.requester?.fullName,
        request.description,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [filters, requests])

  const openCount = requests.filter((item) => ['PENDING', 'IN_PROGRESS'].includes(item.status)).length
  const totalCost = requests.reduce((sum, item) => sum + Number(item.repairCost || 0), 0)

  function updateField(setter) {
    return (event) => {
      const { name, value } = event.target
      setter((current) => ({ ...current, [name]: value }))
      setFormErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  function openCreate() {
    setCreateForm(EMPTY_CREATE)
    setFormErrors({})
    setModal('create')
  }

  function openProcess(request) {
    setSelected(request)
    setUpdateForm({
      status: request.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED',
      repairCost: request.repairCost === null ? '' : String(request.repairCost),
      assetStatus: request.status === 'PENDING' ? 'MAINTENANCE' : 'AVAILABLE',
      notes: request.notes || '',
    })
    setFormErrors({})
    setModal('process')
  }

  function closeModal() {
    if (isSaving) return
    setModal(null)
    setSelected(null)
  }

  async function handleCreate(event) {
    event.preventDefault()
    const nextErrors = {}
    const isAssetRequired = typesRequiringAsset.includes(createForm.type)
    if (isAssetRequired && !createForm.assetId) nextErrors.assetId = 'Vui lòng chọn tài sản.'
    if (!createForm.requesterId) nextErrors.requesterId = 'Vui lòng chọn người yêu cầu.'
    if (!createForm.description.trim()) nextErrors.description = 'Vui lòng mô tả sự cố/nội dung yêu cầu.'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await maintenanceApi.create({
        type: createForm.type,
        assetId: createForm.assetId || null,
        requesterId: createForm.requesterId,
        description: createForm.description.trim(),
        notes: createForm.notes.trim() || null,
      })
      setModal(null)
      setToast({ type: 'success', message: 'Tạo yêu cầu hỗ trợ thành công.' })
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdate(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      await maintenanceApi.updateStatus(selected.id, {
        status: updateForm.status,
        repairCost: updateForm.repairCost === '' ? null : Number(updateForm.repairCost),
        assetStatus: updateForm.assetStatus,
        notes: updateForm.notes.trim() || null,
      })
      setModal(null)
      setSelected(null)
      setToast({ type: 'success', message: 'Cập nhật yêu cầu bảo trì thành công.' })
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  const employeeOptions = [
    { value: '', label: 'Tất cả nhân viên' },
    ...employees.map((employee) => ({
      value: employee.id,
      label: `${employee.employeeCode} - ${employee.fullName}`,
    })),
  ]
  const assetOptions = [
    { value: '', label: 'Chọn tài sản' },
    ...assets
      .filter((asset) => !['LOST', 'DISPOSED'].includes(asset.status))
      .map((asset) => ({ value: asset.id, label: `${asset.assetCode} - ${asset.name}` })),
  ]

  const columns = [
    {
      key: 'type',
      label: 'Loại yêu cầu',
      render: (value, row) => requestTypeLabels[row.type] || row.type,
    },
    {
      key: 'asset',
      label: 'Tài sản',
      render: (asset) => asset ? (
        <div>
          <strong className="block text-slate-900">{asset.assetCode}</strong>
          <span className="text-xs text-slate-500">{asset.name}</span>
        </div>
      ) : (
        <span className="text-xs text-slate-400 italic">Không liên kết</span>
      ),
    },
    {
      key: 'requester',
      label: 'Người yêu cầu',
      render: (requester) => requester?.fullName || 'Chưa xác định',
    },
    { key: 'description', label: 'Nội dung' },
    { key: 'createdAt', label: 'Ngày tạo', render: formatDate },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, request) => (
        <button
          className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
          type="button"
          title={`Xem yêu cầu ${request.asset?.assetCode || ''}`}
          onClick={() =>
            ['COMPLETED', 'CANCELLED'].includes(request.status)
              ? (setSelected(request), setModal('detail'))
              : openProcess(request)
          }
        >
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Vận hành và sửa chữa"
        title="Yêu cầu bảo trì"
        description="Tiếp nhận, xử lý và theo dõi chi phí sửa chữa tài sản."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreate}>
            <Plus size={17} />
            Tạo yêu cầu
          </Button>
        )}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric icon={Wrench} label="Tổng yêu cầu" value={requests.length} tone="bg-blue-50 text-blue-700" />
        <Metric icon={Clock3} label="Đang cần xử lý" value={openCount} tone="bg-amber-50 text-amber-700" />
        <Metric icon={CircleDollarSign} label="Tổng chi phí" value={formatMoney(totalCost)} tone="bg-emerald-50 text-emerald-700" />
      </section>

      <section className="filter-panel sm:grid-cols-3">
        <FormField as="select" label="Trạng thái" name="statusFilter" value={filters.status} options={STATUS_OPTIONS} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} />
        <FormField as="select" label="Người yêu cầu" name="requesterFilter" value={filters.requesterId} options={employeeOptions} onChange={(event) => setFilters((current) => ({ ...current, requesterId: event.target.value }))} />
        <div className="flex items-end">
          <Button className="w-full" variant="secondary" type="button" onClick={() => setFilters({ keyword: '', status: '', requesterId: '' })}>Xóa bộ lọc</Button>
        </div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={loadData} />}
      {isLoading ? (
        <ResourceTableSkeleton columns={6} />
      ) : (
        <DataTable columns={columns} rows={filteredRequests} searchValue={filters.keyword} onSearchChange={(keyword) => setFilters((current) => ({ ...current, keyword }))} searchPlaceholder="Tìm tài sản, nhân viên hoặc sự cố..." />
      )}

      {modal === 'create' && (
        <Modal title="Tạo yêu cầu bảo trì" description="Admin có thể ghi nhận yêu cầu thay cho nhân viên." onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={handleCreate}>
            <FormField as="select" label="Loại yêu cầu" name="type" value={createForm.type} options={Object.entries(requestTypeLabels).map(([value, label]) => ({ value, label }))} onChange={updateField(setCreateForm)} />
            {typesRequiringAsset.includes(createForm.type) ? (
              <FormField as="select" label="Tài sản" name="assetId" value={createForm.assetId} error={formErrors.assetId} options={assetOptions} onChange={updateField(setCreateForm)} />
            ) : (
              <FormField as="select" label="Tài sản liên kết (tùy chọn)" name="assetId" value={createForm.assetId} error={formErrors.assetId} options={[{ value: '', label: 'Không liên kết tài sản' }, ...assetOptions.slice(1)]} onChange={updateField(setCreateForm)} />
            )}
            <FormField as="select" label="Người yêu cầu" name="requesterId" value={createForm.requesterId} error={formErrors.requesterId} options={[{ value: '', label: 'Chọn nhân viên' }, ...employeeOptions.slice(1)]} onChange={updateField(setCreateForm)} />
            <FormField as="textarea" label="Chi tiết yêu cầu" name="description" value={createForm.description} error={formErrors.description} maxLength={2000} placeholder="Mô tả hiện tượng hoặc nội dung yêu cầu hỗ trợ..." onChange={updateField(setCreateForm)} />
            <FormField as="textarea" label="Ghi chú" name="notes" value={createForm.notes} maxLength={1000} onChange={updateField(setCreateForm)} />
            <Actions isSaving={isSaving} label="Tạo yêu cầu" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'process' && selected && (
        <Modal title={`Xử lý yêu cầu ${selected.asset?.assetCode ? `cho ${selected.asset.assetCode}` : ''}`} description={selected.description} onClose={closeModal}>
          <form className="grid gap-5" onSubmit={handleUpdate}>
            <FormField as="select" label="Trạng thái xử lý" name="status" value={updateForm.status} options={STATUS_OPTIONS.slice(1)} onChange={updateField(setUpdateForm)} />
            {selected.assetId && (
              <>
                <FormField label="Chi phí sửa chữa (VND)" name="repairCost" type="number" min="0" value={updateForm.repairCost} onChange={updateField(setUpdateForm)} />
                <FormField as="select" label="Trạng thái tài sản" name="assetStatus" value={updateForm.assetStatus} options={[
                  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
                  { value: 'AVAILABLE', label: 'Sẵn sàng' },
                  { value: 'BROKEN', label: 'Bị hỏng' },
                  { value: 'DISPOSED', label: 'Đã thanh lý' },
                ]} onChange={updateField(setUpdateForm)} />
              </>
            )}
            <FormField as="textarea" label="Ghi chú xử lý" name="notes" value={updateForm.notes} maxLength={1000} onChange={updateField(setUpdateForm)} />
            <Actions isSaving={isSaving} label="Lưu xử lý" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <Modal title={`Chi tiết yêu cầu ${selected.asset?.assetCode ? `cho ${selected.asset.assetCode}` : ''}`} description={selected.description} onClose={closeModal}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Người yêu cầu', selected.requester?.fullName],
              ['Trạng thái', STATUS_OPTIONS.find((item) => item.value === selected.status)?.label],
              ['Ngày tạo', formatDate(selected.createdAt)],
              selected.assetId && ['Chi phí', formatMoney(selected.repairCost)],
            ].filter(Boolean).map(([label, value]) => (
              <div className="rounded-xl bg-slate-50 p-4" key={label}>
                <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 font-bold text-slate-800">{value || 'Chưa cập nhật'}</dd>
              </div>
            ))}
          </dl>
          {selected.notes && <p className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">{selected.notes}</p>}
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function Actions({ isSaving, label, onClose }) {
  return (
    <div className="form-actions">
      <Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>Hủy</Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving && <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />}
        {label}
      </Button>
    </div>
  )
}
