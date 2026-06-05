const statusTone = {
  AVAILABLE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ASSIGNED: 'border-blue-200 bg-blue-50 text-blue-700',
  IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  DRAFT: 'border-amber-200 bg-amber-50 text-amber-700',
  BROKEN: 'border-red-200 bg-red-50 text-red-700',
  INACTIVE: 'border-red-200 bg-red-50 text-red-700',
  MAINTENANCE: 'border-amber-200 bg-amber-50 text-amber-700',
  RETURNED: 'border-slate-200 bg-slate-50 text-slate-600',
  TRANSFERRED: 'border-slate-200 bg-slate-50 text-slate-600',
}

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toUpperCase()
  const tone = statusTone[normalizedStatus] || 'border-slate-200 bg-slate-50 text-slate-600'
  const label = normalizedStatus.replaceAll('_', ' ')

  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}
