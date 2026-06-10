import {
  Boxes,
  ChevronRight,
  CircleUserRound,
  Gauge,
  Headphones,
  LogOut,
  ShieldCheck,
  X,
  LockKeyhole,
  History,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { useLanguage } from '../../hooks/useLanguage'

const navItemDefs = [
  { to: '/employee/dashboard', labelKey: 'Tổng quan', icon: Gauge },
  { to: '/employee/assets', labelKey: 'Tài sản của tôi', icon: Boxes },
  { to: '/employee/requests', labelKey: 'Yêu cầu hỗ trợ', icon: Headphones },
  { to: '/employee/profile', labelKey: 'Hồ sơ cá nhân', icon: CircleUserRound },
  { to: '/employee/change-password', labelKey: 'Đổi mật khẩu', icon: LockKeyhole },
  { to: '/employee/history', labelKey: 'Lịch sử', icon: History },
  { to: '/employee/settings', labelKey: 'Cài đặt', icon: Settings },
]

export default function EmployeeSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'NV'
  const navItems = navItemDefs.map(item => ({ ...item, label: t(item.labelKey) }))

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col overflow-hidden border-r border-white/8 bg-[var(--sidebar)] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/8 px-4">
        <span className="grid size-10 place-items-center rounded-[12px] border border-white/10 bg-white text-brand-800 shadow-lg shadow-black/10">
          <ShieldCheck size={21} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-extrabold">EAM Workspace</strong>
          <span className="block truncate text-[10px] text-white/45">{t('Cổng thông tin nhân viên')}</span>
        </span>
        <button
          className="ml-auto grid size-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white lg:hidden"
          type="button"
          title="Đóng menu"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Điều hướng nhân viên">
        <p className="px-3 pb-2 text-[10px] font-extrabold tracking-[0.14em] text-white/35 uppercase">
          {t('Không gian cá nhân')}
        </p>
        <div className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group relative flex min-h-10 items-center gap-3 rounded-[10px] px-3 text-[12px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white/12 text-white shadow-inner shadow-white/5'
                    : 'text-white/65 hover:bg-white/7 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-300" />}
                  <Icon className={isActive ? 'text-emerald-300' : 'text-white/60'} size={18} />
                  <span>{label}</span>
                  <ChevronRight
                    className={`ml-auto transition ${
                      isActive
                        ? 'text-white/55'
                        : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60'
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
        <div className="rounded-[14px] border border-white/10 bg-white/6 p-1.5">
          <div className="flex items-center gap-3 p-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-600 text-xs font-extrabold">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold">{t('Nhân viên')}</strong>
              <span className="mt-0.5 block truncate text-[10px] text-white/45">{user?.email}</span>
            </span>
            <button
              className="grid size-9 place-items-center rounded-xl text-white/45 transition hover:bg-red-500/15 hover:text-red-300"
              type="button"
              title="Đăng xuất"
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
