import {
  ArrowLeft,
  CalendarDays,
  Hash,
  Laptop,
  Tag,
  Wrench,
  FileText,
  AlertTriangle,
  Pencil,
  UploadCloud,
} from 'lucide-react'
import { Link, useParams, Navigate } from 'react-router-dom'
import StatusBadge from '../../components/ui/StatusBadge'
import { useEffect, useState } from 'react'
import { getMaintenanceByAsset, getMyAssets, confirmAssignment } from '../../services/employee.service'
import { API_BASE_URL } from '../../api/client'
import SignaturePad from '../../components/ui/SignaturePad'
import Modal from '../../components/ui/Modal'

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
  const [signature, setSignature] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [signatureType, setSignatureType] = useState('draw')

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Kích thước file không được vượt quá 2MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setSignature(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTabChange = (type) => {
    setSignatureType(type)
    setSignature(null)
  }

  const handleConfirm = async () => {
    if (!signature) return
    setIsSubmitting(true)
    try {
      await confirmAssignment({
        assignmentId: asset.assignmentId,
        signatureUrl: signature,
        notes: notes || undefined
      })
      setReloadTrigger(c => c + 1)
    } catch (err) {
      console.error("Xác nhận bàn giao thất bại:", err)
      alert(err.message || "Xác nhận bàn giao thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            : (found.confirmedAt && emp?.locationId && emp?.deskX !== null)
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
            assignmentId: found.id,
            code: found.asset.assetCode,
            name: found.asset.name,
            status: found.asset.status,
            category: found.asset.category?.name || 'Chưa phân loại',
            serial: found.asset.serialNumber || '—',
            assignedAt: new Date(found.assignedAt).toLocaleDateString('vi-VN'),
            condition: found.notes || 'Tốt',
            imageUrl: found.asset.imageUrl || '',
            resolvedLocation: resolvedLoc,
            confirmedAt: found.confirmedAt,
            signatureUrl: found.signatureUrl,
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
  }, [code, reloadTrigger])

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
          {/* Ký nhận bàn giao tài sản */}
          {!asset.confirmedAt ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-soft sm:p-6 backdrop-blur-sm dark:border-amber-500/35 dark:bg-amber-500/10">
              <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                Ký nhận bàn giao
              </h3>
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                Thiết bị này được bàn giao cho bạn nhưng chưa được ký nhận. Vui lòng kiểm tra kỹ hiện trạng và ký tên xác nhận dưới đây.
              </p>
              
              <div className="mt-4 space-y-4">
                {/* Tab Selector */}
                <div className="flex border-b border-slate-200/80 dark:border-slate-800 mb-3">
                  <button
                    type="button"
                    onClick={() => handleTabChange('draw')}
                    className={`flex-1 pb-2 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${signatureType === 'draw' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <Pencil size={13} />
                    Vẽ chữ ký
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('upload')}
                    className={`flex-1 pb-2 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${signatureType === 'upload' ? 'border-brand-600 text-brand-700 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                  >
                    <UploadCloud size={13} />
                    Tải ảnh chữ ký
                  </button>
                </div>

                {signatureType === 'draw' ? (
                  <SignaturePad onChange={setSignature} disabled={isSubmitting} />
                ) : (
                  <div className="relative flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 p-4 h-[180px] hover:border-slate-300 transition cursor-pointer">
                    {signature ? (
                      <div className="relative group size-full flex items-center justify-center">
                        <img src={signature} alt="Ảnh chữ ký đã tải" className="max-h-full max-w-full object-contain" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSignature(null);
                          }}
                          className="absolute top-2 right-2 rounded-full bg-red-50 text-red-600 p-1.5 text-xs font-bold hover:bg-red-100 transition shadow"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer size-full">
                        <UploadCloud size={30} className="text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Click để chọn ảnh chữ ký</span>
                        <span className="text-[10px] text-slate-400 mt-1">Hỗ trợ PNG, JPG, JPEG. Tối đa 2MB.</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          disabled={isSubmitting}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Ghi chú khi nhận (tùy chọn)</label>
                  <textarea
                    className="w-full text-xs p-2.5 border rounded-lg border-slate-200 bg-white outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 transition"
                    placeholder="Ví dụ: Máy hoạt động bình thường, màn hình đẹp..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!signature || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 border border-transparent transition shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận & Ký biên bản'}
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-soft sm:p-6 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <h3 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                ✅ Đã xác nhận bàn giao
              </h3>
              <p className="mt-1.5 text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed font-semibold">
                Xác nhận lúc: {new Date(asset.confirmedAt).toLocaleString('vi-VN')}
              </p>
              {asset.signatureUrl && (
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chữ ký xác nhận</span>
                  <div 
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="cursor-pointer border border-slate-100 rounded-xl bg-white p-2 flex items-center justify-center h-20 hover:border-slate-200 transition dark:border-slate-800 dark:bg-slate-950"
                    title="Click để phóng to chữ ký"
                  >
                    <img src={asset.signatureUrl} alt="Chữ ký xác nhận" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-6 dark:border-slate-700/80 dark:bg-[#15241f]">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Thao tác nhanh</h3>
            <div className="mt-4 grid gap-2">
              <Link
                to="/employee/requests"
                className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
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

      {isSignatureModalOpen && asset.signatureUrl && (
        <Modal 
          title="Chữ ký xác nhận bàn giao" 
          onClose={() => setIsSignatureModalOpen(false)}
        >
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-100 dark:bg-slate-950 dark:border-slate-800">
            <img src={asset.signatureUrl} alt="Chữ ký phóng to" className="max-h-60 object-contain" />
            <p className="mt-4 text-xs font-semibold text-slate-500">
              Được ký bởi bạn vào ngày {new Date(asset.confirmedAt).toLocaleDateString('vi-VN')} lúc {new Date(asset.confirmedAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
