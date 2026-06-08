export default function FormField({
  label,
  name,
  error,
  hint,
  children,
  as = 'input',
  options = [],
  ...props
}) {
  const controlClassName = [
    'min-h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3.5 py-2.5',
    'text-sm text-slate-900 shadow-sm outline-none transition-all duration-200',
    'placeholder:text-slate-400 hover:border-slate-300',
    'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
    as === 'textarea' ? 'min-h-28 resize-y' : '',
    props.className || '',
  ]
    .filter(Boolean)
    .join(' ')
  const controlProps = { ...props, className: controlClassName }

  function renderControl() {
    if (children) {
      return children
    }

    if (as === 'select') {
      return (
        <select id={name} name={name} {...controlProps}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (as === 'textarea') {
      return <textarea id={name} name={name} {...controlProps} />
    }

    return <input id={name} name={name} {...controlProps} />
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-slate-700" htmlFor={name}>
          {label}
        </label>
        {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
      </div>
      {renderControl()}
      {error && <span className="text-xs font-medium text-red-600" role="alert">{error}</span>}
    </div>
  )
}
