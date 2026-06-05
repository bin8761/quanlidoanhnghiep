import { Headphones, Plus, Send, X } from 'lucide-react'
import { useState } from 'react'
import Button from '../../components/ui/Button'
import FormField from '../../components/ui/FormField'
import { employeeAssets, initialEmployeeRequests } from './employeeData'

const statusTone = {
  'Đang xử lý': 'border-blue-200 bg-blue-50 text-blue-700',
  'Hoàn thành': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Chờ tiếp nhận': 'border-amber-200 bg-amber-50 text-amber-700',
}

export default function EmployeeRequestsPage() {
  const [requests, setRequests] = useState(initialEmployeeRequests)
  const [formOpen, setFormOpen] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ asset: employeeAssets[0].code, issue: '', priority: 'Trung bình' })

  function submitRequest(event) {
    event.preventDefault()
    if (!form.issue.trim()) return

    setRequests((current) => [
      {
        id: Date.now(),
        code: `MR-${String(1033 + current.length).padStart(4, '0')}`,
        asset: form.asset,
        issue: form.issue.trim(),
        createdAt: '05/06/2026',
        status: 'Chờ tiếp nhận',
        priority: form.priority,
      },
      ...current,
    ])
    setForm((current) => ({ ...current, issue: '' }))
    setFormOpen(false)
    setSuccess('Yêu cầu hỗ trợ đã được gửi thành công.')
  }

  return (
    <div className="animate-fade-up">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-950">Yêu cầu hỗ trợ</h2>
          <p className="mt-2 text-sm text-slate-500">
            Báo cáo sự cố và theo dõi tiến độ xử lý tài sản.
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={17} /> Tạo yêu cầu
        </Button>
      </header>

      {success && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {formOpen && (
        <section className="mb-5 rounded-2xl border border-brand-200 bg-white p-5 shadow-soft sm:p-6">
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
              label="Tài sản"
              name="asset"
              as="select"
              value={form.asset}
              options={employeeAssets.map((asset) => ({
                value: asset.code,
                label: `${asset.code} - ${asset.name}`,
              }))}
              onChange={(event) => setForm((current) => ({ ...current, asset: event.target.value }))}
            />
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
                placeholder="Ví dụ: Máy không khởi động, màn hình hiển thị lỗi..."
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

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <div className="hidden grid-cols-[110px_110px_minmax(220px,1fr)_120px_120px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid">
          <span>Mã yêu cầu</span><span>Tài sản</span><span>Sự cố</span><span>Ngày tạo</span><span>Trạng thái</span>
        </div>
        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <article className="grid gap-3 px-5 py-4 md:grid-cols-[110px_110px_minmax(220px,1fr)_120px_120px] md:items-center md:gap-4" key={request.id}>
              <strong className="text-xs text-brand-700">{request.code}</strong>
              <span className="text-xs font-semibold text-slate-700">{request.asset}</span>
              <span className="text-xs text-slate-600">{request.issue}</span>
              <span className="text-[11px] text-slate-500">{request.createdAt}</span>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusTone[request.status]}`}>
                {request.status}
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
