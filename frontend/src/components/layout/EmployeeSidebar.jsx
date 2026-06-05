import {
  Boxes,
  ChevronRight,
  CircleUserRound,
  Gauge,
  Headphones,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'

const navItems = [
  { to: '/employee/dashboard', label: 'Tổng quan', icon: Gauge },
  { to: '/employee/assets', label: 'Tài sản của tôi', icon: Boxes },
  { to: '/employee/requests', label: 'Yêu cầu hỗ trợ', icon: Headphones },
  { to: '/employee/profile', label: 'Hồ sơ cá nhân', icon: CircleUserRound },
]

export default function EmployeeSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'NV'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col overflow-hidden border-r border-white/10 bg-[#10251d] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-800 shadow-lg shadow-black/10">
          <ShieldCheck size={23} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-extrabold">EAM Workspace</strong>
          <span className="block truncate text-[10px] text-white/45">Cổng thông tin nhân viên</span>
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

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng nhân viên">
        <p className="px-3 pb-2 text-[10px] font-extrabold tracking-[0.14em] text-white/35 uppercase">
          Không gian cá nhân
        </p>
        <div className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-black/10'
                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  <Icon className={isActive ? 'text-brand-600' : 'text-white/60'} size={18} />
                  <span>{label}</span>
                  <ChevronRight
                    className={`ml-auto transition ${
                      isActive
                        ? 'text-slate-400'
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
        <div className="rounded-2xl border border-white/10 bg-white/6 p-2">
          <div className="flex items-center gap-3 p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-xs font-extrabold">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold">Nhân viên</strong>
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
