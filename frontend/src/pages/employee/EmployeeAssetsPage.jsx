import { Boxes, CalendarDays, Hash, Laptop, Search, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { employeeAssets } from './employeeData'

export default function EmployeeAssetsPage() {
  const [query, setQuery] = useState('')
  const filteredAssets = useMemo(
    () =>
      employeeAssets.filter((asset) =>
        `${asset.code} ${asset.name} ${asset.category}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <div className="animate-fade-up">
      <header className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-950">Tài sản của tôi</h2>
        <p className="mt-2 text-sm text-slate-500">
          Danh sách thiết bị và tài sản hiện đang được bàn giao cho bạn.
        </p>
      </header>

      <div className="mb-5 flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm sm:max-w-md">
        <Search className="text-slate-400" size={17} />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder="Tìm theo mã hoặc tên tài sản..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {filteredAssets.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <article
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
              key={asset.id}
            >
              <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/70 p-5">
                <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Laptop size={22} />
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700">
                  {asset.status}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-base font-extrabold text-slate-900">{asset.name}</h3>
                <p className="mt-1 text-xs font-semibold text-brand-700">{asset.code}</p>
                <dl className="mt-5 grid gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Tag size={15} /> <dt className="sr-only">Danh mục</dt><dd>{asset.category}</dd>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <Hash size={15} /> <dt className="sr-only">Serial</dt><dd>{asset.serial}</dd>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <CalendarDays size={15} /> <dt className="sr-only">Ngày nhận</dt><dd>Nhận ngày {asset.assignedAt}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
          <div>
            <Boxes className="mx-auto text-slate-300" size={34} />
            <h3 className="mt-3 text-sm font-bold text-slate-700">Không tìm thấy tài sản</h3>
            <p className="mt-1 text-xs text-slate-500">Thử tìm kiếm bằng từ khóa khác.</p>
          </div>
        </div>
      )}
    </div>
  )
}
