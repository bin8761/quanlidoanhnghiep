import { Boxes, CalendarDays, Hash, Laptop, Search, Tag } from 'lucide-react'
import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/ui/PageHeader'
import { getMyAssets } from '../../services/employee.service'

export default function EmployeeAssetsPage() {
  const [query, setQuery] = useState('')
  const [assets, setAssets] = useState([])

  useEffect(() => {
    getMyAssets()
      .then(setAssets)
      .catch(() => setAssets([]))
  }, [])

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) =>
        `${asset.assetCode} ${asset.name} ${asset.category?.name || ''}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [assets, query],
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Thiết bị được bàn giao"
        title="Tài sản của tôi"
        description="Danh sách thiết bị và tài sản hiện đang được bàn giao cho bạn."
      />

      <div className="surface mb-5 flex min-h-11 items-center gap-3 px-4 sm:max-w-md">
        <Search className="text-slate-400" size={17} />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          aria-label="Tìm tài sản"
          placeholder="Tìm theo mã hoặc tên tài sản..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filteredAssets.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <Link
              key={asset.code}
              to={`/employee/assets/${asset.code}`}
              className="metric-card block overflow-hidden"
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
                    <Tag size={15} />
                    <dd>{asset.category}</dd>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    <Hash size={15} />
                    <dd>{asset.serial}</dd>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    <CalendarDays size={15} />
                    <dd>Nhận ngày {asset.assignedAt}</dd>
                  </div>
                </dl>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="surface grid min-h-64 place-items-center border-dashed text-center">
          <div>
            <Boxes className="mx-auto text-slate-300" size={34} />

            <h3 className="mt-3 text-sm font-bold text-slate-700">
              Không tìm thấy tài sản
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Thử tìm kiếm bằng từ khóa khác.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
