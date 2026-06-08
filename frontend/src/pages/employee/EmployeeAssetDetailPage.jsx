import {
  ArrowLeft,
  CalendarDays,
  Hash,
  Laptop,
  Tag,
  Wrench,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Link, useParams, Navigate } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import { useEffect, useState } from 'react'
import { getMaintenanceByAsset, getMyAssets } from '../../services/employee.service'

const statusLabel = { IN_PROGRESS: 'Đang xử lý', COMPLETED: 'Hoàn thành', PENDING: 'Chờ tiếp nhận' }

export default function EmployeeAssetDetailPage() {
  const { code } = useParams()
  const [asset, setAsset] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getMyAssets()
      .then((assignments) => {
        const found = assignments.find((item) => item.asset?.assetCode === code)
        if (found) {
          setAsset({
            id: found.asset.id,
            code: found.asset.assetCode,
            name: found.asset.name,
            status: found.asset.status,
            category: found.asset.category?.name || 'Chưa phân loại',
            serial: found.asset.serialNumber || '—',
            assignedAt: new Date(found.assignedAt).toLocaleDateString('vi-VN'),
            condition: found.notes || 'Tốt',
          })
        } else {
          setAsset(null)
        }
      })
      .catch((err) => {
        console.error('Failed to load asset details:', err)
        setAsset(null)
      })
      .finally(() => setIsLoading(false))
  }, [code])

  useEffect(() => {
    if (asset?.id) {
      getMaintenanceByAsset(asset.id)
        .then(setHistory)
        .catch(() => setHistory([]))
    }
  }, [asset?.id])

  if (isLoading) {
    return (
      <div className="grid min-h-72 place-items-center">
        Đang tải chi tiết tài sản...
      </div>
    )
  }

  if (!asset) return <Navigate to="/employee/assets" replace />

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-center gap-3">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-700"
          to="/employee/assets"
        >
          <ArrowLeft size={16} /> Tài sản của tôi
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        {/* Main Info */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                <Laptop size={26} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950">{asset.name}</h2>
                <p className="mt-0.5 text-sm font-semibold text-brand-700">{asset.code}</p>
              </div>
            </div>
            <StatusBadge status={asset.status === 'Đang sử dụng' ? 'ASSIGNED' : 'AVAILABLE'} />
          </div>

          <dl className="grid gap-px bg-slate-100 sm:grid-cols-2">
            {[
              { label: 'Danh mục', value: asset.category, icon: Tag },
              { label: 'Serial number', value: asset.serial, icon: Hash },
              { label: 'Ngày nhận', value: asset.assignedAt, icon: CalendarDays },
              { label: 'Tình trạng', value: asset.condition, icon: FileText },
            ].map(({ label, value, icon: Icon }) => (
              <div className="flex items-start gap-3 bg-white p-5" key={label}>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={17} />
                </span>
                <div>
                  <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-800">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* Quick Actions */}
        <div className="grid gap-5 content-start">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
            <h3 className="text-sm font-extrabold text-slate-900">Thao tác nhanh</h3>
            <div className="mt-4 grid gap-2">
              <Link
                to="/employee/requests"
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                Báo cáo sự cố / hỏng hóc
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Maintenance History */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <Wrench size={17} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Lịch sử bảo trì</h3>
            <p className="text-[11px] text-slate-500">Các lần sửa chữa trước đây</p>
          </div>
        </header>
        {history.length ? (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <article className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_110px_110px_100px]" key={item.id}>
                <div>
                  <strong className="text-xs font-bold text-brand-700">{item.code}</strong>
                  <p className="mt-0.5 text-xs text-slate-600">{item.issue}</p>
                </div>
                <span className="text-[11px] text-slate-500">{item.createdAt}</span>
                <span className="text-[11px] text-slate-500">{item.resolvedAt || '—'}</span>
                <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${item.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                  {statusLabel[item.status]}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center text-center px-5 py-8">
            <Wrench className="mx-auto text-slate-300" size={28} />
            <p className="mt-3 text-sm text-slate-500">Chưa có lịch sử bảo trì.</p>
          </div>
        )}
      </section>
    </div>
  )
}
