import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  FolderTree,
  Gauge,
  LogOut,
  Map,
  PackageCheck,
  ShieldCheck,
  UsersRound,
  Wrench,
  X,
  HelpCircle,
  MessageSquare,
  CalendarCheck,
  ShieldAlert,
  Settings,
  MessageSquareMore,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { useLanguage } from '../../hooks/useLanguage'

const navItems = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: Gauge },
  { to: '/admin/assets', label: 'Tài sản', icon: Boxes },
  { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { to: '/admin/employees', label: 'Nhân viên', icon: UsersRound },
  { to: '/admin/departments', label: 'Phòng ban', icon: Building2 },
  { to: '/admin/assignments', label: 'Bàn giao', icon: PackageCheck },
  { to: '/admin/maintenance', label: 'Bảo trì', icon: Wrench },
  { to: '/admin/inventory', label: 'Kiểm kê', icon: ClipboardCheck },
  { to: '/admin/reports', label: 'Báo cáo', icon: ChartNoAxesCombined },
  { to: '/admin/locations', label: 'Sơ đồ mặt bằng', icon: Map },
  { to: '/admin/support-chat', label: 'Hỗ trợ trực tuyến', icon: MessageSquareMore },
  { to: '/admin/faq-management', label: 'Quản lý FAQ', icon: HelpCircle },
  { to: '/admin/feedbacks', label: 'Góp ý & Phản hồi', icon: MessageSquare },
  { to: '/admin/attendance', label: 'Lịch sử chấm công', icon: CalendarCheck },
  { to: '/admin/login-histories', label: 'Lịch sử đăng nhập', icon: ShieldAlert },
  { to: '/admin/settings', label: 'Cài đặt', icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col overflow-hidden border-r border-white/8 bg-[var(--sidebar)] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/8 px-4">
        <span className="grid size-10 place-items-center rounded-[12px] border border-white/10 bg-white text-brand-800 shadow-lg shadow-black/10">
          <ShieldCheck size={21} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[13px] font-extrabold">EAM Workspace</strong>
          <span className="block truncate text-[10px] text-white/45">
            Asset operations platform
          </span>
        </span>
        <button
          className="ml-auto grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
          type="button"
          aria-label={t('Đóng menu')}
          title={t('Đóng menu')}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={t('Điều hướng quản trị')}>
        <p className="px-3 pb-2 text-[9px] font-extrabold tracking-[0.14em] text-white/35 uppercase">
          {t("Không gian quản trị")}
        </p>
        <div className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[12px] font-semibold transition-all duration-200 ${isActive
                  ? 'bg-white/12 text-white shadow-inner shadow-white/5'
                  : 'text-white/62 hover:bg-white/7 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={isActive ? 'text-emerald-300' : 'text-white/58'}
                    size={18}
                  />
                  {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-300" />}
                  <span className={isActive ? 'text-white' : 'text-white/72'}>
                    {t(label)}
                  </span>
                  <ChevronRight
                    className={`ml-auto transition ${isActive
                      ? 'text-white/55 opacity-80'
                      : 'translate-x-1 text-white/50 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
                      }`}
                    size={15}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-3">
        <div className="rounded-[14px] border border-white/10 bg-white/6 p-1.5 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-600 text-xs font-extrabold shadow-lg shadow-black/15">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold">{t("Quản trị viên")}</strong>
              <span className="mt-0.5 block truncate text-[10px] text-white/45">
                {user?.email}
              </span>
            </span>
            <button
              className="grid size-9 place-items-center rounded-xl text-white/45 transition hover:bg-red-500/15 hover:text-red-300"
              type="button"
              aria-label={t('Đăng xuất')}
              title={t('Đăng xuất')}
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
