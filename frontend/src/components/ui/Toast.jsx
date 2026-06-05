import { CheckCircle2, CircleAlert, X } from 'lucide-react'

const variants = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-white text-emerald-700',
  },
  error: {
    icon: CircleAlert,
    className: 'border-red-200 bg-white text-red-700',
  },
}

export default function Toast({ message, type = 'success', onClose }) {
  const variant = variants[type] || variants.success
  const Icon = variant.icon

  return (
    <div
      className={`fixed right-4 bottom-4 z-[70] flex max-w-[calc(100vw-32px)] items-start gap-3 rounded-2xl border p-4 shadow-premium sm:right-6 sm:bottom-6 sm:w-[360px] ${variant.className}`}
      role="status"
    >
      <Icon className="mt-0.5 shrink-0" size={19} />
      <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{message}</span>
      <button
        className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        type="button"
        title="Đóng thông báo"
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </div>
  )
}
