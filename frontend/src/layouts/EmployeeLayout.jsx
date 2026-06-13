import { KeyRound, Menu, QrCode } from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import EmployeeSidebar from '../components/layout/EmployeeSidebar'
import NotificationBell from '../components/layout/NotificationBell'
import SyncStatusBadge from '../components/layout/SyncStatusBadge'
import ThemeToggle from '../components/layout/ThemeToggle'
import QrScannerModal from '../components/ui/QrScannerModal'
import SupportChatbox from '../components/chat/SupportChatbox'
import { useNotifications } from '../notifications/notifications-context'
import { useLanguage } from '../hooks/useLanguage'

const PAGE_TITLES = {
  '/employee/dashboard': 'Tổng quan',
  '/employee/assets': 'Tài sản của tôi',
  '/employee/requests': 'Yêu cầu hỗ trợ',
  '/employee/faq': 'Cẩm nang tự phục vụ',
  '/employee/history': 'Lịch sử hoạt động',
  '/employee/profile': 'Hồ sơ cá nhân',
  '/employee/change-password': 'Đổi mật khẩu',
  '/employee/settings': 'Cài đặt',
}

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const { connectionStatus } = useNotifications()
  const { t } = useLanguage()

  return (
    <div className="app-shell lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <EmployeeSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
              <p className="hidden text-[10px] font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500 sm:block">
                {t('Cổng thông tin nhân viên')}
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">
                {t(PAGE_TITLES[location.pathname] || 'EAM Workspace')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatusBadge status={connectionStatus} />
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

        <div className="page-container max-w-[1440px]">
          {user?.mustChangePassword && location.pathname !== '/employee/change-password' && (
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" size={18} />
                <div>
                  <p className="text-sm font-bold">{t('Bạn đang sử dụng mật khẩu tạm thời')}</p>
                  <p className="mt-0.5 text-xs leading-5 text-amber-800 dark:text-amber-200/80">
                    {t('Hãy đổi mật khẩu để tăng tính bảo mật cho tài khoản của bạn.')}
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3.5 text-xs font-bold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-500/20 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
                to="/employee/change-password"
              >
                {t('Đổi mật khẩu')}
              </Link>
            </div>
          )}
          <Outlet />
        </div>
      </main>
      {qrOpen && <QrScannerModal onClose={() => setQrOpen(false)} />}
      <SupportChatbox />
    </div>
  )
}
