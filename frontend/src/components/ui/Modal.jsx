import { X } from 'lucide-react'

const sizes = {
  md: 'max-w-[560px]',
  lg: 'max-w-[820px]',
}

export default function Modal({ title, description, children, onClose, size = 'md' }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className={`animate-fade-up max-h-[calc(100vh-32px)] w-full overflow-auto rounded-3xl border border-white/50 bg-white shadow-premium ${sizes[size] || sizes.md}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <h3 className="m-0 text-lg font-extrabold text-slate-950">{title}</h3>
            {description && (
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            )}
          </div>
          <button
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            type="button"
            title="Đóng"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  )
}
