import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Eye, LifeBuoy, Plus, XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { assetApi } from '../../api/assets'
import { employeeApi } from '../../api/employees'
import { supportRequestApi } from '../../api/maintenance'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'
import { useLanguage } from '../../hooks/useLanguage'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ tiếp nhận' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'WAITING_USER', label: 'Chờ bổ sung' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'REJECTED', label: 'Từ chối' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const REQUEST_TYPE_LABELS = {
  INCIDENT: 'Báo hỏng tài sản',
  MAINTENANCE: 'Yêu cầu bảo trì',
  NEW_ALLOCATION: 'Yêu cầu cấp phát mới',
  EXCHANGE: 'Yêu cầu đổi tài sản',
  RECALL: 'Yêu cầu thu hồi tài sản',
  SOFTWARE_INSTALL: 'Yêu cầu cài phần mềm',
  ACCESS_GRANT: 'Yêu cầu cấp quyền',
  OTHER: 'Yêu cầu hỗ trợ khác',
}

const PRIORITY_LABELS = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
}

const TYPES_REQUIRING_ASSET = ['INCIDENT', 'MAINTENANCE', 'EXCHANGE', 'RECALL']
const REPAIR_TYPES = ['INCIDENT', 'MAINTENANCE']
const TERMINAL_STATUSES = ['COMPLETED', 'REJECTED', 'CANCELLED']
const EMPTY_CREATE = Object.freeze({ type: 'INCIDENT', priority: 'MEDIUM', assetId: '', requesterId: '', description: '', notes: '' })
const EMPTY_STATUS = Object.freeze({ status: 'APPROVED', resolution: '', notes: '' })
const EMPTY_FULFILL = Object.freeze({
  assetId: '',
  replacementAssetId: '',
  assetStatus: 'AVAILABLE',
  returnedAssetStatus: 'AVAILABLE',
  repairCost: '',
  resolution: '',
  notes: '',
})

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function formatMoney(value) {
  if (value === null || typeof value === 'undefined') return 'Chưa cập nhật'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
}

function assigneeName(request) {
  return request.assignee?.employee?.fullName || request.assignee?.email || 'Chưa phân công'
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="metric-card flex items-center gap-4 p-4">
      <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
      <div>
        <strong className="block text-2xl font-extrabold text-slate-950 dark:text-slate-50">{value}</strong>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </article>
  )
}

export default function MaintenancePage() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [assets, setAssets] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', type: '', priority: '', requesterId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)
  const [statusForm, setStatusForm] = useState(EMPTY_STATUS)
  const [fulfillForm, setFulfillForm] = useState(EMPTY_FULFILL)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useAutoDismiss(toast, setToast)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [requestData, assetData, employeeData] = await Promise.all([
        supportRequestApi.list(),
        assetApi.list(),
        employeeApi.list(),
      ])
      setRequests(requestData)
      setAssets(assetData)
      setEmployees(employeeData)
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
    const request = requests.find((item) => item.id === requestId)
    if (!request) return
    const timer = window.setTimeout(() => {
      setSelected(request)
      setModal(TERMINAL_STATUSES.includes(request.status) ? 'detail' : 'status')
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
      if (filters.type && request.type !== filters.type) return false
      if (filters.priority && request.priority !== filters.priority) return false
      if (filters.requesterId && request.requesterId !== filters.requesterId) return false
      if (!keyword) return true
      return [request.asset?.assetCode, request.asset?.name, request.requester?.fullName, request.description]
        .some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [filters, requests])

  const openCount = requests.filter((item) => !TERMINAL_STATUSES.includes(item.status)).length
  const highPriorityCount = requests.filter((item) => item.priority === 'HIGH' && !TERMINAL_STATUSES.includes(item.status)).length

  const employeeOptions = [
    { value: '', label: 'Tất cả nhân viên' },
    ...employees.map((employee) => ({ value: employee.id, label: `${employee.employeeCode} - ${employee.fullName}` })),
  ]
  const activeEmployeeOptions = [{ value: '', label: 'Chọn nhân viên' }, ...employeeOptions.slice(1)]
  const assetOptions = [
    { value: '', label: 'Chọn tài sản' },
    ...assets
      .filter((asset) => !['LOST', 'DISPOSED'].includes(asset.status))
      .map((asset) => ({ value: asset.id, label: `${asset.assetCode} - ${asset.name} (${asset.status})` })),
  ]
  const availableAssetOptions = [
    { value: '', label: 'Chọn tài sản sẵn sàng' },
    ...assets
      .filter((asset) => asset.status === 'AVAILABLE')
      .map((asset) => ({ value: asset.id, label: `${asset.assetCode} - ${asset.name}` })),
  ]

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

  function openStatus(request, status = request.status === 'PENDING' ? 'APPROVED' : 'IN_PROGRESS') {
    setSelected(request)
    setStatusForm({ status, resolution: '', notes: request.notes || '' })
    setFormErrors({})
    setModal('status')
  }

  function openFulfill(request) {
    setSelected(request)
    setFulfillForm({
      ...EMPTY_FULFILL,
      assetStatus: REPAIR_TYPES.includes(request.type) ? 'AVAILABLE' : 'AVAILABLE',
      resolution: request.resolution || '',
      repairCost: request.repairCost === null ? '' : String(request.repairCost || ''),
      notes: request.notes || '',
    })
    setFormErrors({})
    setModal('fulfill')
  }

  function closeModal() {
    if (isSaving) return
    setModal(null)
    setSelected(null)
  }

  async function handleCreate(event) {
    event.preventDefault()
    const nextErrors = {}
    if (TYPES_REQUIRING_ASSET.includes(createForm.type) && !createForm.assetId) nextErrors.assetId = 'Vui lòng chọn tài sản.'
    if (!createForm.requesterId) nextErrors.requesterId = 'Vui lòng chọn người yêu cầu.'
    if (!createForm.description.trim()) nextErrors.description = 'Vui lòng nhập nội dung yêu cầu.'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await supportRequestApi.create({
        type: createForm.type,
        priority: createForm.priority,
        assetId: createForm.assetId || null,
        requesterId: createForm.requesterId,
        description: createForm.description.trim(),
        notes: createForm.notes.trim() || null,
      })
      setToast({ type: 'success', message: 'Tạo yêu cầu hỗ trợ thành công.' })
      setModal(null)
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatus(event) {
    event.preventDefault()
    if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(statusForm.status) && !statusForm.resolution.trim()) {
      setFormErrors({ resolution: 'Vui lòng nhập lý do/kết quả xử lý.' })
      return
    }
    setIsSaving(true)
    try {
      await supportRequestApi.updateStatus(selected.id, {
        status: statusForm.status,
        resolution: statusForm.resolution.trim() || null,
        notes: statusForm.notes.trim() || null,
      })
      setToast({ type: 'success', message: 'Cập nhật trạng thái thành công.' })
      setModal(null)
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleFulfill(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!fulfillForm.resolution.trim()) nextErrors.resolution = 'Vui lòng nhập kết quả xử lý.'
    if (selected.type === 'NEW_ALLOCATION' && !fulfillForm.assetId) nextErrors.assetId = 'Vui lòng chọn tài sản cấp phát.'
    if (selected.type === 'EXCHANGE' && !fulfillForm.replacementAssetId) nextErrors.replacementAssetId = 'Vui lòng chọn tài sản thay thế.'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await supportRequestApi.fulfill(selected.id, {
        assetId: fulfillForm.assetId || null,
        replacementAssetId: fulfillForm.replacementAssetId || null,
        assetStatus: fulfillForm.assetStatus,
        returnedAssetStatus: fulfillForm.returnedAssetStatus,
        repairCost: fulfillForm.repairCost === '' ? null : Number(fulfillForm.repairCost),
        resolution: fulfillForm.resolution.trim(),
        notes: fulfillForm.notes.trim() || null,
      })
      setToast({ type: 'success', message: 'Hoàn tất yêu cầu hỗ trợ thành công.' })
      setModal(null)
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    { key: 'type', label: 'Loại', render: (_value, row) => REQUEST_TYPE_LABELS[row.type] || row.type },
    {
      key: 'asset',
      label: 'Tài sản',
      render: (asset) => asset ? <div><strong className="block text-slate-900">{asset.assetCode}</strong><span className="text-xs text-slate-500">{asset.name}</span></div> : <span className="text-xs text-slate-400 italic">Không liên kết</span>,
    },
    { key: 'requester', label: 'Người yêu cầu', render: (requester) => requester?.fullName || 'Chưa xác định' },
    { key: 'priority', label: 'Ưu tiên', render: (value) => <span className="text-xs font-bold text-slate-700">{PRIORITY_LABELS[value] || value}</span> },
    { key: 'description', label: 'Nội dung' },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, request) => (
        <div className="flex items-center gap-1">
          <button className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-brand-50 hover:text-brand-700" type="button" title="Chi tiết" onClick={() => (setSelected(request), setModal('detail'))}><Eye size={16} /></button>
          {!TERMINAL_STATUSES.includes(request.status) && <button className="grid size-9 place-items-center rounded-xl text-blue-500 transition hover:bg-blue-50" type="button" title="Cập nhật trạng thái" onClick={() => openStatus(request)}><Clock3 size={16} /></button>}
          {!TERMINAL_STATUSES.includes(request.status) && <button className="grid size-9 place-items-center rounded-xl text-emerald-600 transition hover:bg-emerald-50" type="button" title="Hoàn tất nghiệp vụ" onClick={() => openFulfill(request)}><CheckCircle2 size={16} /></button>}
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('Vận hành hỗ trợ')}
        title={t('Yêu cầu hỗ trợ')}
        description={t('Tiếp nhận, duyệt, xử lý và hoàn tất ticket theo đúng nghiệp vụ.')}
        actions={<Button className="w-full sm:w-auto" type="button" onClick={openCreate}><Plus size={17} />{t('Tạo yêu cầu')}</Button>}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric icon={LifeBuoy} label="Tổng yêu cầu" value={requests.length} tone="bg-blue-50 text-blue-700" />
        <Metric icon={Clock3} label="Đang mở" value={openCount} tone="bg-amber-50 text-amber-700" />
        <Metric icon={XCircle} label="Ưu tiên cao" value={highPriorityCount} tone="bg-rose-50 text-rose-700" />
      </section>

      <section className="filter-panel sm:grid-cols-5">
        <FormField as="select" label="Trạng thái" name="statusFilter" value={filters.status} options={STATUS_OPTIONS} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} />
        <FormField as="select" label="Loại" name="typeFilter" value={filters.type} options={[{ value: '', label: 'Tất cả loại' }, ...Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))]} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} />
        <FormField as="select" label="Ưu tiên" name="priorityFilter" value={filters.priority} options={[{ value: '', label: 'Tất cả mức' }, ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))]} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} />
        <FormField as="select" label="Người yêu cầu" name="requesterFilter" value={filters.requesterId} options={employeeOptions} onChange={(event) => setFilters((current) => ({ ...current, requesterId: event.target.value }))} />
        <div className="flex items-end"><Button className="w-full" variant="secondary" type="button" onClick={() => setFilters({ keyword: '', status: '', type: '', priority: '', requesterId: '' })}>Xóa lọc</Button></div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={loadData} />}
      {isLoading ? <ResourceTableSkeleton columns={7} /> : <DataTable columns={columns} rows={filteredRequests} searchValue={filters.keyword} onSearchChange={(keyword) => setFilters((current) => ({ ...current, keyword }))} searchPlaceholder="Tìm tài sản, nhân viên hoặc nội dung..." />}

      {modal === 'create' && (
        <Modal title="Tạo yêu cầu hỗ trợ" description="Admin có thể ghi nhận yêu cầu thay cho nhân viên." onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={handleCreate}>
            <FormField as="select" label="Loại yêu cầu" name="type" value={createForm.type} options={Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))} onChange={updateField(setCreateForm)} />
            <FormField as="select" label="Mức ưu tiên" name="priority" value={createForm.priority} options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))} onChange={updateField(setCreateForm)} />
            <FormField as="select" label={TYPES_REQUIRING_ASSET.includes(createForm.type) ? 'Tài sản' : 'Tài sản liên kết (tùy chọn)'} name="assetId" value={createForm.assetId} error={formErrors.assetId} options={TYPES_REQUIRING_ASSET.includes(createForm.type) ? assetOptions : [{ value: '', label: 'Không liên kết tài sản' }, ...assetOptions.slice(1)]} onChange={updateField(setCreateForm)} />
            <FormField as="select" label="Người yêu cầu" name="requesterId" value={createForm.requesterId} error={formErrors.requesterId} options={activeEmployeeOptions} onChange={updateField(setCreateForm)} />
            <FormField as="textarea" label="Chi tiết yêu cầu" name="description" value={createForm.description} error={formErrors.description} maxLength={2000} onChange={updateField(setCreateForm)} />
            <FormField as="textarea" label="Ghi chú" name="notes" value={createForm.notes} maxLength={1000} onChange={updateField(setCreateForm)} />
            <Actions isSaving={isSaving} label="Tạo yêu cầu" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'status' && selected && (
        <Modal title={`Cập nhật ${REQUEST_TYPE_LABELS[selected.type] || selected.type}`} description={selected.description} onClose={closeModal}>
          <form className="grid gap-5" onSubmit={handleStatus}>
            <FormField as="select" label="Trạng thái" name="status" value={statusForm.status} options={STATUS_OPTIONS.slice(1)} onChange={updateField(setStatusForm)} />
            <FormField as="textarea" label="Kết quả / lý do" name="resolution" value={statusForm.resolution} error={formErrors.resolution} maxLength={2000} onChange={updateField(setStatusForm)} />
            <FormField as="textarea" label="Ghi chú nội bộ" name="notes" value={statusForm.notes} maxLength={1000} onChange={updateField(setStatusForm)} />
            <Actions isSaving={isSaving} label="Lưu trạng thái" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'fulfill' && selected && (
        <Modal title={`Hoàn tất ${REQUEST_TYPE_LABELS[selected.type] || selected.type}`} description={selected.description} onClose={closeModal}>
          <form className="grid gap-5" onSubmit={handleFulfill}>
            {REPAIR_TYPES.includes(selected.type) && (
              <>
                <FormField label="Chi phí sửa chữa (VND)" name="repairCost" type="number" min="0" value={fulfillForm.repairCost} onChange={updateField(setFulfillForm)} />
                <FormField as="select" label="Trạng thái tài sản sau xử lý" name="assetStatus" value={fulfillForm.assetStatus} options={[
                  { value: 'AVAILABLE', label: 'Sẵn sàng' },
                  { value: 'BROKEN', label: 'Bị hỏng' },
                  { value: 'DISPOSED', label: 'Đã thanh lý' },
                ]} onChange={updateField(setFulfillForm)} />
              </>
            )}
            {selected.type === 'NEW_ALLOCATION' && <FormField as="select" label="Tài sản cấp phát" name="assetId" value={fulfillForm.assetId} error={formErrors.assetId} options={availableAssetOptions} onChange={updateField(setFulfillForm)} />}
            {selected.type === 'EXCHANGE' && (
              <>
                <FormField as="select" label="Tài sản thay thế" name="replacementAssetId" value={fulfillForm.replacementAssetId} error={formErrors.replacementAssetId} options={availableAssetOptions} onChange={updateField(setFulfillForm)} />
                <FormField as="select" label="Tình trạng tài sản cũ" name="returnedAssetStatus" value={fulfillForm.returnedAssetStatus} options={[
                  { value: 'AVAILABLE', label: 'Sẵn sàng' },
                  { value: 'BROKEN', label: 'Bị hỏng' },
                  { value: 'DISPOSED', label: 'Đã thanh lý' },
                ]} onChange={updateField(setFulfillForm)} />
              </>
            )}
            {selected.type === 'RECALL' && <FormField as="select" label="Tình trạng sau thu hồi" name="assetStatus" value={fulfillForm.assetStatus} options={[
              { value: 'AVAILABLE', label: 'Sẵn sàng' },
              { value: 'BROKEN', label: 'Bị hỏng' },
              { value: 'DISPOSED', label: 'Đã thanh lý' },
            ]} onChange={updateField(setFulfillForm)} />}
            <FormField as="textarea" label="Kết quả xử lý" name="resolution" value={fulfillForm.resolution} error={formErrors.resolution} maxLength={2000} onChange={updateField(setFulfillForm)} />
            <FormField as="textarea" label="Ghi chú" name="notes" value={fulfillForm.notes} maxLength={1000} onChange={updateField(setFulfillForm)} />
            <Actions isSaving={isSaving} label="Hoàn tất" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'detail' && selected && (
        <Modal title={`Chi tiết ${REQUEST_TYPE_LABELS[selected.type] || selected.type}`} description={selected.description} onClose={closeModal}>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ['Người yêu cầu', selected.requester?.fullName],
              ['Người phụ trách', assigneeName(selected)],
              ['Ưu tiên', PRIORITY_LABELS[selected.priority]],
              ['Trạng thái', STATUS_OPTIONS.find((item) => item.value === selected.status)?.label],
              ['Ngày tạo', formatDate(selected.createdAt)],
              ['Ngày hoàn tất', formatDate(selected.completedAt)],
              REPAIR_TYPES.includes(selected.type) && ['Chi phí', formatMoney(selected.repairCost)],
            ].filter(Boolean).map(([label, value]) => (
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/40" key={label}>
                <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 font-bold text-slate-800">{value || 'Chưa cập nhật'}</dd>
              </div>
            ))}
          </dl>
          {selected.resolution && <p className="mt-4 rounded-xl border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">{selected.resolution}</p>}
          {!!selected.events?.length && (
            <ol className="mt-4 space-y-2">
              {selected.events.map((event) => (
                <li className="rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300" key={event.id}>
                  <strong className="text-slate-800">{event.type}</strong> · {formatDate(event.createdAt)} · {event.message}
                </li>
              ))}
            </ol>
          )}
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
