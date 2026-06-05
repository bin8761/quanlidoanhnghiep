const variants = {
  primary:
    'border-brand-600 bg-brand-600 text-white shadow-sm hover:border-brand-700 hover:bg-brand-700 hover:shadow-md focus-visible:ring-brand-500/25',
  secondary:
    'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400/20',
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
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border font-semibold outline-none transition-all duration-200 focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
