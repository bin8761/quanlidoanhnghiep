const statusTone = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ASSIGNED: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-600',
  OK: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MISSING: 'border-red-200 bg-red-50 text-red-700',
  DAMAGED: 'border-amber-200 bg-amber-50 text-amber-700',
  BROKEN: 'border-red-200 bg-red-50 text-red-700',
  INACTIVE: 'border-red-200 bg-red-50 text-red-700',
  MAINTENANCE: 'border-amber-200 bg-amber-50 text-amber-700',
  RETURNED: 'border-slate-200 bg-slate-50 text-slate-600',
  TRANSFERRED: 'border-slate-200 bg-slate-50 text-slate-600',
  APPROVED: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  WAITING_USER: 'border-orange-200 bg-orange-50 text-orange-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const statusLabel = {
  AVAILABLE: 'Sẵn sàng',
  ACTIVE: 'Đang hoạt động',
  COMPLETED: 'Hoàn tất',
  ASSIGNED: 'Đã bàn giao',
  IN_PROGRESS: 'Đang xử lý',
  PENDING: 'Chờ xử lý',
  DRAFT: 'Bản nháp',
  CANCELLED: 'Đã hủy',
  OK: 'Bình thường',
  MISSING: 'Thiếu',
  DAMAGED: 'Hư hỏng',
  BROKEN: 'Bị hỏng',
  INACTIVE: 'Ngừng hoạt động',
  MAINTENANCE: 'Đang bảo trì',
  RETURNED: 'Đã thu hồi',
  TRANSFERRED: 'Đã chuyển giao',
  LOST: 'Thất lạc',
  DISPOSED: 'Đã thanh lý',
  APPROVED: 'Đã duyệt',
  WAITING_USER: 'Chờ bổ sung',
  REJECTED: 'Từ chối',
}

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toUpperCase()
  const tone = statusTone[normalizedStatus] || 'border-slate-200 bg-slate-50 text-slate-600'
  const label = statusLabel[normalizedStatus] || normalizedStatus.replaceAll('_', ' ')

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
