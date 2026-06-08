import { ArrowRightLeft, CalendarDays, Clock, Wrench } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../../components/ui/PageHeader'

// Demo data — Week 3: replace with GET /api/assignments/history and GET /api/maintenance-requests
const allocationHistory = [
  {
    id: 1,
    assetCode: 'LT-0248',
    assetName: 'Dell Latitude 5440',
    type: 'Bàn giao',
    date: '04/06/2026',
    note: 'Bàn giao thiết bị cho nhân viên mới',
    status: 'ACTIVE',
  },
  {
    id: 2,
    assetCode: 'MN-0131',
    assetName: 'Dell P2422H',
    type: 'Bàn giao',
    date: '04/06/2026',
    note: '',
    status: 'ACTIVE',
  },
  {
    id: 3,
    assetCode: 'LT-0101',
    assetName: 'HP EliteBook 840 G8',
    type: 'Thu hồi',
    date: '01/08/2025',
    note: 'Thu hồi do chuyển phòng ban',
    status: 'RETURNED',
  },
  {
    id: 4,
    assetCode: 'KB-0084',
    assetName: 'Logitech K380',
    type: 'Bàn giao',
    date: '12/01/2026',
    note: '',
    status: 'ACTIVE',
  },
]

const maintenanceHistory = [
  {
    id: 1,
    code: 'MR-1029',
    assetCode: 'LT-0248',
    assetName: 'Dell Latitude 5440',
    issue: 'Pin sạc chậm và nhanh hết',
    status: 'IN_PROGRESS',
    createdAt: '03/06/2026',
    resolvedAt: null,
  },
  {
    id: 2,
    code: 'MR-0987',
    assetCode: 'MN-0131',
    assetName: 'Dell P2422H',
    issue: 'Màn hình chớp trong vài giây khi khởi động',
    status: 'COMPLETED',
    createdAt: '18/05/2026',
    resolvedAt: '25/05/2026',
  },
  {
    id: 3,
    code: 'MR-0812',
    assetCode: 'LT-0248',
    assetName: 'Dell Latitude 5440',
    issue: 'Quạt tản nhiệt kêu to khi chạy nặng',
    status: 'COMPLETED',
    createdAt: '10/03/2026',
    resolvedAt: '18/03/2026',
  },
]

const allocationStatusTone = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  RETURNED: 'border-slate-200 bg-slate-50 text-slate-600',
  TRANSFERRED: 'border-blue-200 bg-blue-50 text-blue-700',
}

const maintenanceStatusTone = {
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
}

const maintenanceStatusLabel = {
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  PENDING: 'Chờ tiếp nhận',
  CANCELLED: 'Đã hủy',
}

const tabs = [
  { key: 'allocation', label: 'Lịch sử bàn giao', icon: ArrowRightLeft },
  { key: 'maintenance', label: 'Lịch sử bảo trì', icon: Wrench },
]

export default function EmployeeHistoryPage() {
  const [activeTab, setActiveTab] = useState('allocation')

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Nhật ký cá nhân"
        title="Lịch sử hoạt động"
        description="Toàn bộ lịch sử bàn giao tài sản và yêu cầu bảo trì của bạn."
      />

      <div className="mb-5 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      {activeTab === 'allocation' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <div className="hidden grid-cols-[120px_minmax(180px,1fr)_100px_110px_minmax(120px,1fr)_100px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid sm:px-6">
            <span>Mã tài sản</span>
            <span>Tên tài sản</span>
            <span>Loại</span>
            <span>Ngày</span>
            <span>Ghi chú</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y divide-slate-100">
            {allocationHistory.map((item) => (
              <article
                key={item.id}
                className="grid gap-2 px-5 py-4 sm:px-6 md:grid-cols-[120px_minmax(180px,1fr)_100px_110px_minmax(120px,1fr)_100px] md:items-center md:gap-4"
              >
                <strong className="text-xs font-bold text-brand-700">{item.assetCode}</strong>
                <span className="text-xs font-semibold text-slate-700">{item.assetName}</span>
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <ArrowRightLeft size={13} className="text-slate-400" />
                  {item.type}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <CalendarDays size={13} />
                  {item.date}
                </span>
                <span className="text-xs text-slate-500 italic">
                  {item.note || '—'}
                </span>
                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    allocationStatusTone[item.status] || 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {item.status === 'ACTIVE' ? 'Đang giữ' : item.status === 'RETURNED' ? 'Đã thu hồi' : 'Chuyển giao'}
                </span>
              </article>
            ))}
          </div>
          {!allocationHistory.length && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <Clock className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm text-slate-500">Chưa có lịch sử bàn giao.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'maintenance' && (
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
          <div className="hidden grid-cols-[100px_120px_minmax(200px,1fr)_110px_110px_110px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-extrabold text-slate-500 uppercase md:grid sm:px-6">
            <span>Mã YC</span>
            <span>Tài sản</span>
            <span>Sự cố</span>
            <span>Ngày tạo</span>
            <span>Ngày xong</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y divide-slate-100">
            {maintenanceHistory.map((item) => (
              <article
                key={item.id}
                className="grid gap-2 px-5 py-4 sm:px-6 md:grid-cols-[100px_120px_minmax(200px,1fr)_110px_110px_110px] md:items-center md:gap-4"
              >
                <strong className="text-xs font-bold text-brand-700">{item.code}</strong>
                <span className="text-xs font-semibold text-slate-700">{item.assetCode}</span>
                <span className="text-xs text-slate-600">{item.issue}</span>
                <span className="text-[11px] text-slate-500">{item.createdAt}</span>
                <span className="text-[11px] text-slate-500">{item.resolvedAt || '—'}</span>
                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                    maintenanceStatusTone[item.status] || 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {maintenanceStatusLabel[item.status] || item.status}
                </span>
              </article>
            ))}
          </div>
          {!maintenanceHistory.length && (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <Wrench className="mx-auto text-slate-300" size={30} />
                <p className="mt-3 text-sm text-slate-500">Chưa có yêu cầu bảo trì nào.</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
