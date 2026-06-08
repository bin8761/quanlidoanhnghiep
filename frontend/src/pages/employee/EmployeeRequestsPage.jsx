import { Headphones, Plus, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import PageHeader from '../../components/ui/PageHeader'
import { createRequest, getMyRequests, getMyAssets } from '../../services/employee.service'

const statusTone = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
}

const statusLabel = {
  PENDING: 'Chờ tiếp nhận',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

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

export default function EmployeeRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [requests, setRequests] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({ type: 'INCIDENT', asset: '', issue: '', priority: 'Trung bình' })
  const [myAssets, setMyAssets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [highlightedRequestId, setHighlightedRequestId] = useState('')

  useEffect(() => {
    Promise.all([getMyRequests(), getMyAssets()])
      .then(([reqs, assetList]) => {
        setRequests(reqs)
        setMyAssets(assetList)
        if (assetList.length) setForm((f) => ({ ...f, asset: assetList[0].asset?.assetCode }))
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (isLoading || !requests.length) return undefined

    const requestId = searchParams.get('requestId')
    if (!requestId) return undefined

    const request = requests.find((item) => item.id === requestId)
    if (!request) return undefined

    const timer = window.setTimeout(() => {
      setHighlightedRequestId(requestId)
      document.getElementById(`maintenance-request-${requestId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })

      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        next.delete('requestId')
        return next
      }, { replace: true })
    }, 0)

    const clearHighlightTimer = window.setTimeout(() => {
      setHighlightedRequestId('')
    }, 4500)

    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(clearHighlightTimer)
    }
  }, [isLoading, requests, searchParams, setSearchParams])

  if (isLoading) {
    return (
      <div className="grid min-h-72 place-items-center">
        Đang tải...
      </div>
    )
  }

  async function submitRequest(event) {
    event.preventDefault()
    if (!form.issue.trim()) return

    const isAssetRequired = typesRequiringAsset.includes(form.type)
    let assetId = null
    if (isAssetRequired) {
      const selectedAsset = myAssets.find((a) => a.asset?.assetCode === form.asset)
      if (!selectedAsset) {
        alert('Vui lòng chọn tài sản cho loại yêu cầu này.')
        return
      }
      assetId = selectedAsset.asset?.id
    } else if (form.asset) {
      const selectedAsset = myAssets.find((a) => a.asset?.assetCode === form.asset)
      if (selectedAsset) {
        assetId = selectedAsset.asset?.id
      }
    }

    try {
      await createRequest({
        type: form.type,
        assetId: assetId,
        description: form.issue.trim(),
        priority: form.priority,
      })
      const updated = await getMyRequests()
      setRequests(updated)
      setForm((f) => ({ ...f, issue: '' }))
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
        description="Báo cáo sự cố và theo dõi tiến độ xử lý tài sản."
        actions={(
          <Button className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
            <Plus size={17} /> Tạo yêu cầu
          </Button>
        )}
      />

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {error}
        </div>
      )}

      {formOpen && (
        <section className="surface mb-5 border-brand-200 p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Tạo yêu cầu mới</h3>
              <p className="mt-1 text-xs text-slate-500">Mô tả rõ tình trạng để được hỗ trợ nhanh hơn.</p>
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
              options={Object.entries(requestTypeLabels).map(([value, label]) => ({ value, label }))}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            />
            {typesRequiringAsset.includes(form.type) ? (
              <FormField
                label="Tài sản"
                name="asset"
                as="select"
                value={form.asset}
                options={myAssets.map((item) => ({
                  value: item.asset?.assetCode,
                  label: `${item.asset?.assetCode} - ${item.asset?.name}`,
                }))}
                onChange={(event) => setForm((current) => ({ ...current, asset: event.target.value }))}
              />
            ) : (
              <FormField
                label="Tài sản liên kết (tùy chọn)"
                name="asset"
                as="select"
                value={form.asset}
                options={[
                  { value: '', label: 'Không liên kết tài sản' },
                  ...myAssets.map((item) => ({
                    value: item.asset?.assetCode,
                    label: `${item.asset?.assetCode} - ${item.asset?.name}`,
                  }))
                ]}
                onChange={(event) => setForm((current) => ({ ...current, asset: event.target.value }))}
              />
            )}
            <FormField
              label="Mức độ ưu tiên"
              name="priority"
              as="select"
              value={form.priority}
              options={['Thấp', 'Trung bình', 'Cao'].map((value) => ({ value, label: value }))}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            />
            <div className="sm:col-span-2">
              <FormField
                label="Mô tả sự cố"
                name="issue"
                as="textarea"
                placeholder={form.type === 'INCIDENT' ? "Ví dụ: Máy không khởi động, màn hình hiển thị lỗi..." : "Nhập chi tiết yêu cầu hỗ trợ..."}
                value={form.issue}
                required
                onChange={(event) => setForm((current) => ({ ...current, issue: event.target.value }))}
              />
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit"><Send size={16} /> Gửi yêu cầu</Button>
            </div>
          </form>
        </section>
      )}

      <section className="surface overflow-hidden">
        <div className="hidden grid-cols-[110px_130px_110px_minmax(200px,1fr)_120px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid">
          <span>Mã yêu cầu</span><span>Loại yêu cầu</span><span>Tài sản</span><span>Nội dung</span><span>Ngày tạo</span><span>Trạng thái</span>
        </div>
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <article
              className={`grid gap-3 px-5 py-4 transition md:grid-cols-[110px_130px_110px_minmax(200px,1fr)_120px_120px] md:items-center md:gap-4 ${
                highlightedRequestId === request.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
              }`}
              id={`maintenance-request-${request.id}`}
              key={request.id}
            >
              <strong className="text-xs text-brand-700">MR-{request.id.slice(0, 8).toUpperCase()}</strong>
              <span className="text-xs font-semibold text-slate-700">{requestTypeLabels[request.type] || request.type}</span>
              <span className="text-xs text-slate-600">{request.asset?.assetCode || '—'}</span>
              <span className="text-xs text-slate-600">{request.description}</span>
              <span className="text-[11px] text-slate-500">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone[request.status] || ''}`}>
                {statusLabel[request.status] || request.status}
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
