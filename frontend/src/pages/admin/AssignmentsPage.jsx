import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CalendarDays,
  History,
  PackageCheck,
  Plus,
  RotateCcw,
  UserRound,
} from 'lucide-react'
import { assignmentApi } from '../../api/assignments'
import { assetApi } from '../../api/assets'
import { employeeApi } from '../../api/employees'
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

const EMPTY_ASSIGN_FORM = Object.freeze({
  assetId: '',
  employeeId: '',
  assignedAt: '',
  notes: '',
})

const EMPTY_RETURN_FORM = Object.freeze({
  returnedAt: '',
  assetStatus: 'AVAILABLE',
  notes: '',
})

const EMPTY_TRANSFER_FORM = Object.freeze({
  toEmployeeId: '',
  transferredAt: '',
  notes: '',
})

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang bàn giao' },
  { value: 'RETURNED', label: 'Đã thu hồi' },
  { value: 'TRANSFERRED', label: 'Đã chuyển giao' },
]

const RETURN_STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Sẵn sàng sử dụng' },
  { value: 'MAINTENANCE', label: 'Chuyển sang bảo trì' },
  { value: 'BROKEN', label: 'Ghi nhận bị hỏng' },
  { value: 'LOST', label: 'Ghi nhận thất lạc' },
]

function toIsoDate(value) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusLabel(status) {
  return {
    ACTIVE: 'Đang bàn giao',
    RETURNED: 'Đã thu hồi',
    TRANSFERRED: 'Đã chuyển giao',
  }[status] || status
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    slate: 'bg-slate-100 text-slate-700',
  }

  return (
    <article className="metric-card flex items-center gap-4 p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-slate-950 dark:text-slate-50">{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </article>
  )
}

export default function AssignmentsPage() {
  const { t } = useLanguage()
  const [history, setHistory] = useState([])
  const [assets, setAssets] = useState([])
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', assetId: '', employeeId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [assignForm, setAssignForm] = useState(EMPTY_ASSIGN_FORM)
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM)
  const [transferForm, setTransferForm] = useState(EMPTY_TRANSFER_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useAutoDismiss(toast, setToast)

  const loadPageData = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const [historyData, assetData, employeeData] = await Promise.all([
        assignmentApi.history(),
        assetApi.list(),
        employeeApi.list(),
      ])
      setHistory(historyData)
      setAssets(assetData)
      setEmployees(employeeData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadPageData, 0)
    return () => window.clearTimeout(timer)
  }, [loadPageData])

  const activeEmployees = useMemo(
    () => employees.filter((employee) => employee.status === 'ACTIVE'),
    [employees],
  )

  const availableAssets = useMemo(
    () => assets.filter((asset) => asset.status === 'AVAILABLE'),
    [assets],
  )

  const activeAssignments = useMemo(
    () => history.filter((assignment) => assignment.status === 'ACTIVE'),
    [history],
  )

  const filteredHistory = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()

    return history.filter((assignment) => {
      if (filters.status && assignment.status !== filters.status) return false
      if (filters.assetId && assignment.assetId !== filters.assetId) return false
      if (filters.employeeId && assignment.employeeId !== filters.employeeId) return false
      if (!keyword) return true

      return [
        assignment.asset?.assetCode,
        assignment.asset?.name,
        assignment.employee?.employeeCode,
        assignment.employee?.fullName,
        assignment.employee?.department?.name,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [filters, history])

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openAssignModal() {
    setSelectedAssignment(null)
    setAssignForm(EMPTY_ASSIGN_FORM)
    setFormErrors({})
    setModal('assign')
  }

  function openReturnModal(assignment) {
    setSelectedAssignment(assignment)
    setReturnForm(EMPTY_RETURN_FORM)
    setFormErrors({})
    setModal('return')
  }

  function openTransferModal(assignment) {
    setSelectedAssignment(assignment)
    setTransferForm(EMPTY_TRANSFER_FORM)
    setFormErrors({})
    setModal('transfer')
  }

  function closeModal() {
    if (isSaving) return
    setModal(null)
    setSelectedAssignment(null)
    setFormErrors({})
  }

  function updateForm(setter) {
    return (event) => {
      const { name, value } = event.target
      setter((current) => ({ ...current, [name]: value }))
      setFormErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  async function submitWorkflow(event) {
    event.preventDefault()
    const nextErrors = {}

    if (modal === 'assign') {
      if (!assignForm.assetId) nextErrors.assetId = 'Vui lòng chọn tài sản.'
      if (!assignForm.employeeId) nextErrors.employeeId = 'Vui lòng chọn nhân viên.'
    }

    if (modal === 'transfer' && !transferForm.toEmployeeId) {
      nextErrors.toEmployeeId = 'Vui lòng chọn nhân viên nhận mới.'
    }

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      if (modal === 'assign') {
        await assignmentApi.assign({
          assetId: assignForm.assetId,
          employeeId: assignForm.employeeId,
          assignedAt: toIsoDate(assignForm.assignedAt),
          notes: assignForm.notes.trim() || null,
        })
        setToast({ type: 'success', message: 'Bàn giao tài sản thành công.' })
      }

      if (modal === 'return') {
        await assignmentApi.returnAsset({
          assetId: selectedAssignment.assetId,
          returnedAt: toIsoDate(returnForm.returnedAt),
          assetStatus: returnForm.assetStatus,
          notes: returnForm.notes.trim() || null,
        })
        setToast({ type: 'success', message: 'Thu hồi tài sản thành công.' })
      }

      if (modal === 'transfer') {
        await assignmentApi.transfer({
          assetId: selectedAssignment.assetId,
          toEmployeeId: transferForm.toEmployeeId,
          transferredAt: toIsoDate(transferForm.transferredAt),
          notes: transferForm.notes.trim() || null,
        })
        setToast({ type: 'success', message: 'Chuyển giao tài sản thành công.' })
      }

      setModal(null)
      setSelectedAssignment(null)
      await loadPageData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  const assetOptions = [
    { value: '', label: 'Tất cả tài sản' },
    ...assets.map((asset) => ({
      value: asset.id,
      label: `${asset.assetCode} - ${asset.name}`,
    })),
  ]

  const availableAssetOptions = [
    { value: '', label: 'Chọn tài sản sẵn sàng' },
    ...availableAssets.map((asset) => ({
      value: asset.id,
      label: `${asset.assetCode} - ${asset.name}`,
    })),
  ]

  const employeeOptions = [
    { value: '', label: 'Tất cả nhân viên' },
    ...employees.map((employee) => ({
      value: employee.id,
      label: `${employee.employeeCode} - ${employee.fullName}`,
    })),
  ]

  const activeEmployeeOptions = [
    { value: '', label: 'Chọn nhân viên' },
    ...activeEmployees.map((employee) => ({
      value: employee.id,
      label: `${employee.employeeCode} - ${employee.fullName}`,
    })),
  ]

  const transferEmployeeOptions = [
    { value: '', label: 'Chọn nhân viên nhận mới' },
    ...activeEmployees
      .filter((employee) => employee.id !== selectedAssignment?.employeeId)
      .map((employee) => ({
        value: employee.id,
        label: `${employee.employeeCode} - ${employee.fullName}`,
      })),
  ]

  const columns = [
    {
      key: 'asset',
      label: 'Tài sản',
      render: (asset) => (
        <div>
          <strong className="block text-slate-900 dark:text-slate-100">{asset?.assetCode}</strong>
          <span className="mt-0.5 block text-xs text-slate-500">{asset?.name}</span>
        </div>
      ),
    },
    {
      key: 'employee',
      label: 'Nhân viên',
      render: (employee) => (
        <div>
          <strong className="block text-slate-800 dark:text-slate-100">{employee?.fullName}</strong>
          <span className="mt-0.5 block text-xs text-slate-500">
            {employee?.employeeCode} · {employee?.department?.name || 'Chưa có phòng ban'}
          </span>
        </div>
      ),
    },
    {
      key: 'assignedAt',
      label: 'Ngày bàn giao',
      render: (value) => formatDate(value),
    },
    {
      key: 'returnedAt',
      label: 'Ngày kết thúc',
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (value) => (
        <div className="grid gap-1">
          <StatusBadge status={value} />
          <span className="text-[10px] font-semibold text-slate-400">{getStatusLabel(value)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, assignment) =>
        assignment.status === 'ACTIVE' ? (
          <div className="flex items-center gap-1">
            <button
              className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
              type="button"
              title={`Chuyển giao ${assignment.asset?.assetCode}`}
              onClick={() => openTransferModal(assignment)}
            >
              <ArrowLeftRight size={16} />
            </button>
            <button
              className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-amber-50 hover:text-amber-700"
              type="button"
              title={`Thu hồi ${assignment.asset?.assetCode}`}
              onClick={() => openReturnModal(assignment)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Đã hoàn tất</span>
        ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('Vòng đời sử dụng tài sản')}
        title={t('Quản lý bàn giao')}
        description={t('Bàn giao, thu hồi, chuyển người sử dụng và truy vết toàn bộ lịch sử tài sản.')}
        actions={(
          <Button
            className="w-full sm:w-auto"
            type="button"
            disabled={!availableAssets.length || !activeEmployees.length}
            onClick={openAssignModal}
          >
            <Plus size={17} />
            {t('Tạo bàn giao')}
          </Button>
        )}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={PackageCheck} label={t('Đang bàn giao')} value={activeAssignments.length} tone="emerald" />
        <SummaryCard icon={History} label={t('Tổng lượt bàn giao')} value={history.length} tone="blue" />
        <SummaryCard icon={UserRound} label={t('Nhân viên đang sử dụng')} value={new Set(activeAssignments.map((item) => item.employeeId)).size} tone="slate" />
      </section>

      <section className="filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <FormField as="select" label="Trạng thái" name="statusFilter" value={filters.status} options={STATUS_OPTIONS} onChange={(event) => updateFilter('status', event.target.value)} />
        <FormField as="select" label="Tài sản" name="assetFilter" value={filters.assetId} options={assetOptions} onChange={(event) => updateFilter('assetId', event.target.value)} />
        <FormField as="select" label="Nhân viên" name="employeeFilter" value={filters.employeeId} options={employeeOptions} onChange={(event) => updateFilter('employeeId', event.target.value)} />
        <div className="flex items-end">
          <Button className="w-full" variant="secondary" type="button" onClick={() => setFilters({ keyword: '', status: '', assetId: '', employeeId: '' })}>
            Xóa bộ lọc
          </Button>
        </div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={loadPageData} />}

      {isLoading ? (
        <ResourceTableSkeleton columns={6} />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredHistory}
          searchValue={filters.keyword}
          onSearchChange={(value) => updateFilter('keyword', value)}
          searchPlaceholder="Tìm mã tài sản, tên hoặc nhân viên..."
        />
      )}

      {modal === 'assign' && (
        <Modal title="Tạo bàn giao tài sản" description="Chỉ tài sản sẵn sàng và nhân viên đang hoạt động mới có thể được chọn." onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={submitWorkflow}>
            <FormField as="select" label="Tài sản" name="assetId" value={assignForm.assetId} error={formErrors.assetId} options={availableAssetOptions} onChange={updateForm(setAssignForm)} />
            <FormField as="select" label="Nhân viên nhận" name="employeeId" value={assignForm.employeeId} error={formErrors.employeeId} options={activeEmployeeOptions} onChange={updateForm(setAssignForm)} />
            <FormField label="Ngày bàn giao" name="assignedAt" type="date" value={assignForm.assignedAt} hint="Để trống để dùng hôm nay" onChange={updateForm(setAssignForm)} />
            <FormField as="textarea" label="Ghi chú" name="notes" value={assignForm.notes} maxLength={1000} hint={`${assignForm.notes.length}/1000`} placeholder="Tình trạng, phụ kiện kèm theo..." onChange={updateForm(setAssignForm)} />
            <WorkflowActions isSaving={isSaving} submitLabel="Xác nhận bàn giao" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'return' && selectedAssignment && (
        <Modal title={`Thu hồi ${selectedAssignment.asset?.assetCode}`} description={`Đang được sử dụng bởi ${selectedAssignment.employee?.fullName}.`} onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={submitWorkflow}>
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <RotateCcw className="shrink-0" size={18} />
              Trạng thái tài sản sau thu hồi sẽ quyết định bước xử lý tiếp theo.
            </div>
            <FormField as="select" label="Tình trạng sau thu hồi" name="assetStatus" value={returnForm.assetStatus} options={RETURN_STATUS_OPTIONS} onChange={updateForm(setReturnForm)} />
            <FormField label="Ngày thu hồi" name="returnedAt" type="date" value={returnForm.returnedAt} hint="Để trống để dùng hôm nay" onChange={updateForm(setReturnForm)} />
            <FormField as="textarea" label="Biên bản / ghi chú" name="notes" value={returnForm.notes} maxLength={1000} hint={`${returnForm.notes.length}/1000`} placeholder="Tình trạng thực tế khi nhận lại..." onChange={updateForm(setReturnForm)} />
            <WorkflowActions isSaving={isSaving} submitLabel="Xác nhận thu hồi" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'transfer' && selectedAssignment && (
        <Modal title={`Chuyển giao ${selectedAssignment.asset?.assetCode}`} description={`Chuyển từ ${selectedAssignment.employee?.fullName} sang người sử dụng mới.`} onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={submitWorkflow}>
            <FormField as="select" label="Nhân viên nhận mới" name="toEmployeeId" value={transferForm.toEmployeeId} error={formErrors.toEmployeeId} options={transferEmployeeOptions} onChange={updateForm(setTransferForm)} />
            <FormField label="Ngày chuyển giao" name="transferredAt" type="date" value={transferForm.transferredAt} hint="Để trống để dùng hôm nay" onChange={updateForm(setTransferForm)} />
            <FormField as="textarea" label="Ghi chú chuyển giao" name="notes" value={transferForm.notes} maxLength={1000} hint={`${transferForm.notes.length}/1000`} placeholder="Lý do chuyển giao, phụ kiện đi kèm..." onChange={updateForm(setTransferForm)} />
            <WorkflowActions isSaving={isSaving} submitLabel="Xác nhận chuyển giao" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function WorkflowActions({ isSaving, submitLabel, onClose }) {
  return (
    <div className="form-actions">
      <Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? (
          <span className="size-4 animate-spin-soft rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <CalendarDays size={16} />
        )}
        {submitLabel}
      </Button>
    </div>
  )
}
