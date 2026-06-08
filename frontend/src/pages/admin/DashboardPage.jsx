import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { assignmentApi } from '../../api/assignments'
import { inventoryApi } from '../../api/inventory'
import { reportApi } from '../../api/reports'
import { ResourceError } from '../../components/admin/ResourceFeedback'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUS_LABELS = {
  AVAILABLE: 'Sẵn sàng',
  ASSIGNED: 'Đang sử dụng',
  MAINTENANCE: 'Đang bảo trì',
  BROKEN: 'Bị hỏng',
  LOST: 'Thất lạc',
  DISPOSED: 'Đã thanh lý',
}

const STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-500',
  ASSIGNED: 'bg-blue-500',
  MAINTENANCE: 'bg-amber-500',
  BROKEN: 'bg-red-500',
  LOST: 'bg-slate-500',
  DISPOSED: 'bg-slate-300',
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Chào buổi sáng'
  if (hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function MetricCard({ label, value, note, icon: Icon, accent, href }) {
  return (
    <Link
      className="metric-card group p-4 sm:p-5"
      to={href}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-slate-500">{label}</span>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${accent}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="mt-4 text-[28px] leading-none font-extrabold text-slate-950">{value}</div>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500">
        <span>{note}</span>
        <ArrowRight className="text-brand-600 transition group-hover:translate-x-0.5" size={14} />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncedAt, setSyncedAt] = useState(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [summaryData, assignmentData, sessionData] = await Promise.all([
        reportApi.summary(),
        assignmentApi.history(),
        inventoryApi.list(),
      ])
      setSummary(summaryData)
      setAssignments(assignmentData)
      setSessions(sessionData)
      setSyncedAt(new Date())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const metrics = summary
    ? [
        {
          label: 'Tổng tài sản',
          value: summary.totalAssets,
          note: 'Xem danh sách tài sản',
          icon: Boxes,
          accent: 'bg-brand-50 text-brand-700',
          href: '/admin/assets',
        },
        {
          label: 'Đang bàn giao',
          value: summary.activeAssignments,
          note: 'Quản lý người sử dụng',
          icon: PackageCheck,
          accent: 'bg-blue-50 text-blue-700',
          href: '/admin/assignments',
        },
        {
          label: 'Bảo trì cần xử lý',
          value: summary.openMaintenanceRequests,
          note: 'Mở hàng đợi bảo trì',
          icon: Wrench,
          accent: 'bg-amber-50 text-amber-700',
          href: '/admin/maintenance',
        },
        {
          label: 'Phiên kiểm kê',
          value: summary.inventorySessions,
          note: 'Theo dõi tiến độ',
          icon: ClipboardCheck,
          accent: 'bg-violet-50 text-violet-700',
          href: '/admin/inventory',
        },
      ]
    : []

  const health = useMemo(
    () =>
      (summary?.assetsByStatus || []).map((item) => ({
        ...item,
        label: STATUS_LABELS[item.status] || item.status,
        percent: summary.totalAssets ? Math.round((item.count / summary.totalAssets) * 100) : 0,
        color: STATUS_COLORS[item.status] || 'bg-slate-400',
      })),
    [summary],
  )

  const recentActivities = useMemo(() => {
    const assignmentItems = assignments.slice(0, 5).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      date: assignment.updatedAt || assignment.assignedAt,
      icon: PackageCheck,
      tone: 'bg-blue-50 text-blue-700',
      title: `${assignment.asset?.assetCode} · ${assignment.asset?.name}`,
      detail: `${assignment.employee?.fullName} · ${assignment.employee?.department?.name || 'Chưa có phòng ban'}`,
      status: assignment.status,
    }))
    const inventoryItems = sessions.slice(0, 3).map((session) => ({
      id: `inventory-${session.id}`,
      date: session.updatedAt || session.startDate,
      icon: ClipboardCheck,
      tone: 'bg-emerald-50 text-emerald-700',
      title: session.name,
      detail: `${session.department?.name || 'Chưa có phòng ban'} · ${session.items.length} tài sản`,
      status: session.status,
    }))

    return [...assignmentItems, ...inventoryItems]
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 6)
  }, [assignments, sessions])

  const assignedPercent = summary?.totalAssets
    ? Math.round((summary.activeAssignments / summary.totalAssets) * 100)
    : 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Tổng quan vận hành"
        title={`${getGreeting()}, Quản trị viên`}
        description="Số liệu được tổng hợp trực tiếp từ hoạt động quản lý tài sản."
        icon={Sparkles}
        actions={(
          <button
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            type="button"
            disabled={isLoading}
            onClick={loadDashboard}
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={14} />
            {syncedAt ? `Cập nhật ${formatDateTime(syncedAt)}` : 'Làm mới dữ liệu'}
          </button>
        )}
      />

      {error && <ResourceError message={error} onRetry={loadDashboard} />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div className="skeleton h-36 rounded-[18px]" key={item} />
          ))}
        </div>
      ) : summary && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chỉ số tổng quan">
            {metrics.map((metric) => <MetricCard {...metric} key={metric.label} />)}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
            <article className="surface overflow-hidden">
              <header className="flex min-h-18 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Hoạt động gần đây</h3>
                  <p className="mt-1 text-xs text-slate-500">Bàn giao và kiểm kê mới nhất</p>
                </div>
                <Link className="flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-800" to="/admin/assignments">
                  Xem lịch sử <ArrowRight size={14} />
                </Link>
              </header>
              <div className="px-5 sm:px-6">
                {recentActivities.length ? recentActivities.map(({ id, icon: Icon, title, detail, date, tone, status }) => (
                  <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-[42px_minmax(0,1fr)_auto]" key={id}>
                    <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={17} /></span>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-bold text-slate-800">{title}</strong>
                      <span className="mt-1 block truncate text-[11px] text-slate-500">{detail}</span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <StatusBadge status={status} />
                      <span className="mt-1 block text-[10px] text-slate-400">{formatDateTime(date)}</span>
                    </span>
                  </div>
                )) : (
                  <div className="grid min-h-64 place-items-center text-center">
                    <div>
                      <PackageCheck className="mx-auto text-slate-300" size={28} />
                      <p className="mt-3 text-sm font-bold text-slate-700">Chưa có hoạt động</p>
                      <p className="mt-1 text-xs text-slate-500">Các lượt bàn giao và kiểm kê sẽ xuất hiện tại đây.</p>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <article className="surface p-5 sm:p-6">
              <header className="mb-6">
                <h3 className="text-sm font-extrabold text-slate-900">Trạng thái tài sản</h3>
                <p className="mt-1 text-xs text-slate-500">Phân bổ theo dữ liệu hiện tại</p>
              </header>
              <div className="grid gap-5">
                {health.map((item) => (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      <span className="text-xs font-extrabold text-slate-900">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 rounded-2xl bg-slate-950 p-4 text-white">
                <p className="text-[11px] text-white/55">Tỷ lệ tài sản đang sử dụng</p>
                <div className="mt-2 flex items-end justify-between">
                  <strong className="text-2xl font-extrabold">{assignedPercent}%</strong>
                  <Link className="text-[10px] font-semibold text-emerald-300 hover:text-emerald-200" to="/admin/reports">
                    Xem báo cáo
                  </Link>
                </div>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}
