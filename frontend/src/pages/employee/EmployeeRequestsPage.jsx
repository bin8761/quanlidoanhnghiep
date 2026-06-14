import { Headphones, Plus, Send, X, ClipboardCheck, FileText, History, Wrench, XCircle, ChevronDown, ChevronUp, CheckCircle2, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import PageHeader from '../../components/ui/PageHeader'
import { createRequest, getMyAssets, getMyRequests, cancelRequest, rateRequest } from '../../services/employee.service'
import { faqApi } from '../../api/faqs'
import Modal from '../../components/ui/Modal'

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

function RequestStepper({ status }) {
  const steps = [
    { key: 'CREATED', label: 'Gửi yêu cầu', icon: FileText },
    { key: 'ASSIGNED', label: 'Tiếp nhận', icon: ClipboardCheck },
    { key: 'IN_PROGRESS', label: 'Đang xử lý', icon: Wrench },
    { key: 'COMPLETED', label: 'Hoàn thành', icon: CheckCircle2 },
  ]

  let activeIndex = 0
  if (status === 'PENDING') activeIndex = 0
  else if (status === 'APPROVED') activeIndex = 1
  else if (status === 'IN_PROGRESS' || status === 'WAITING_USER') activeIndex = 2
  else if (status === 'COMPLETED') activeIndex = 3

  if (status === 'REJECTED') {
    steps[3] = { key: 'REJECTED', label: 'Từ chối', icon: XCircle }
    activeIndex = 3
  } else if (status === 'CANCELLED') {
    steps[3] = { key: 'CANCELLED', label: 'Đã hủy', icon: XCircle }
    activeIndex = 3
  }

  return (
    <div className="py-4">
      {/* Desktop Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0 dark:bg-slate-800" />
        <div
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          className={`absolute top-1/2 left-4 h-0.5 -translate-y-1/2 z-0 transition-all duration-500 ${
            status === 'REJECTED'
              ? 'bg-rose-500'
              : status === 'CANCELLED'
                ? 'bg-slate-400'
                : 'bg-emerald-500'
          }`}
        />

        {steps.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx < activeIndex
          const isActive = idx === activeIndex
          
          let colorClass = 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          if (isActive) {
            if (status === 'REJECTED') colorClass = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
            else if (status === 'CANCELLED') colorClass = 'bg-slate-500 text-white shadow-lg shadow-slate-500/20'
            else colorClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
          } else if (isCompleted) {
            colorClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          }

          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <span className={`grid size-9 place-items-center rounded-full transition-colors duration-300 font-bold ${colorClass}`}>
                <Icon size={16} />
              </span>
              <span className={`mt-2 text-[10px] font-bold ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="flex flex-col gap-4 sm:hidden">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isCompleted = idx < activeIndex
          const isActive = idx === activeIndex
          
          let colorClass = 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          if (isActive) {
            if (status === 'REJECTED') {
              colorClass = 'bg-rose-500 text-white'
            } else if (status === 'CANCELLED') {
              colorClass = 'bg-slate-500 text-white'
            } else {
              colorClass = 'bg-emerald-500 text-white'
            }
          } else if (isCompleted) {
            colorClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
          }

          return (
            <div key={step.key} className="flex items-center gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-full ${colorClass}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${isActive ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityTimeline({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-xs text-slate-400 italic py-2">Chưa có nhật ký hoạt động.</p>
  }

  return (
    <div className="relative border-l border-slate-100 pl-4 space-y-4 dark:border-slate-800 py-1.5 ml-2">
      {events.map((event, idx) => {
        const formattedTime = new Date(event.createdAt).toLocaleDateString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })
        const actorName = event.actorUser?.employee?.fullName || event.actorUser?.email || 'Hệ thống'

        return (
          <div key={event.id || idx} className="relative">
            <span className="absolute -left-[21px] top-1.5 size-2 rounded-full border-2 border-white bg-slate-300 dark:border-slate-900" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{event.message}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {formattedTime} · Thực hiện bởi: <span className="font-semibold text-slate-500">{actorName}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RatingForm({ id, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const satisfactionLabels = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng',
  }

  const activeRating = hoverRating || rating

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) {
      setError('Vui lòng chọn số sao để đánh giá.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await rateRequest(id, { rating, feedback: feedback.trim() || null })
      onSuccess()
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi đánh giá.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-3">
      <div>
        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Mức độ hài lòng</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 transition-transform duration-150 hover:scale-125 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={20}
                  className={`transition-colors duration-200 ${
                    star <= activeRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
          {activeRating > 0 && (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 animate-fade-in">
              {satisfactionLabels[activeRating]}
            </span>
          )}
        </div>
      </div>

      <div>
        <textarea
          placeholder="Chia sẻ ý kiến đóng góp của bạn về chất lượng dịch vụ (tùy chọn)..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-emerald-600"
          rows={2}
          maxLength={1000}
        />
      </div>

      {error && <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={rating === 0 || submitting}
          className="py-1.5 px-3 text-xs"
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </div>
    </form>
  )
}

export default function EmployeeRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ type: 'INCIDENT', asset: '', description: '', priority: 'MEDIUM' })
  const [myAssets, setMyAssets] = useState([])
  const [faqs, setFaqs] = useState([])
  const [selectedFaq, setSelectedFaq] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedRequestId, setHighlightedRequestId] = useState('')
  const [expandedRequestId, setExpandedRequestId] = useState(null)

  const suggestedFaqs = useMemo(() => {
    const desc = form.description.trim().toLowerCase()
    if (desc.length < 3) return []

    const keywordMap = {
      'wifi': ['wifi', 'mạng', 'internet', 'kết nối'],
      'mạng': ['wifi', 'mạng', 'internet', 'kết nối', 'vpn'],
      'vpn': ['vpn', 'từ xa', 'remote', 'forticlient'],
      'in': ['máy in', 'in ấn', 'printer', 'kẹt giấy'],
      'máy in': ['máy in', 'in ấn', 'printer', 'kẹt giấy'],
      'pass': ['mật khẩu', 'password', 'login', 'đăng nhập', 'tài khoản'],
      'mật khẩu': ['mật khẩu', 'password', 'login', 'đăng nhập', 'tài khoản'],
      'tài khoản': ['mật khẩu', 'password', 'login', 'đăng nhập', 'tài khoản'],
      'đăng nhập': ['mật khẩu', 'password', 'login', 'đăng nhập', 'tài khoản'],
      'phần mềm': ['phần mềm', 'cài đặt', 'software', 'outlook', 'excel', 'word', 'office'],
      'cấp phát': ['cấp phát', 'nhận máy', 'bàn giao', 'chữ ký'],
      'hỏng': ['hỏng', 'lỗi', 'broken', 'sự cố', 'sửa'],
      'lỗi': ['lỗi', 'error', 'hỏng', 'sự cố'],
    }

    const matchedKeywords = Object.entries(keywordMap).filter(([kw, syns]) => {
      return syns.some(syn => desc.includes(syn))
    }).map(([kw]) => kw)

    if (matchedKeywords.length === 0) return []

    return faqs.filter(faq => {
      const q = faq.question.toLowerCase()
      const a = faq.answer.toLowerCase()
      const c = faq.category.toLowerCase()
      return matchedKeywords.some(kw => {
        const syns = keywordMap[kw]
        return syns.some(syn => q.includes(syn) || a.includes(syn) || c.includes(syn))
      })
    }).slice(0, 3)
  }, [form.description, faqs])

  async function handleCancel(requestId) {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu hỗ trợ này?')) return
    try {
      await cancelRequest(requestId)
      const updated = await getMyRequests()
      setRequests(updated)
      setSuccess('Yêu cầu hỗ trợ đã được hủy thành công.')
      setError('')
    } catch (err) {
      setSuccess('')
      setError(err.message || 'Lỗi khi hủy yêu cầu hỗ trợ.')
    }
  }

  async function handleRateSuccess(requestId) {
    try {
      const updated = await getMyRequests()
      setRequests(updated)
      setSuccess('Đánh giá chất lượng dịch vụ thành công. Cảm ơn phản hồi của bạn!')
      setError('')
    } catch (err) {
      setSuccess('')
      setError(err.message || 'Lỗi khi tải lại danh sách yêu cầu.')
    }
  }

  const assetOptions = useMemo(() => (
    myAssets.map((item) => ({
      value: item.asset?.assetCode || '',
      label: `${item.asset?.assetCode || ''} - ${item.asset?.name || ''}`,
    }))
  ), [myAssets])

  useEffect(() => {
    Promise.all([getMyRequests(), getMyAssets(), faqApi.list()])
      .then(([reqs, assetList, faqList]) => {
        setRequests(reqs)
        setMyAssets(assetList)
        setFaqs(faqList)
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
      setExpandedRequestId(requestId)
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
            {suggestedFaqs.length > 0 && (
              <div className="sm:col-span-2 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-500/25 p-4 rounded-xl space-y-2 animate-fade-down">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <span className="animate-pulse">💡</span> Hướng dẫn tự xử lý liên quan có thể giúp ích:
                </span>
                <div className="grid gap-2">
                  {suggestedFaqs.map((faq) => (
                    <button
                      key={faq.id}
                      type="button"
                      onClick={() => setSelectedFaq(faq)}
                      className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit"><Send size={16} /> Gửi yêu cầu</Button>
            </div>
          </form>
        </section>
      )}

      <section className="surface overflow-hidden">
        <div className="hidden grid-cols-[110px_150px_92px_110px_minmax(180px,1fr)_120px_120px_40px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid dark:border-slate-800 dark:bg-slate-800/50">
          <span>Mã yêu cầu</span><span>Loại</span><span>Ưu tiên</span><span>Tài sản</span><span>Nội dung</span><span>Phụ trách</span><span>Trạng thái</span><span></span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((request) => {
            const isExpanded = expandedRequestId === request.id
            return (
              <div key={request.id} className="border-b last:border-b-0 divide-y divide-slate-100/50 dark:divide-slate-800/40">
                {/* Main Row */}
                <article
                  className={`grid gap-3 px-5 py-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer md:grid-cols-[110px_150px_92px_110px_minmax(180px,1fr)_120px_120px_40px] md:items-center md:gap-4 ${
                    highlightedRequestId === request.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/35' : ''
                  } ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-800/5' : ''}`}
                  id={`support-request-${request.id}`}
                  onClick={() => setExpandedRequestId(isExpanded ? null : request.id)}
                >
                  <strong className="text-xs text-brand-700">SR-{request.id.slice(0, 8).toUpperCase()}</strong>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{REQUEST_TYPE_LABELS[request.type] || request.type}</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{PRIORITY_LABELS[request.priority] || request.priority}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{request.asset?.assetCode || '-'}</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate" title={request.description}>
                    {request.description}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{requestAssigneeName(request)}</span>
                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_TONE[request.status] || ''}`}>
                    {STATUS_LABEL[request.status] || request.status}
                  </span>
                  <span className="hidden md:flex justify-end text-slate-400">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </article>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-slate-50/20 px-5 py-6 sm:px-6 dark:bg-slate-900/10 animate-fade-down space-y-6">
                    {/* Progress Timeline Stepper */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 dark:bg-[#15241f]/35 dark:border-slate-800 shadow-soft">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Tiến trình xử lý</h4>
                      <RequestStepper status={request.status} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Left side: History Events Timeline */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 dark:bg-[#15241f]/35 dark:border-slate-800 shadow-soft">
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                          <History size={14} className="text-slate-400" />
                          Nhật ký hoạt động
                        </h4>
                        <ActivityTimeline events={request.events} />
                      </div>

                      {/* Right side: Detailed Info */}
                      <div className="bg-white rounded-2xl border border-slate-100 p-5 dark:bg-[#15241f]/35 dark:border-slate-800 shadow-soft flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">Thông tin chi tiết</h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Thời gian gửi</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(request.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            {request.asset && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tài sản liên kết</span>
                                <Link to={`/employee/assets/${request.asset.assetCode}`} className="font-bold text-brand-700 dark:text-emerald-400 hover:underline">
                                  {request.asset.name} ({request.asset.assetCode})
                                </Link>
                              </div>
                            )}
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Mức ưu tiên</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{PRIORITY_LABELS[request.priority] || request.priority}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Phụ trách</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{requestAssigneeName(request)}</span>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Mô tả sự cố</span>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                              {request.description}
                            </p>
                          </div>

                          {request.resolution && (
                            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Phương án khắc phục</span>
                              <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 font-semibold leading-relaxed bg-emerald-50/40 dark:bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-100/40 dark:border-emerald-500/20">
                                {request.resolution}
                              </p>
                            </div>
                          )}

                          {request.repairCost > 0 && (
                            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Chi phí sửa chữa</span>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {Number(request.repairCost).toLocaleString('vi-VN')} VND
                              </span>
                            </div>
                          )}

                          {request.status === 'COMPLETED' && (
                            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Đánh giá chất lượng dịch vụ</span>
                              {request.ratedAt ? (
                                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          size={16}
                                          className={`${
                                            star <= request.rating
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-slate-300 dark:text-slate-700'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                      {request.rating === 5 ? 'Rất hài lòng' : request.rating === 4 ? 'Hài lòng' : request.rating === 3 ? 'Bình thường' : request.rating === 2 ? 'Không hài lòng' : 'Rất không hài lòng'}
                                    </span>
                                  </div>
                                  {request.feedback && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                      "{request.feedback}"
                                    </p>
                                  )}
                                  <p className="text-[10px] text-slate-400">
                                    Đã đánh giá vào: {new Date(request.ratedAt).toLocaleString('vi-VN')}
                                  </p>
                                </div>
                              ) : (
                                <RatingForm id={request.id} onSuccess={() => handleRateSuccess(request.id)} />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions inside panel (e.g. Cancel Request) */}
                        {(request.status === 'PENDING' || request.status === 'APPROVED') && (
                          <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => handleCancel(request.id)}
                              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/70 border border-transparent transition dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                            >
                              <XCircle size={14} />
                              Hủy yêu cầu hỗ trợ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {!requests.length && (
        <div className="grid min-h-72 place-items-center text-center">
          <div><Headphones className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-sm text-slate-500">Bạn chưa có yêu cầu hỗ trợ.</p></div>
        </div>
      )}

      {selectedFaq && (
        <Modal
          title={selectedFaq.question}
          description={`Danh mục: ${selectedFaq.category}`}
          onClose={() => setSelectedFaq(null)}
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
              {selectedFaq.answer}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-3 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                Hướng dẫn này có giải quyết được vấn đề?
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="py-1.5 px-3 text-xs"
                  onClick={() => setSelectedFaq(null)}
                >
                  Không, vẫn cần gửi yêu cầu
                </Button>
                <Button
                  type="button"
                  className="py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setSelectedFaq(null)
                    setFormOpen(false)
                    setForm((current) => ({ ...current, description: '' }))
                    setSuccess('Cảm ơn bạn! Hệ thống đã ghi nhận bạn tự khắc phục thành công sự cố.')
                    setError('')
                  }}
                >
                  Tôi đã tự khắc phục được
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
