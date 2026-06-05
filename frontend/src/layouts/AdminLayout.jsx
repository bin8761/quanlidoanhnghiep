import { useState } from 'react'
import { Bell, Menu, Search } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { managementPages } from '../pages/admin/managementData'

const PAGE_TITLES = {
  '/admin/dashboard': 'Tổng quan',
  ...Object.fromEntries(
    Object.entries(managementPages).map(([path, page]) => [`/admin/${path}`, page.title]),
  ),
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Quản trị tài sản'

  return (
    <div className="min-h-screen bg-[#f3f7f5] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 border-0 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
              type="button"
              title="Mở menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-semibold text-slate-400 sm:block">
                EAM Workspace
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hidden min-h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-400 transition hover:border-slate-300 hover:bg-white md:flex"
              type="button"
              title="Tìm kiếm"
            >
              <Search size={15} />
              Tìm kiếm nhanh...
              <span className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">
                Ctrl K
              </span>
            </button>
            <span className="hidden items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Hệ thống hoạt động
            </span>
            <button
              className="relative grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              type="button"
              title="Thông báo"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-red-500" />
            </button>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
