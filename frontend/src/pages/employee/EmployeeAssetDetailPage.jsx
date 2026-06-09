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
import { API_BASE_URL } from '../../api/client'

const getFullImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  return `${API_BASE_URL.replace('/api', '')}${url}`
}

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
          const emp = found.employee
          const ast = found.asset
          const resolvedLoc = ast.locationId && ast.locationX !== null
            ? {
                name: ast.location?.name,
                floorPlanUrl: ast.location?.floorPlanUrl,
                x: ast.locationX,
                y: ast.locationY,
                type: 'FIXED',
              }
            : emp?.locationId && emp?.deskX !== null
              ? {
                  name: emp.location?.name,
                  floorPlanUrl: emp.location?.floorPlanUrl,
                  x: emp.deskX,
                  y: emp.deskY,
                  type: 'ASSIGNED',
                }
              : null;

          setAsset({
            id: found.asset.id,
            code: found.asset.assetCode,
            name: found.asset.name,
            status: found.asset.status,
            category: found.asset.category?.name || 'Chưa phân loại',
            serial: found.asset.serialNumber || '—',
            assignedAt: new Date(found.assignedAt).toLocaleDateString('vi-VN'),
            condition: found.notes || 'Tốt',
            imageUrl: found.asset.imageUrl || '',
            resolvedLocation: resolvedLoc,
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
        {/* Main Info with Map */}
        <div className="grid gap-5">
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
              <StatusBadge status={asset.status} />
            </div>

            {asset.imageUrl && (
              <div className="border-b border-slate-100 bg-slate-50/20 p-5 flex justify-center items-center overflow-hidden max-h-[240px]">
                <img
                  src={getFullImageUrl(asset.imageUrl)}
                  alt={asset.name}
                  className="max-h-[200px] rounded-xl object-contain shadow-soft"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://placehold.co/600x400?text=Loi+hien+thi+anh'
                  }}
                />
              </div>
            )}

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

          {/* Sơ đồ vị trí thiết bị */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Vị trí của thiết bị trên sơ đồ</h3>
            {asset.resolvedLocation ? (
              <div>
                <p className="text-xs text-slate-600 font-bold mb-3 flex items-center gap-1">
                  <span>📍</span> {asset.resolvedLocation.name} ({asset.resolvedLocation.type === 'ASSIGNED' ? 'Được định vị tại Bàn làm việc của bạn' : 'Vị trí cố định'})
                </p>
                <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-[300px]">
                  <div className="relative">
                    <img
                      src={asset.resolvedLocation.floorPlanUrl}
                      alt={asset.resolvedLocation.name}
                      className="max-w-full max-h-[300px] object-contain block"
                    />
                    <div
                      style={{ left: `${asset.resolvedLocation.x}%`, top: `${asset.resolvedLocation.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                    >
                      <span className="relative flex size-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-5 items-center justify-center bg-emerald-600 text-[10px] font-bold text-white shadow-md">
                          💻
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Thiết bị này chưa được cấu hình định vị trên sơ đồ văn phòng.</p>
            )}
          </section>
        </div>

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
          <>
            <div className="divide-y divide-slate-100">
              {history.slice(0, 5).map((item) => {
                const ticketCode = `REQ-${item.id.slice(0, 8).toUpperCase()}`
                const formattedCreated = new Date(item.createdAt).toLocaleDateString('vi-VN')
                const formattedCompleted = item.completedAt
                  ? new Date(item.completedAt).toLocaleDateString('vi-VN')
                  : '—'
                const assigneeName = item.assignee?.employee?.fullName || item.assignee?.email || 'Chưa phân công'

                return (
                  <Link
                    to={`/employee/requests?requestId=${item.id}`}
                    className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_110px_110px_100px] items-center hover:bg-slate-50/50 transition block"
                    key={item.id}
                  >
                    <div>
                      <strong className="text-xs font-bold text-brand-700">{ticketCode}</strong>
                      <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
                      {item.resolution && (
                        <p className="mt-1.5 text-[10px] italic text-slate-500 font-semibold bg-slate-50/80 p-1.5 rounded-lg border border-slate-100/80">
                          <span className="text-brand-700 font-bold">Khắc phục:</span> {item.resolution}
                        </p>
                      )}
                      <span className="mt-1.5 block text-[10px] text-slate-400 font-medium">
                        Phụ trách: {assigneeName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">{formattedCreated}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{formattedCompleted}</span>
                    <span className="w-fit">
                      <StatusBadge status={item.status} />
                    </span>
                  </Link>
                )
              })}
            </div>
            {history.length > 5 && (
              <div className="border-t border-slate-100 p-3 text-center bg-slate-50/50">
                <Link
                  to="/employee/requests"
                  className="text-xs font-bold text-brand-700 hover:text-brand-800 transition hover:underline"
                >
                  Xem tất cả {history.length} lần bảo trì
                </Link>
              </div>
            )}
          </>
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
