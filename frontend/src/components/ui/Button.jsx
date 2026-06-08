const variants = {
  primary:
    'border-brand-700 bg-brand-700 text-white shadow-[0_6px_16px_rgba(25,120,82,0.18)] hover:border-brand-800 hover:bg-brand-800 hover:shadow-[0_8px_20px_rgba(25,120,82,0.24)] focus-visible:ring-brand-500/25',
  secondary:
    'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-slate-400/20',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/20',
  danger:
    'border-red-600 bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/25',
}

const sizes = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
  icon: 'size-10 p-0',
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border font-semibold outline-none transition-all duration-200 hover:-translate-y-px focus-visible:ring-4 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
