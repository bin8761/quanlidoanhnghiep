import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'

/**
 * SearchableSelect — autocomplete dropdown từ danh sách tĩnh
 * Props:
 *   options: [{ value, label }]
 *   value: string (current value)
 *   onChange: (newValue: string) => void
 *   label: string
 *   placeholder: string
 *   disabled: boolean
 */
export default function SearchableSelect({
  options = [],
  value = '',
  onChange,
  label,
  placeholder = 'Chọn hoặc tìm kiếm...',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selectedOption = options.find(o => o.value === value)

  const filtered = query.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase())
      )
    : options

  function handleSelect(opt) {
    onChange(opt.value)
    setIsOpen(false)
    setQuery('')
  }

  function handleOpen() {
    if (disabled) return
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="grid gap-1.5" ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={[
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-slate-200 bg-white px-3.5 py-2 text-left text-sm shadow-sm transition-all duration-200',
          'hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12 dark:border-slate-700 dark:bg-slate-900/55 dark:hover:border-slate-600 dark:focus:border-emerald-500',
          disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 italic text-xs'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute left-0 right-0 top-1 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#14201b]">
            {/* Search box */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700">
              <Search size={13} className="shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Tìm kiếm..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            {/* Options list */}
            <ul className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-slate-400 italic">Không tìm thấy kết quả</li>
              ) : (
                filtered.map(opt => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-white/6 ${
                        opt.value === value
                          ? 'bg-brand-50 font-bold text-brand-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <Check
                        size={12}
                        className={`shrink-0 ${opt.value === value ? 'text-brand-600 opacity-100' : 'opacity-0'}`}
                      />
                      {opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
