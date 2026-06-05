import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  Sparkles,
  TrendingUp,
  UserRoundPlus,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../../auth/auth-context'

const metrics = [
  {
    label: 'Tổng tài sản',
    value: '248',
    note: '+12 trong tháng này',
    icon: Boxes,
    accent: 'bg-brand-50 text-brand-700',
  },
  {
    label: 'Đang bàn giao',
    value: '176',
    note: '71% tổng tài sản',
    icon: PackageCheck,
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    label: 'Yêu cầu bảo trì',
    value: '14',
    note: '5 yêu cầu cần xử lý',
    icon: Wrench,
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    label: 'Tổng giá trị',
    value: '4,82 tỷ',
    note: '+8,4% so với quý trước',
    icon: CircleDollarSign,
    accent: 'bg-violet-50 text-violet-700',
  },
]

const activities = [
  {
    icon: PackageCheck,
    title: 'Bàn giao laptop LT-0248',
    detail: 'Nguyễn Minh Anh · Phòng Kỹ thuật',
    time: '12 phút trước',
    tone: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Wrench,
    title: 'Yêu cầu bảo trì MR-1032',
    detail: 'Máy in PR-0018 · Lỗi kẹt giấy',
    time: '38 phút trước',
    tone: 'bg-amber-50 text-amber-700',
  },
  {
    icon: UserRoundPlus,
    title: 'Thêm nhân viên mới',
    detail: 'Trần Hoàng Nam · Phòng Kinh doanh',
    time: '2 giờ trước',
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    icon: ClipboardCheck,
    title: 'Hoàn tất kiểm kê quý II',
    detail: 'Phòng Hành chính · 42 tài sản',
    time: 'Hôm qua',
    tone: 'bg-emerald-50 text-emerald-700',
  },
]

const health = [
  { label: 'Sẵn sàng', value: '42', percent: 17, color: 'bg-emerald-500' },
  { label: 'Đang sử dụng', value: '176', percent: 71, color: 'bg-blue-500' },
  { label: 'Bảo trì / hỏng', value: '21', percent: 8, color: 'bg-amber-500' },
  { label: 'Trạng thái khác', value: '9', percent: 4, color: 'bg-slate-400' },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="animate-fade-up">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand-700">
            <Sparkles size={14} />
            Tổng quan vận hành
          </div>
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Chào buổi sáng, Quản trị viên
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Tình hình tài sản doanh nghiệp được cập nhật đến hôm nay.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          <span className="size-2 rounded-full bg-emerald-500" />
          Dữ liệu đồng bộ lúc 09:30
        </div>
      </header>

      {user?.isDemo && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-sm text-brand-800">
          <Sparkles className="mt-0.5 shrink-0" size={17} />
          <span>
            Bạn đang xem dữ liệu demo. Đăng nhập bằng tài khoản quản trị để sử dụng dữ
            liệu thật từ hệ thống.
          </span>
        </div>
      )}

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Chỉ số tổng quan"
      >
        {metrics.map(({ label, value, note, icon: Icon, accent }) => (
          <article
            className="group min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
            key={label}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500">{label}</span>
              <span
                className={`grid size-10 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${accent}`}
              >
                <Icon size={19} />
              </span>
            </div>
            <div className="mt-5 text-[28px] leading-none font-extrabold text-slate-950">
              {value}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <TrendingUp className="text-emerald-500" size={13} />
              {note}
            </div>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <header className="flex min-h-18 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Hoạt động gần đây</h3>
              <p className="mt-1 text-xs text-slate-500">
                Các thay đổi mới nhất trong hệ thống
              </p>
            </div>
            <button
              className="flex items-center gap-1 text-xs font-bold text-brand-700 transition hover:text-brand-800"
              type="button"
            >
              Xem tất cả
              <ArrowUpRight size={14} />
            </button>
          </header>
          <div className="px-5 sm:px-6">
            {activities.map(({ icon: Icon, title, detail, time, tone }) => (
              <div
                className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-[42px_minmax(0,1fr)_auto]"
                key={title}
              >
                <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-xs font-bold text-slate-800">
                    {title}
                  </strong>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">
                    {detail}
                  </span>
                </span>
                <span className="hidden text-[10px] font-medium text-slate-400 sm:block">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
          <header className="mb-6">
            <h3 className="text-sm font-extrabold text-slate-900">Trạng thái tài sản</h3>
            <p className="mt-1 text-xs text-slate-500">Phân bổ theo trạng thái hiện tại</p>
          </header>
          <div className="grid gap-5">
            {health.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  <span className="text-xs font-extrabold text-slate-900">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-[11px] text-white/55">Tỷ lệ tài sản đang sử dụng</p>
            <div className="mt-2 flex items-end justify-between">
              <strong className="text-2xl font-extrabold">71%</strong>
              <span className="text-[10px] font-semibold text-emerald-300">Ổn định</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
