import { useState } from 'react'
import { Menu, QrCode } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import AdminGlobalSearch from '../components/layout/AdminGlobalSearch'
import NotificationBell from '../components/layout/NotificationBell'
import Sidebar from '../components/layout/Sidebar'
import SyncStatusBadge from '../components/layout/SyncStatusBadge'
import ThemeToggle from '../components/layout/ThemeToggle'
import QrScannerModal from '../components/ui/QrScannerModal'
import { useNotifications } from '../notifications/notifications-context'
import { managementPages } from '../pages/admin/managementData'
import { useLanguage } from '../hooks/useLanguage'

const PAGE_TITLES = {
  '/admin/dashboard': 'Tổng quan',
  '/admin/support-chat': 'Hỗ trợ trực tuyến',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/faq-management': 'Quản lý FAQ',
  '/admin/feedbacks': 'Góp ý & Phản hồi',
  '/admin/attendance': 'Lịch sử chấm công',
  '/admin/login-histories': 'Lịch sử đăng nhập',
  ...Object.fromEntries(
    Object.entries(managementPages).map(([path, page]) => [`/admin/${path}`, page.title]),
  ),
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const location = useLocation()
  const { connectionStatus } = useNotifications()
  const { t } = useLanguage()
  const title = t(PAGE_TITLES[location.pathname] || 'Quản trị tài sản')

  return (
    <div className="app-shell lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 border-0 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          type="button"
          aria-label={t('Đóng menu')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/88 px-4 backdrop-blur-xl transition-colors dark:border-slate-700/70 dark:bg-[#111d18]/92 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="icon-button lg:hidden"
              type="button"
              aria-label={t('Mở menu')}
              title={t('Mở menu')}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <img
                className="hidden h-4 w-auto max-w-[140px] object-contain sm:block"
                src="/brand/eam-logo-wordmark.png"
                alt="EAM Workspace"
              />
              <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminGlobalSearch />
            <SyncStatusBadge status={connectionStatus} systemLabel="Hệ thống hoạt động" />
            <ThemeToggle />
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

        <div className="page-container">
          <Outlet />
        </div>
      </main>

      {qrOpen && <QrScannerModal onClose={() => setQrOpen(false)} />}
    </div>
  )
}
