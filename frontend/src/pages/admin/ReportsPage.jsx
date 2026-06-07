import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, ClipboardCheck, PackageCheck, RefreshCw, Wrench } from 'lucide-react'
import { reportApi } from '../../api/reports'
import { ResourceError } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUS_LABELS = {
  AVAILABLE: 'Sẵn sàng',
  ASSIGNED: 'Đang sử dụng',
  MAINTENANCE: 'Bảo trì',
  BROKEN: 'Bị hỏng',
  LOST: 'Thất lạc',
  DISPOSED: 'Đã thanh lý',
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
      <strong className="mt-5 block text-3xl font-extrabold text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-semibold text-slate-500">{label}</span>
    </article>
  )
}

function BarList({ rows, nameKey, emptyLabel }) {
  const maximum = Math.max(...rows.map((row) => row.count), 1)
  return (
    <div className="grid gap-5">
      {rows.length ? rows.map((row) => (
        <div key={row[nameKey]}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="truncate text-xs font-semibold text-slate-700">{row[nameKey]}</span>
            <strong className="text-xs text-slate-950">{row.count}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(row.count / maximum) * 100}%` }} />
          </div>
        </div>
      )) : <p className="py-10 text-center text-sm text-slate-500">{emptyLabel}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [summaryData, categoryData, departmentData] = await Promise.all([
        reportApi.summary(),
        reportApi.assetsByCategory(),
        reportApi.assetsByDepartment(),
      ])
      setSummary(summaryData)
      setCategories(categoryData)
      setDepartments(departmentData)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(loadReports, 0)
    return () => window.clearTimeout(timer)
  }, [loadReports])

  const statusRows = useMemo(
    () => (summary?.assetsByStatus || []).map((item) => ({
      ...item,
      label: STATUS_LABELS[item.status] || item.status,
      percent: summary.totalAssets ? Math.round((item.count / summary.totalAssets) * 100) : 0,
    })),
    [summary],
  )

  return (
    <div className="animate-fade-up">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold text-brand-700">Phân tích dữ liệu vận hành</p>
          <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">Báo cáo tài sản</h2>
          <p className="mt-2 text-sm text-slate-500">Tổng hợp trạng thái, phân bổ và khối lượng công việc từ dữ liệu hệ thống.</p>
        </div>
        <Button className="w-full sm:w-auto" variant="secondary" type="button" disabled={isLoading} onClick={loadReports}>
          <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />Làm mới dữ liệu
        </Button>
      </header>

      {error && <ResourceError message={error} onRetry={loadReports} />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div className="h-40 animate-pulse rounded-2xl bg-slate-100" key={item} />)}
        </div>
      ) : summary && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Boxes} label="Tổng tài sản" value={summary.totalAssets} tone="bg-brand-50 text-brand-700" />
            <Metric icon={PackageCheck} label="Đang bàn giao" value={summary.activeAssignments} tone="bg-blue-50 text-blue-700" />
            <Metric icon={Wrench} label="Yêu cầu bảo trì mở" value={summary.openMaintenanceRequests} tone="bg-amber-50 text-amber-700" />
            <Metric icon={ClipboardCheck} label="Phiên kiểm kê" value={summary.inventorySessions} tone="bg-violet-50 text-violet-700" />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <header className="mb-6">
                <h3 className="text-sm font-extrabold text-slate-900">Tình trạng tài sản</h3>
                <p className="mt-1 text-xs text-slate-500">Tỷ trọng theo trạng thái hiện tại</p>
              </header>
              <div className="grid gap-3">
                {statusRows.map((item) => (
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4" key={item.status}>
                    <div><StatusBadge status={item.status} /><p className="mt-1 text-xs text-slate-500">{item.label}</p></div>
                    <div className="text-right"><strong className="block text-lg text-slate-950">{item.count}</strong><span className="text-xs text-slate-400">{item.percent}%</span></div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <header className="mb-6">
                <h3 className="text-sm font-extrabold text-slate-900">Tài sản theo danh mục</h3>
                <p className="mt-1 text-xs text-slate-500">Số lượng tài sản trong từng nhóm</p>
              </header>
              <BarList rows={categories} nameKey="categoryName" emptyLabel="Chưa có dữ liệu danh mục." />
            </article>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <header className="mb-6">
              <h3 className="text-sm font-extrabold text-slate-900">Tài sản đang sử dụng theo phòng ban</h3>
              <p className="mt-1 text-xs text-slate-500">Tính theo các lượt bàn giao đang hoạt động</p>
            </header>
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              <BarList rows={departments} nameKey="departmentName" emptyLabel="Chưa có dữ liệu phòng ban." />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
