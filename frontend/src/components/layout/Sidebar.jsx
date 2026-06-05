import {
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ChevronRight,
  ClipboardCheck,
  FolderTree,
  Gauge,
  LogOut,
  PackageCheck,
  ShieldCheck,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'

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
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col overflow-hidden border-r border-white/10 bg-brand-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand-800 shadow-lg shadow-black/10">
          <ShieldCheck size={23} />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-extrabold">EAM Workspace</strong>
          <span className="block truncate text-[10px] text-white/45">
            Asset operations platform
          </span>
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

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Điều hướng quản trị">
        <p className="px-3 pb-2 text-[10px] font-extrabold tracking-[0.14em] text-white/35 uppercase">
          Không gian quản trị
        </p>
        <div className="grid gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-brand-950 shadow-lg shadow-black/10'
                    : 'text-white/58 hover:bg-white/8 hover:text-white'
                }`
              }
              onClick={onClose}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={isActive ? 'text-brand-600' : 'text-white/65'}
                    size={18}
                  />
                  <span className={isActive ? 'text-slate-950' : 'text-white/70'}>
                    {label}
                  </span>
                  <ChevronRight
                    className={`ml-auto transition ${
                      isActive
                        ? 'text-slate-500 opacity-60'
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
        <div className="rounded-2xl border border-white/10 bg-white/6 p-2 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-extrabold shadow-lg shadow-black/15">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold">Quản trị viên</strong>
              <span className="mt-0.5 block truncate text-[10px] text-white/45">
                {user?.email}
              </span>
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
