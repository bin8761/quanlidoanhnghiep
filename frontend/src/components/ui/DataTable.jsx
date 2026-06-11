import { Database, Search, SlidersHorizontal } from 'lucide-react'
import Button from './Button'

export default function DataTable({
  columns,
  rows,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm...',
  actions,
  onFilterClick,
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-[390px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            className="h-11 w-full rounded-[10px] border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/12 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-800/70 dark:focus:border-emerald-500 dark:focus:bg-slate-900/60"
            type="search"
            aria-label={searchPlaceholder}
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {onFilterClick && (
            <Button variant="secondary" size="md" type="button" onClick={onFilterClick}>
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Bộ lọc</span>
            </Button>
          )}
          {actions}
        </div>
      </div>

      <div className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    className="border-b border-slate-200 bg-slate-50/90 px-5 py-3 text-[10px] font-extrabold tracking-[0.08em] text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-400"
                    key={column.key}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="group border-b border-slate-100 transition-colors last:border-b-0 hover:bg-brand-50/55 dark:border-slate-800 dark:hover:bg-emerald-400/5"
                  key={row.id}
                >
                  {columns.map((column, index) => (
                    <td
                      className={`px-5 py-3.5 text-[13px] text-slate-600 dark:text-slate-300 ${
                        index === 0 ? 'font-semibold text-slate-900 dark:text-slate-100' : ''
                      }`}
                      key={column.key}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid min-h-64 place-items-center px-5 py-12 text-center">
            <div>
              <span className="mx-auto mb-4 grid size-12 place-items-center rounded-[14px] border border-slate-200 bg-slate-50 text-slate-400">
                <Database size={24} />
              </span>
              <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                Không tìm thấy dữ liệu
              </strong>
              <span className="mt-1.5 block text-xs text-slate-500">
                Thử thay đổi từ khóa hoặc điều kiện lọc.
              </span>
            </div>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50/45 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400">
          <span>Hiển thị {rows.length} kết quả</span>
          <span className="hidden sm:inline">Dữ liệu được cập nhật gần đây</span>
        </footer>
      )}
    </section>
  )
}
