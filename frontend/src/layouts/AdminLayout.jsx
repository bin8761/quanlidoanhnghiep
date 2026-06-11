import { useEffect, useMemo, useState } from 'react'
import { Menu, QrCode, Search } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import NotificationBell from '../components/layout/NotificationBell'
import Sidebar from '../components/layout/Sidebar'
import SyncStatusBadge from '../components/layout/SyncStatusBadge'
import ThemeToggle from '../components/layout/ThemeToggle'
import Modal from '../components/ui/Modal'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { connectionStatus } = useNotifications()
  const { t } = useLanguage()
  const title = t(PAGE_TITLES[location.pathname] || 'Quản trị tài sản')
  const destinations = useMemo(
    () => Object.entries(PAGE_TITLES).map(([path, label]) => ({ path, label: t(label) })),
    [t],
  )
  const filteredDestinations = destinations.filter((item) =>
    item.label.toLowerCase().includes(keyword.trim().toLowerCase()),
  )

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  function openDestination(path) {
    setSearchOpen(false)
    setKeyword('')
    navigate(path)
  }

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
              <p className="hidden text-[10px] font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500 sm:block">
                EAM Workspace
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 dark:text-slate-100 sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="hidden min-h-10 w-64 items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3 text-left text-xs text-slate-400 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 md:flex"
              type="button"
              title={t('Tìm kiếm')}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              {t('Tìm kiếm nhanh...')}
              <span className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px]">
                Ctrl K
              </span>
            </button>
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

      {searchOpen && (
        <Modal
          title={t('Đi tới chức năng')}
          description={t('Tìm nhanh một khu vực trong không gian quản trị.')}
          onClose={() => {
            setSearchOpen(false)
            setKeyword('')
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-11 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
              autoFocus
              type="search"
              value={keyword}
              placeholder={t('Nhập tên chức năng...')}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
          <div className="mt-4 grid max-h-80 gap-1 overflow-y-auto">
            {filteredDestinations.map((item) => (
              <button
                className="flex min-h-11 items-center justify-between rounded-xl px-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-800"
                key={item.path}
                type="button"
                onClick={() => openDestination(item.path)}
              >
                {item.label}
                <span className="text-xs font-normal text-slate-400">
                  {item.path.replace('/admin/', '')}
                </span>
              </button>
            ))}
            {!filteredDestinations.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                {t('Không tìm thấy chức năng phù hợp.')}
              </p>
            )}
          </div>
        </Modal>
      )}
      {qrOpen && <QrScannerModal onClose={() => setQrOpen(false)} />}
    </div>
  )
}
