import { Headphones, Plus, Send, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import PageHeader from '../../components/ui/PageHeader'
import { createRequest, getMyAssets, getMyRequests } from '../../services/employee.service'

const STATUS_TONE = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  WAITING_USER: 'border-orange-200 bg-orange-50 text-orange-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
}

const STATUS_LABEL = {
  PENDING: 'Chờ tiếp nhận',
  APPROVED: 'Đã duyệt',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_USER: 'Chờ bổ sung',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
}

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

const DESCRIPTION_LABEL = {
  INCIDENT: 'Mô tả sự cố',
  MAINTENANCE: 'Nội dung cần bảo trì',
  NEW_ALLOCATION: 'Nhu cầu cấp phát',
  EXCHANGE: 'Lý do cần đổi tài sản',
  RECALL: 'Lý do thu hồi',
  SOFTWARE_INSTALL: 'Phần mềm cần cài',
  ACCESS_GRANT: 'Quyền truy cập cần cấp',
  OTHER: 'Nội dung hỗ trợ',
}

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function requestAssigneeName(request) {
  return request.assignee?.employee?.fullName || request.assignee?.email || 'Chưa phân công'
}

export default function EmployeeRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ type: 'INCIDENT', asset: '', description: '', priority: 'MEDIUM' })
  const [myAssets, setMyAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedRequestId, setHighlightedRequestId] = useState('')

  const assetOptions = useMemo(() => (
    myAssets.map((item) => ({
      value: item.asset?.assetCode || '',
      label: `${item.asset?.assetCode || ''} - ${item.asset?.name || ''}`,
    }))
  ), [myAssets])

  useEffect(() => {
    Promise.all([getMyRequests(), getMyAssets()])
      .then(([reqs, assetList]) => {
        setRequests(reqs)
        setMyAssets(assetList)
        if (assetList.length) setForm((current) => ({ ...current, asset: assetList[0].asset?.assetCode || '' }))
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (isLoading || !requests.length) return undefined
    const requestId = searchParams.get('requestId')
    if (!requestId || !requests.some((item) => item.id === requestId)) return undefined

    const timer = window.setTimeout(() => {
      setHighlightedRequestId(requestId)
      document.getElementById(`support-request-${requestId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('requestId')
        return next
      }, { replace: true })
    }, 0)
    const clearHighlightTimer = window.setTimeout(() => setHighlightedRequestId(''), 4500)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(clearHighlightTimer)
    }
  }, [isLoading, requests, searchParams, setSearchParams])

  if (isLoading) {
    return <div className="grid min-h-72 place-items-center">Đang tải...</div>
  }

  async function submitRequest(event) {
    event.preventDefault()
    if (!form.description.trim()) return

    const isAssetRequired = TYPES_REQUIRING_ASSET.includes(form.type)
    const selectedAsset = myAssets.find((item) => item.asset?.assetCode === form.asset)
    if (isAssetRequired && !selectedAsset) {
      setError('Vui lòng chọn tài sản cho loại yêu cầu này.')
      return
    }

    try {
      await createRequest({
        type: form.type,
        priority: form.priority,
        assetId: selectedAsset?.asset?.id || null,
        description: form.description.trim(),
      })
      const updated = await getMyRequests()
      setRequests(updated)
      setForm((current) => ({ ...current, description: '' }))
      setFormOpen(false)
      setError('')
      setSuccess('Yêu cầu hỗ trợ đã được gửi thành công.')
    } catch (err) {
      setSuccess('')
      setError(err.message)
    }
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Trung tâm hỗ trợ"
        title="Yêu cầu hỗ trợ"
        description="Gửi yêu cầu, theo dõi trạng thái xử lý và lịch sử phản hồi."
        actions={(
          <Button className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            <Plus size={17} /> Tạo yêu cầu
          </Button>
        )}
      />

      {success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{error}</div>}

      {formOpen && (
        <section className="surface mb-5 border-brand-200 p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tạo yêu cầu mới</h3>
              <p className="mt-1 text-xs text-slate-500">Chọn đúng loại yêu cầu để bộ phận phụ trách xử lý theo flow phù hợp.</p>
            </div>
            <button className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" type="button" title="Đóng" onClick={() => setFormOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitRequest}>
            <FormField
              label="Loại yêu cầu"
              name="type"
              as="select"
              value={form.type}
              options={Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, asset: TYPES_REQUIRING_ASSET.includes(event.target.value) ? current.asset : '' }))}
            />
            <FormField
              label={TYPES_REQUIRING_ASSET.includes(form.type) ? 'Tài sản' : 'Tài sản liên kết (tùy chọn)'}
              name="asset"
              as="select"
              value={form.asset}
              options={TYPES_REQUIRING_ASSET.includes(form.type) ? assetOptions : [{ value: '', label: 'Không liên kết tài sản' }, ...assetOptions]}
              onChange={(event) => setForm((current) => ({ ...current, asset: event.target.value }))}
            />
            <FormField
              label="Mức ưu tiên"
              name="priority"
              as="select"
              value={form.priority}
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            />
            <div className="sm:col-span-2">
              <FormField
                label={DESCRIPTION_LABEL[form.type]}
                name="description"
                as="textarea"
                placeholder="Nhập chi tiết yêu cầu hỗ trợ..."
                value={form.description}
                required
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit"><Send size={16} /> Gửi yêu cầu</Button>
            </div>
          </form>
        </section>
      )}

      <section className="surface overflow-hidden">
        <div className="hidden grid-cols-[110px_150px_92px_110px_minmax(180px,1fr)_120px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid">
          <span>Mã yêu cầu</span><span>Loại</span><span>Ưu tiên</span><span>Tài sản</span><span>Nội dung</span><span>Phụ trách</span><span>Trạng thái</span>
        </div>
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <article
              className={`grid gap-3 px-5 py-4 transition md:grid-cols-[110px_150px_92px_110px_minmax(180px,1fr)_120px_120px] md:items-center md:gap-4 ${
                highlightedRequestId === request.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
              }`}
              id={`support-request-${request.id}`}
              key={request.id}
            >
              <strong className="text-xs text-brand-700">SR-{request.id.slice(0, 8).toUpperCase()}</strong>
              <span className="text-xs font-semibold text-slate-700">{REQUEST_TYPE_LABELS[request.type] || request.type}</span>
              <span className="text-xs font-bold text-slate-600">{PRIORITY_LABELS[request.priority] || request.priority}</span>
              <span className="text-xs text-slate-600">{request.asset?.assetCode || '-'}</span>
              <span className="text-xs text-slate-600">
                {request.description}
                {request.completedAt && <small className="mt-1 block text-slate-400">Hoàn tất: {formatDate(request.completedAt)}</small>}
              </span>
              <span className="text-xs text-slate-600">{requestAssigneeName(request)}</span>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_TONE[request.status] || ''}`}>
                {STATUS_LABEL[request.status] || request.status}
              </span>
            </article>
          ))}
        </div>
      </section>

      {!requests.length && (
        <div className="grid min-h-72 place-items-center text-center">
          <div><Headphones className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm text-slate-500">Bạn chưa có yêu cầu hỗ trợ.</p></div>
        </div>
      )}
    </div>
  )
}
