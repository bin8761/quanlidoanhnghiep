import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Eye, PackageSearch, Plus } from 'lucide-react'
import { assetApi } from '../../api/assets'
import { departmentApi } from '../../api/departments'
import { inventoryApi } from '../../api/inventory'
import { locationApi } from '../../api/locations'
import { ResourceError, ResourceTableSkeleton } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import FormField from '../../components/ui/FormField'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'
import Toast from '../../components/ui/Toast'
import useAutoDismiss from '../../hooks/useAutoDismiss'

const SESSION_STATUSES = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'IN_PROGRESS', label: 'Đang kiểm kê' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
]

const RESULT_OPTIONS = [
  { value: 'OK', label: 'Đủ / bình thường' },
  { value: 'MISSING', label: 'Thiếu tài sản' },
  { value: 'DAMAGED', label: 'Tài sản hư hỏng' },
]

const EMPTY_FORM = Object.freeze({
  name: '',
  departmentId: '',
  startDate: '',
  endDate: '',
  status: 'IN_PROGRESS',
  assetIds: [],
})

function formatDate(value) {
  if (!value) return 'Chưa xác định'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function progressOf(session) {
  const completed = session.items.filter((item) => item.result !== 'PENDING').length
  return { completed, total: session.items.length }
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="metric-card flex items-center gap-4 p-4">
      <span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
      <div>
        <strong className="block text-2xl font-extrabold text-slate-950">{value}</strong>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
      </div>
    </article>
  )
}

export default function InventoryPage() {
  const [sessions, setSessions] = useState([])
  const [departments, setDepartments] = useState([])
  const [assets, setAssets] = useState([])
  const [filters, setFilters] = useState({ keyword: '', status: '', departmentId: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [selectedSession, setSelectedSession] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [itemForm, setItemForm] = useState({ result: 'OK', notes: '', updateMaster: false })
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Location auditing states
  const [locList, setLocList] = useState([])
  const [selectedLocId, setSelectedLocId] = useState('')
  const [selectedLocDetail, setSelectedLocDetail] = useState(null)
  const [pinCoords, setPinCoords] = useState(null)

  useAutoDismiss(toast, setToast)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [sessionData, departmentData, assetData] = await Promise.all([
        inventoryApi.list(),
        departmentApi.list(),
        assetApi.list(),
      ])
      setSessions(sessionData)
      setDepartments(departmentData)
      setAssets(assetData)
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

  const filteredSessions = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase()
    return sessions.filter((session) => {
      if (filters.status && session.status !== filters.status) return false
      if (filters.departmentId && String(session.departmentId) !== filters.departmentId) return false
      if (!keyword) return true
      return [session.name, session.department?.name].some((value) =>
        String(value || '').toLowerCase().includes(keyword),
      )
    })
  }, [filters, sessions])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: undefined }))
  }

  function toggleAsset(assetId) {
    setForm((current) => ({
      ...current,
      assetIds: current.assetIds.includes(assetId)
        ? current.assetIds.filter((id) => id !== assetId)
        : [...current.assetIds, assetId],
    }))
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModal('create')
  }

  async function openSession(session) {
    setSelectedSession(session)
    setModal('detail')
    try {
      setSelectedSession(await inventoryApi.get(session.id))
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    }
  }

  function closeModal() {
    if (isSaving) return
    setModal(null)
    setSelectedSession(null)
    setEditingItem(null)
  }

  async function handleCreate(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Vui lòng nhập tên phiên.'
    if (!form.departmentId) nextErrors.departmentId = 'Vui lòng chọn phòng ban.'
    if (!form.assetIds.length) nextErrors.assetIds = 'Vui lòng chọn ít nhất một tài sản.'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await inventoryApi.create({
        name: form.name.trim(),
        departmentId: Number(form.departmentId),
        startDate: form.startDate ? `${form.startDate}T00:00:00.000Z` : undefined,
        endDate: form.endDate ? `${form.endDate}T00:00:00.000Z` : null,
        status: form.status,
        assetIds: form.assetIds,
      })
      setModal(null)
      setToast({ type: 'success', message: 'Tạo phiên kiểm kê thành công.' })
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function openItem(item) {
    setEditingItem(item)
    setItemForm({ 
      result: item.result === 'PENDING' ? 'OK' : item.result, 
      notes: item.notes || '',
      updateMaster: false
    })
    setPinCoords(item.locationX !== null ? { x: item.locationX, y: item.locationY } : null)
    setSelectedLocId(item.locationId ? String(item.locationId) : '')
    setSelectedLocDetail(null)

    try {
      const data = await locationApi.list()
      setLocList(data)
      if (item.locationId) {
        const detail = await locationApi.get(item.locationId)
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

  async function handleItemUpdate(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      await inventoryApi.updateItem(editingItem.id, {
        result: itemForm.result,
        notes: itemForm.notes.trim() || null,
        locationId: selectedLocId ? Number(selectedLocId) : null,
        locationX: pinCoords ? pinCoords.x : null,
        locationY: pinCoords ? pinCoords.y : null,
        updateMaster: itemForm.updateMaster,
      })
      const refreshed = await inventoryApi.get(selectedSession.id)
      setSelectedSession(refreshed)
      setEditingItem(null)
      setToast({ type: 'success', message: 'Cập nhật kết quả kiểm kê thành công.' })
      await loadData()
    } catch (requestError) {
      setToast({ type: 'error', message: requestError.message })
    } finally {
      setIsSaving(false)
    }
  }

  const activeSessions = sessions.filter((session) => session.status === 'IN_PROGRESS').length
  const checkedItems = sessions.flatMap((session) => session.items).filter((item) => item.result !== 'PENDING').length
  const issueItems = sessions.flatMap((session) => session.items).filter((item) => ['MISSING', 'DAMAGED'].includes(item.result)).length

  const departmentOptions = [
    { value: '', label: 'Tất cả phòng ban' },
    ...departments.map((department) => ({ value: String(department.id), label: department.name })),
  ]

  const columns = [
    { key: 'name', label: 'Tên phiên' },
    { key: 'department', label: 'Phòng ban', render: (value) => value?.name || 'Chưa xác định' },
    {
      key: 'startDate',
      label: 'Thời gian',
      render: (value, session) => `${formatDate(value)}${session.endDate ? ` - ${formatDate(session.endDate)}` : ''}`,
    },
    {
      key: 'items',
      label: 'Tiến độ',
      render: (items, session) => {
        const progress = progressOf({ ...session, items })
        return `${progress.completed}/${progress.total}`
      },
    },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_value, session) => (
        <button className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-brand-50 hover:text-brand-700" type="button" title={`Xem phiên ${session.name}`} onClick={() => openSession(session)}>
          <Eye size={16} />
        </button>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Đối soát tài sản thực tế"
        title="Phiên kiểm kê"
        description="Tạo đợt kiểm kê và ghi nhận tài sản đầy đủ, thiếu hoặc hư hỏng."
        actions={(
          <Button className="w-full sm:w-auto" type="button" onClick={openCreate}>
            <Plus size={17} />Tạo phiên kiểm kê
          </Button>
        )}
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <Metric icon={ClipboardCheck} label="Phiên đang thực hiện" value={activeSessions} tone="bg-blue-50 text-blue-700" />
        <Metric icon={CheckCircle2} label="Tài sản đã kiểm tra" value={checkedItems} tone="bg-emerald-50 text-emerald-700" />
        <Metric icon={PackageSearch} label="Cần xử lý" value={issueItems} tone="bg-amber-50 text-amber-700" />
      </section>

      <section className="filter-panel sm:grid-cols-3">
        <FormField as="select" label="Trạng thái" name="statusFilter" value={filters.status} options={SESSION_STATUSES} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} />
        <FormField as="select" label="Phòng ban" name="departmentFilter" value={filters.departmentId} options={departmentOptions} onChange={(event) => setFilters((current) => ({ ...current, departmentId: event.target.value }))} />
        <div className="flex items-end"><Button className="w-full" variant="secondary" type="button" onClick={() => setFilters({ keyword: '', status: '', departmentId: '' })}>Xóa bộ lọc</Button></div>
      </section>

      {error && !isLoading && <ResourceError message={error} onRetry={loadData} />}
      {isLoading ? <ResourceTableSkeleton columns={6} /> : (
        <DataTable columns={columns} rows={filteredSessions} searchValue={filters.keyword} onSearchChange={(keyword) => setFilters((current) => ({ ...current, keyword }))} searchPlaceholder="Tìm phiên hoặc phòng ban..." />
      )}

      {modal === 'create' && (
        <Modal size="lg" title="Tạo phiên kiểm kê" description="Chọn phạm vi và danh sách tài sản cần đối soát." onClose={closeModal}>
          <form className="grid gap-5" noValidate onSubmit={handleCreate}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Tên phiên" name="name" value={form.name} error={formErrors.name} placeholder="VD: Kiểm kê quý III/2026" onChange={updateForm} />
              <FormField as="select" label="Phòng ban" name="departmentId" value={form.departmentId} error={formErrors.departmentId} options={[{ value: '', label: 'Chọn phòng ban' }, ...departmentOptions.slice(1)]} onChange={updateForm} />
              <FormField label="Ngày bắt đầu" name="startDate" type="date" value={form.startDate} onChange={updateForm} />
              <FormField label="Ngày kết thúc dự kiến" name="endDate" type="date" value={form.endDate} onChange={updateForm} />
              <FormField as="select" label="Trạng thái khởi tạo" name="status" value={form.status} options={SESSION_STATUSES.slice(1, 3)} onChange={updateForm} />
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <strong className="text-sm text-slate-800">Tài sản kiểm kê</strong>
                <span className="text-xs text-slate-500">Đã chọn {form.assetIds.length}</span>
              </div>
              <div className="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-slate-200 p-3 sm:grid-cols-2">
                {assets.map((asset) => (
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50" key={asset.id}>
                    <input className="size-4 accent-brand-600" type="checkbox" checked={form.assetIds.includes(asset.id)} onChange={() => toggleAsset(asset.id)} />
                    <span className="min-w-0">
                      <strong className="block truncate text-xs text-slate-800">{asset.assetCode}</strong>
                      <span className="block truncate text-xs text-slate-500">{asset.name}</span>
                    </span>
                  </label>
                ))}
              </div>
              {formErrors.assetIds && <span className="mt-2 block text-xs font-medium text-red-600">{formErrors.assetIds}</span>}
            </div>
            <Actions isSaving={isSaving} label="Tạo phiên" onClose={closeModal} />
          </form>
        </Modal>
      )}

      {modal === 'detail' && selectedSession && (
        <Modal size="lg" title={selectedSession.name} description={`${selectedSession.department?.name || 'Chưa có phòng ban'} · ${selectedSession.items.length} tài sản`} onClose={closeModal}>
          <div className="grid gap-3">
            {selectedSession.items.length ? selectedSession.items.map((item) => (
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center" key={item.id}>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm text-slate-900">{item.asset.assetCode} - {item.asset.name}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{item.notes || 'Chưa có ghi chú kiểm kê'}</span>
                </div>
                <StatusBadge status={item.result} />
                {selectedSession.status !== 'COMPLETED' && <Button size="sm" variant="secondary" type="button" onClick={() => openItem(item)}>Cập nhật</Button>}
              </div>
            )) : <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">Phiên này chưa có tài sản.</p>}
          </div>
        </Modal>
      )}

      {editingItem && (
        <Modal size="lg" title={`Kiểm kê ${editingItem.asset.assetCode}`} description={editingItem.asset.name} onClose={() => !isSaving && setEditingItem(null)}>
          <form className="grid gap-5" onSubmit={handleItemUpdate}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField as="select" label="Kết quả" name="result" value={itemForm.result} options={RESULT_OPTIONS} onChange={(event) => setItemForm((current) => ({ ...current, result: event.target.value }))} />
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">Sơ đồ mặt bằng phát hiện</label>
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
            </div>

            {selectedLocDetail ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-slate-400 italic">💡 Click trực tiếp vào ảnh sơ đồ để ghim vị trí thực tế phát hiện thiết bị.</p>
                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-[200px]">
                  <div className="relative cursor-crosshair" onClick={handleMapClick}>
                    <img
                      src={selectedLocDetail.floorPlanUrl}
                      alt={selectedLocDetail.name}
                      className="max-w-full max-h-[200px] object-contain block"
                    />
                    
                    {pinCoords && (
                      <div
                        style={{ left: `${pinCoords.x}%`, top: `${pinCoords.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <span className="flex size-4 items-center justify-center rounded-full bg-red-600 border border-white text-white text-[8px] font-bold shadow-lg animate-bounce">
                          📍
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              selectedLocId && (
                <div className="text-center py-2 text-xs text-slate-400">Đang tải ảnh sơ đồ...</div>
              )
            )}

            <div className="flex items-center gap-2">
              <input
                id="updateMasterCheckbox"
                type="checkbox"
                checked={itemForm.updateMaster}
                className="size-4 accent-emerald-600 cursor-pointer"
                onChange={(e) => setItemForm(current => ({ ...current, updateMaster: e.target.checked }))}
              />
              <label htmlFor="updateMasterCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                Đồng bộ vị trí này làm vị trí gốc của thiết bị (Master Data)
              </label>
            </div>

            <FormField as="textarea" label="Ghi chú" name="notes" value={itemForm.notes} maxLength={1000} placeholder="Tình trạng hoặc nguyên nhân chênh lệch..." onChange={(event) => setItemForm((current) => ({ ...current, notes: event.target.value }))} />
            <Actions isSaving={isSaving} label="Lưu kết quả" onClose={() => setEditingItem(null)} />
          </form>
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
