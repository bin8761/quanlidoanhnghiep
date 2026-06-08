import { Bell, Menu, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import EmployeeSidebar from '../components/layout/EmployeeSidebar'
import QrScannerModal from '../components/ui/QrScannerModal'

const PAGE_TITLES = {
  '/employee/dashboard': 'Tổng quan',
  '/employee/assets': 'Tài sản của tôi',
  '/employee/requests': 'Yêu cầu hỗ trợ',
  '/employee/history': 'Lịch sử hoạt động',
  '/employee/profile': 'Hồ sơ cá nhân',
  '/employee/change-password': 'Đổi mật khẩu',
}
export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-shell lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <EmployeeSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 border-0 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="icon-button lg:hidden"
              type="button"
              aria-label="Mở menu"
              title="Mở menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold tracking-wide text-slate-400 uppercase sm:block">
                Cổng thông tin nhân viên
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {PAGE_TITLES[location.pathname] || 'EAM Workspace'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Đã đồng bộ
            </span>
            <button
              className="icon-button relative"
              type="button"
              title="Thông báo"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-amber-500" />
            </button>
            <button
              className="icon-button"
              type="button"
              title="Quét mã QR"
              onClick={() => setQrOpen(true)}
            >
              <QrCode size={18} />
            </button>
          </div>
        </header>

        <div className="page-container max-w-[1440px]">
          <Outlet />
        </div>
      </main>
      {qrOpen && <QrScannerModal onClose={() => setQrOpen(false)} />}
    </div>
  )
}
