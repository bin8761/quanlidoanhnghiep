import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, Download, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi } from '../../api/categories'
import { departmentApi } from '../../api/departments'
import { locationApi } from '../../api/locations'
import { reportApi } from '../../api/reports'
import { ResourceError } from '../../components/admin/ResourceFeedback'
import Button from '../../components/ui/Button'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge'

const STATUS_OPTIONS = ['', 'AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'BROKEN', 'LOST', 'DISPOSED']
const ISSUE_LABELS = {
  ASSIGNED_WITHOUT_ACTIVE_ASSIGNMENT: 'Đang sử dụng nhưng không có bàn giao',
  ACTIVE_ASSIGNMENT_STATUS_MISMATCH: 'Có bàn giao nhưng trạng thái không khớp',
  MULTIPLE_ACTIVE_ASSIGNMENTS: 'Có nhiều bàn giao đang hoạt động',
  INVALID_STATUS_WITH_ACTIVE_ASSIGNMENT: 'Trạng thái không hợp lệ vẫn đang bàn giao',
  MISSING_OWNER_DEPARTMENT: 'Thiếu phòng ban sở hữu',
  MISSING_LOCATION: 'Thiếu vị trí cố định và vị trí người sử dụng',
  MISSING_SERIAL_NUMBER: 'Thiếu serial number',
  DUPLICATE_SERIAL_NUMBER: 'Trùng serial number',
}

function Metric({ icon: Icon, label, value, note, tone, onClick }) {
  return <button className="metric-card p-4 text-left sm:p-5" type="button" onClick={onClick}>
    <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span>
    <strong className="mt-4 block text-3xl font-extrabold text-slate-950">{value}</strong>
    <span className="mt-1 block text-xs font-semibold text-slate-500">{label}</span>
    {note && <span className="mt-2 block text-[10px] text-slate-400">{note}</span>}
  </button>
}

function BarList({ rows, nameKey }) {
  const maximum = Math.max(...rows.map((row) => row.count), 1)
  return <div className="grid gap-4">{rows.map((row) => <div key={`${row[nameKey]}-${row.count}`}>
    <div className="mb-2 flex justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-700">{row[nameKey]}</span><strong>{row.count}</strong></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${(row.count / maximum) * 100}%` }} /></div>
  </div>)}</div>
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams])
  const [data, setData] = useState(null)
  const [lookups, setLookups] = useState({ categories: [], departments: [], locations: [] })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadReports = useCallback(async () => {
    setIsLoading(true); setError('')
    try {
      const [summary, categories, owners, usage, trends, quality, assets, categoryOptions, departmentOptions, locationOptions] = await Promise.all([
        reportApi.summary(filters), reportApi.assetsByCategory(filters),
        reportApi.assetsByDepartment({ ...filters, dimension: 'owner' }),
        reportApi.assetsByDepartment({ ...filters, dimension: 'usage' }),
        reportApi.trends(filters), reportApi.dataQuality(filters), reportApi.assets(filters),
        categoryApi.list(), departmentApi.list(), locationApi.list(),
      ])
      setData({ summary, categories, owners, usage, trends, quality, assets })
      setLookups({ categories: categoryOptions, departments: departmentOptions, locations: locationOptions })
    } catch (requestError) { setError(requestError.message) } finally { setIsLoading(false) }
  }, [filters])

  useEffect(() => { const timer = window.setTimeout(loadReports, 0); return () => window.clearTimeout(timer) }, [loadReports])
  const setFilter = (key, value) => { const next = new URLSearchParams(searchParams); value ? next.set(key, value) : next.delete(key); if (key !== 'page') next.delete('page'); setSearchParams(next) }
  const drill = (changes) => { const next = new URLSearchParams(searchParams); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); setSearchParams(next) }
  const columns = [
    { key: 'assetCode', label: 'Mã tài sản' }, { key: 'name', label: 'Tên' },
    { key: 'status', label: 'Trạng thái', render: (value) => <StatusBadge status={value} /> },
    { key: 'ownerDepartment', label: 'Phòng ban sở hữu', render: (value) => value?.name || 'Chưa xác định' },
    { key: 'assignments', label: 'Phòng ban sử dụng', render: (value) => value[0]?.employee?.department?.name || 'Chưa xác định' },
    { key: 'location', label: 'Vị trí', render: (value) => value?.name || 'Chưa xác định' },
  ]

  return <div className="animate-fade-up">
    <PageHeader eyebrow="Phân tích dữ liệu vận hành" title="Báo cáo tài sản" description="KPI snapshot hiện tại, tài sản ghi nhận mới và kiểm soát chất lượng dữ liệu."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={loadReports}>
            <RefreshCw size={16} />Làm mới
          </Button>
          <Button variant="secondary" onClick={() => reportApi.exportCsv(filters)}>
            <Download size={16} />CSV
          </Button>
          <Button variant="secondary" onClick={() => reportApi.exportXlsx(filters)}>
            <Download size={16} />Excel
          </Button>
          <Button onClick={() => reportApi.exportPdf(filters)}>
            <Download size={16} />PDF
          </Button>
        </div>
      } 
    />
    {error && <ResourceError message={error} onRetry={loadReports} />}
    <section className="surface mb-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-7">
      <input className="rounded-lg border border-slate-200 p-2 text-xs" type="date" value={filters.from || ''} onChange={(e) => setFilter('from', e.target.value)} />
      <input className="rounded-lg border border-slate-200 p-2 text-xs" type="date" value={filters.to || ''} onChange={(e) => setFilter('to', e.target.value)} />
      <select className="rounded-lg border border-slate-200 p-2 text-xs" value={filters.status || ''} onChange={(e) => setFilter('status', e.target.value)}>{STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v || 'Tất cả trạng thái'}</option>)}</select>
      <select className="rounded-lg border border-slate-200 p-2 text-xs" value={filters.categoryId || ''} onChange={(e) => setFilter('categoryId', e.target.value)}><option value="">Tất cả danh mục</option>{lookups.categories.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
      <select className="rounded-lg border border-slate-200 p-2 text-xs" value={filters.ownerDepartmentId || ''} onChange={(e) => setFilter('ownerDepartmentId', e.target.value)}><option value="">Phòng ban sở hữu</option>{lookups.departments.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
      <select className="rounded-lg border border-slate-200 p-2 text-xs" value={filters.usageDepartmentId || ''} onChange={(e) => setFilter('usageDepartmentId', e.target.value)}><option value="">Phòng ban sử dụng</option>{lookups.departments.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
      <select className="rounded-lg border border-slate-200 p-2 text-xs" value={filters.locationId || ''} onChange={(e) => setFilter('locationId', e.target.value)}><option value="">Tất cả vị trí</option>{lookups.locations.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
      <p className="text-[10px] text-slate-400 sm:col-span-2 xl:col-span-7">Khoảng ngày chỉ áp dụng cho biểu đồ tài sản được ghi nhận mới. KPI snapshot, phân bổ và chất lượng dữ liệu luôn phản ánh trạng thái hiện tại.</p>
    </section>
    {isLoading || !data ? <div className="skeleton h-64 rounded-[18px]" /> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Boxes} label="Tổng tài sản" value={data.summary.totalAssets} tone="bg-brand-50 text-brand-700" onClick={() => drill({ issue: '', status: '' })} />
        <Metric icon={TrendingUp} label="Tỷ lệ sử dụng" value={`${data.summary.utilizationRate}%`} note={`${data.summary.operationalAssets} tài sản có thể vận hành`} tone="bg-blue-50 text-blue-700" onClick={() => drill({ issue: '', status: 'ASSIGNED' })} />
        <Metric icon={ShieldCheck} label="Tỷ lệ khả dụng" value={`${data.summary.availabilityRate}%`} tone="bg-emerald-50 text-emerald-700" onClick={() => drill({ issue: '', status: 'AVAILABLE' })} />
        <Metric icon={AlertTriangle} label="Tài sản cần chuẩn hóa dữ liệu" value={data.summary.affectedAssetCount} note={`${data.summary.dataQualityIssueCount} lỗi dữ liệu được phát hiện`} tone="bg-amber-50 text-amber-700" />
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        <article className="surface p-5"><h3 className="mb-5 text-sm font-extrabold">Theo danh mục</h3><BarList rows={data.categories} nameKey="categoryName" /></article>
        <article className="surface p-5"><h3 className="mb-5 text-sm font-extrabold">Phòng ban sở hữu</h3><BarList rows={data.owners} nameKey="departmentName" /></article>
        <article className="surface p-5"><h3 className="mb-5 text-sm font-extrabold">Phòng ban sử dụng</h3><BarList rows={data.usage} nameKey="departmentName" /></article>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="surface p-5"><h3 className="mb-1 text-sm font-extrabold">Tài sản được ghi nhận mới theo tháng</h3><p className="mb-5 text-xs text-slate-500">Tính theo thời điểm tài sản được tạo trong hệ thống, không phải ngày mua hoặc ngày thanh lý.</p><BarList rows={data.trends.map((v) => ({ ...v, count: v.added }))} nameKey="month" /></article>
        <article className="surface p-5"><h3 className="mb-4 text-sm font-extrabold">Chất lượng dữ liệu</h3><div className="grid gap-2">{data.quality.map((item) => <button className="flex justify-between rounded-xl border border-slate-100 p-3 text-left text-xs hover:bg-amber-50" key={item.type} onClick={() => drill({ issue: item.type, page: 1 })}><span>{ISSUE_LABELS[item.type]}</span><strong>{item.count}</strong></button>)}</div></article>
      </section>
      <div className="mt-5">
        <DataTable columns={columns} rows={data.assets.items} searchValue="" onSearchChange={() => {}} searchPlaceholder={filters.issue ? ISSUE_LABELS[filters.issue] : 'Danh sách tài sản theo bộ lọc'} />
        {data.assets.pagination.totalPages > 1 && <div className="mt-3 flex items-center justify-end gap-3 text-xs text-slate-500">
          <Button variant="secondary" disabled={data.assets.pagination.page <= 1} onClick={() => setFilter('page', String(data.assets.pagination.page - 1))}>Trang trước</Button>
          <span>Trang {data.assets.pagination.page}/{data.assets.pagination.totalPages}</span>
          <Button variant="secondary" disabled={data.assets.pagination.page >= data.assets.pagination.totalPages} onClick={() => setFilter('page', String(data.assets.pagination.page + 1))}>Trang sau</Button>
        </div>}
      </div>
    </>}
  </div>
}
