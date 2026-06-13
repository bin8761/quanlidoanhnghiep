import {
  Boxes,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  ClipboardCheck,
  FolderTree,
  Gauge,
  HelpCircle,
  Map,
  MessageSquare,
  MessageSquareMore,
  PackageCheck,
  Search,
  Settings,
  ShieldAlert,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'

const SEARCH_ITEMS = [
  { to: '/admin/dashboard', label: 'Tổng quan', keywords: 'dashboard thống kê trang chủ', icon: Gauge },
  { to: '/admin/assets', label: 'Tài sản', keywords: 'thiết bị asset quản lý', icon: Boxes },
  { to: '/admin/categories', label: 'Danh mục', keywords: 'loại tài sản category', icon: FolderTree },
  { to: '/admin/employees', label: 'Nhân viên', keywords: 'người dùng tài khoản employee', icon: UsersRound },
  { to: '/admin/departments', label: 'Phòng ban', keywords: 'đơn vị department', icon: Building2 },
  { to: '/admin/assignments', label: 'Bàn giao', keywords: 'thu hồi chuyển tài sản assignment', icon: PackageCheck },
  { to: '/admin/maintenance', label: 'Bảo trì', keywords: 'sửa chữa báo hỏng maintenance', icon: Wrench },
  { to: '/admin/inventory', label: 'Kiểm kê', keywords: 'inventory phiên kiểm kê', icon: ClipboardCheck },
  { to: '/admin/reports', label: 'Báo cáo', keywords: 'report thống kê xuất dữ liệu', icon: ChartNoAxesCombined },
  { to: '/admin/locations', label: 'Sơ đồ mặt bằng', keywords: 'bản đồ vị trí location', icon: Map },
  { to: '/admin/support-chat', label: 'Hỗ trợ trực tuyến', keywords: 'chat tư vấn nhân viên', icon: MessageSquareMore },
  { to: '/admin/faq-management', label: 'Quản lý FAQ', keywords: 'câu hỏi thường gặp cẩm nang', icon: HelpCircle },
  { to: '/admin/feedbacks', label: 'Góp ý & Phản hồi', keywords: 'feedback suggestion', icon: MessageSquare },
  { to: '/admin/attendance', label: 'Lịch sử chấm công', keywords: 'check in check out attendance', icon: CalendarCheck },
  { to: '/admin/login-histories', label: 'Lịch sử đăng nhập', keywords: 'login bảo mật truy cập', icon: ShieldAlert },
  { to: '/admin/settings', label: 'Cài đặt', keywords: 'settings hệ thống giao diện', icon: Settings },
]

export default function AdminGlobalSearch() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const desktopInputRef = useRef(null)
  const mobileInputRef = useRef(null)

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')
    if (!normalizedQuery) return SEARCH_ITEMS

    return SEARCH_ITEMS.filter((item) =>
      `${item.label} ${t(item.label)} ${item.keywords}`
        .toLocaleLowerCase('vi')
        .includes(normalizedQuery),
    )
  }, [query, t])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }

    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        window.setTimeout(() => desktopInputRef.current?.focus() || mobileInputRef.current?.focus(), 0)
      }
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleShortcut)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleShortcut)
    }
  }, [])

  function selectItem(path) {
    navigate(path)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && results.length) {
      event.preventDefault()
      selectItem(results[0].to)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="icon-button md:hidden"
        type="button"
        aria-label={t('Tìm kiếm')}
        title={t('Tìm kiếm')}
        onClick={() => {
          setOpen(true)
          window.setTimeout(() => mobileInputRef.current?.focus(), 0)
        }}
      >
        <Search size={18} />
      </button>

      <div className="relative hidden md:block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          size={15}
        />
        <input
          ref={desktopInputRef}
          className="h-10 w-[clamp(190px,20vw,300px)] rounded-xl border border-slate-200 bg-slate-50/80 pr-14 pl-9 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:focus:border-emerald-500"
          type="search"
          aria-label={t('Tìm kiếm toàn cục')}
          placeholder={t('Tìm kiếm trang và chức năng...')}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          Ctrl K
        </kbd>
      </div>

      {open && (
        <div className="fixed top-[74px] right-4 left-4 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-premium dark:border-slate-700 dark:bg-[#14201b] md:absolute md:top-[calc(100%+10px)] md:right-0 md:left-auto md:w-[min(360px,calc(100vw-32px))]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-2 pb-2 md:hidden dark:border-slate-700">
            <Search className="text-slate-400" size={15} />
            <input
              ref={mobileInputRef}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              type="search"
              aria-label={t('Tìm kiếm toàn cục trên thiết bị di động')}
              placeholder={t('Tìm kiếm trang và chức năng...')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {results.length ? results.map(({ to, label, icon: Icon }) => (
              <button
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-white/6 dark:focus:bg-white/6"
                key={to}
                type="button"
                onClick={() => selectItem(to)}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Icon size={15} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-xs text-slate-800 dark:text-slate-100">
                    {t(label)}
                  </strong>
                </span>
              </button>
            )) : (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto text-slate-300 dark:text-slate-600" size={24} />
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('Không tìm thấy trang phù hợp.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
