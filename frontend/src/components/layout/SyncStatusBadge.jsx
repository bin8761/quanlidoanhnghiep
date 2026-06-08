import { CheckCircle2, CloudOff, Loader2 } from 'lucide-react'

const STATUS_CONFIG = {
  connected: {
    label: 'Đã đồng bộ',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  connecting: {
    label: 'Đang đồng bộ',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
    dotClassName: 'bg-sky-500',
    icon: Loader2,
    spin: true,
  },
  disconnected: {
    label: 'Mất kết nối',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
    icon: CloudOff,
  },
  idle: {
    label: 'Đã đồng bộ',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    icon: CheckCircle2,
  },
}

export default function SyncStatusBadge({ status = 'idle', systemLabel = 'Đã đồng bộ' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const Icon = config.icon

  return (
    <span
      className={`hidden h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-bold sm:inline-flex ${config.className}`}
      title={config.label}
    >
      <span className={`size-1.5 rounded-full ${config.dotClassName}`} />
      <Icon size={13} className={config.spin ? 'animate-spin-soft' : undefined} />
      {status === 'idle' ? systemLabel : config.label}
    </span>
  )
}
