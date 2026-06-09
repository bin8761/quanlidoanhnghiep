import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Headphones,
  Laptop,
  Sparkles,
  ClipboardCheck,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import PageHeader from '../../components/ui/PageHeader'
import { getMyTasks, getMyAssets, getMyRequests } from '../../services/employee.service'

const getTaskIcon = (type) => {
  switch (type) {
    case 'INVENTORY_CONFIRMATION':
      return ClipboardCheck
    case 'ASSET_RECEIPT_CONFIRMATION':
      return Laptop
    case 'MAINTENANCE_FEEDBACK':
      return Wrench
    default:
      return ClipboardCheck
  }
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [assets, setAssets] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    Promise.all([getMyTasks(), getMyAssets(), getMyRequests()])
      .then(([tasksList, assetsList, requestsList]) => {
        setTasks(tasksList)
        setAssets(assetsList || [])
        setRequests(requestsList || [])
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err)
      })
  }, [])

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Không gian làm việc cá nhân"
        title={`Chào bạn, ${user?.email?.split('@')[0]}`}
        description="Theo dõi tài sản, công việc và các yêu cầu hỗ trợ của bạn tại một nơi."
        icon={Sparkles}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Tài sản đang giữ', value: assets.length, icon: Boxes, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Yêu cầu đang xử lý', value: requests.filter((item) => !['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status)).length, icon: Headphones, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Công việc cần làm', value: tasks.length, icon: Clock3, tone: 'bg-violet-50 text-violet-700' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <article
            className="metric-card p-4 sm:p-5"
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
        <article className="surface overflow-hidden">
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
            {assets.length ? (
              assets.slice(0, 3).map((item) => (
                <div className="flex items-center gap-3 py-4" key={item.id}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Laptop size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-bold text-slate-800">{item.asset?.name}</strong>
                    <span className="mt-1 block text-[11px] text-slate-500">{item.asset?.assetCode} · {item.asset?.category?.name || 'Chưa phân loại'}</span>
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                    {item.notes || 'Tốt'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">Bạn chưa được bàn giao tài sản nào.</p>
            )}
          </div>
        </article>

        <article className="surface p-5 sm:p-6">
          <h3 className="text-sm font-extrabold text-slate-900">Việc cần hoàn thành</h3>
          <p className="mt-1 text-xs text-slate-500">Các đầu việc liên quan đến tài sản</p>
          <div className="mt-5 grid gap-3">
            {tasks.length ? (
              tasks.map((task) => {
                const Icon = getTaskIcon(task.type)
                const formattedDue = task.dueAt
                  ? `Hạn ${new Date(task.dueAt).toLocaleDateString('vi-VN')}`
                  : 'Không có hạn chót'

                return (
                  <Link
                    to={task.actionUrl}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 hover:bg-slate-100/80 transition"
                    key={task.id}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 shadow-sm">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-xs font-bold text-slate-800">{task.title}</strong>
                      <span className="mt-1 block text-[10px] font-semibold text-amber-600">
                        {formattedDue}
                      </span>
                    </span>
                  </Link>
                )
              })
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">Không có việc cần hoàn thành.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
