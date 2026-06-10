import { Menu, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import EmployeeSidebar from '../components/layout/EmployeeSidebar'
import NotificationBell from '../components/layout/NotificationBell'
import SyncStatusBadge from '../components/layout/SyncStatusBadge'
import QrScannerModal from '../components/ui/QrScannerModal'
import { useNotifications } from '../notifications/notifications-context'

const PAGE_TITLES = {
  '/employee/dashboard': 'Tổng quan',
  '/employee/assets': 'Tài sản của tôi',
  '/employee/requests': 'Yêu cầu hỗ trợ',
  '/employee/history': 'Lịch sử hoạt động',
  '/employee/profile': 'Hồ sơ cá nhân',
  '/employee/change-password': 'Đổi mật khẩu',
  '/employee/settings': 'Cài đặt',
}

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const location = useLocation()
  const { connectionStatus } = useNotifications()

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
            <SyncStatusBadge status={connectionStatus} />
            <NotificationBell />
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
