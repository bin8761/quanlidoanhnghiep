import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  Laptop,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { employeeAssets, initialEmployeeRequests } from './employeeData'

const tasks = [
  { title: 'Xác nhận kiểm kê quý II', due: 'Hạn 07/06/2026', icon: CalendarCheck },
  { title: 'Cập nhật tình trạng laptop LT-0248', due: 'Hạn hôm nay', icon: Laptop },
]

export default function EmployeeDashboardPage() {
  const { user } = useAuth()
  const activeRequests = initialEmployeeRequests.filter((item) => item.status !== 'Hoàn thành')

  return (
    <div className="animate-fade-up">
      <header className="mb-7">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand-700">
          <Sparkles size={14} />
          Không gian làm việc cá nhân
        </div>
        <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">
          Chào bạn, {user?.email?.split('@')[0]}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Theo dõi tài sản, công việc và các yêu cầu hỗ trợ của bạn tại một nơi.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Tài sản đang giữ', value: employeeAssets.length, icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Yêu cầu đang xử lý', value: activeRequests.length, icon: Headphones, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Công việc cần làm', value: tasks.length, icon: Clock3, tone: 'bg-violet-50 text-violet-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
            key={label}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500">{label}</span>
              <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                <Icon size={19} />
              </span>
            </div>
            <strong className="mt-5 block text-3xl font-extrabold text-slate-950">{value}</strong>
            <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={13} />
              Dữ liệu đã cập nhật
            </span>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Tài sản gần đây</h3>
              <p className="mt-1 text-xs text-slate-500">Thiết bị đang được bàn giao cho bạn</p>
            </div>
            <Link className="flex items-center gap-1 text-xs font-bold text-brand-700" to="/employee/assets">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </header>
          <div className="divide-y divide-slate-100 px-5 sm:px-6">
            {employeeAssets.slice(0, 3).map((asset) => (
              <div className="flex items-center gap-3 py-4" key={asset.id}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Laptop size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs font-bold text-slate-800">{asset.name}</strong>
                  <span className="mt-1 block text-[11px] text-slate-500">{asset.code} · {asset.category}</span>
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                  {asset.condition}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
          <h3 className="text-sm font-extrabold text-slate-900">Việc cần hoàn thành</h3>
          <p className="mt-1 text-xs text-slate-500">Các đầu việc liên quan đến tài sản</p>
          <div className="mt-5 grid gap-3">
            {tasks.map(({ title, due, icon: Icon }) => (
              <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5" key={title}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-xs font-bold text-slate-800">{title}</strong>
                  <span className="mt-1 block text-[10px] font-semibold text-amber-600">{due}</span>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
