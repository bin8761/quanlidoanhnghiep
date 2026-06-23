import {
  Boxes,
  Building2,
  CalendarCheck,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FolderTree,
  Gauge,
  HelpCircle,
  LogOut,
  Map,
  MessageSquare,
  MessageSquareMore,
  PackageCheck,
  Settings,
  ShieldAlert,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/auth-context'
import { useLanguage } from '../../hooks/useLanguage'

const STORAGE_KEY = 'eam_admin_sidebar_groups'

const overviewItem = {
  to: '/admin/dashboard',
  label: 'Tổng quan',
  icon: Gauge,
}

const settingsItem = {
  to: '/admin/settings',
  label: 'Cài đặt',
  icon: Settings,
}

const navGroups = [
  {
    id: 'organization',
    label: 'Quản lý tổ chức',
    icon: Building2,
    items: [
      { to: '/admin/employees', label: 'Nhân viên', icon: UsersRound },
      { to: '/admin/departments', label: 'Phòng ban', icon: Building2 },
    ],
  },
  {
    id: 'assets',
    label: 'Quản lý tài sản',
    icon: Boxes,
    items: [
      { to: '/admin/assets', label: 'Tài sản', icon: Boxes },
      { to: '/admin/categories', label: 'Danh mục', icon: FolderTree },
      { to: '/admin/assignments', label: 'Bàn giao', icon: PackageCheck },
      { to: '/admin/maintenance', label: 'Bảo trì', icon: Wrench },
      { to: '/admin/inventory', label: 'Kiểm kê', icon: ClipboardCheck },
      { to: '/admin/locations', label: 'Sơ đồ mặt bằng', icon: Map },
    ],
  },
  {
    id: 'analytics',
    label: 'Phân tích',
    icon: ChartNoAxesCombined,
    items: [
      { to: '/admin/reports', label: 'Báo cáo', icon: ChartNoAxesCombined },
      { to: '/admin/attendance', label: 'Lịch sử chấm công', icon: CalendarCheck },
      { to: '/admin/login-histories', label: 'Lịch sử đăng nhập', icon: ShieldAlert },
    ],
  },
  {
    id: 'support',
    label: 'Hỗ trợ',
    icon: MessageSquareMore,
    items: [
      { to: '/admin/support-chat', label: 'Hỗ trợ trực tuyến', icon: MessageSquareMore },
      { to: '/admin/faq-management', label: 'Quản lý FAQ', icon: HelpCircle },
      { to: '/admin/feedbacks', label: 'Góp ý & Phản hồi', icon: MessageSquare },
    ],
  },
]

function loadExpandedGroups() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function SidebarLink({ item, nested = false, onNavigate, t }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group/link relative flex min-h-10 items-center gap-3 rounded-[10px] transition-all duration-200 ${
          nested ? 'text-[12px] font-semibold' : 'text-[14px] font-semibold'
        } ${
          nested ? 'pr-2 pl-3' : 'px-3'
        } ${
          isActive
            ? 'bg-white/12 text-white shadow-inner shadow-white/5'
            : 'text-white/65 hover:bg-white/7 hover:text-white'
        }`
      }
      onClick={onNavigate}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-300" />
          )}
          <Icon
            className={isActive ? 'text-emerald-300' : 'text-white/55 group-hover/link:text-white/75'}
            size={nested ? 16 : 18}
          />
          <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
          <ChevronRight
            className={`shrink-0 transition ${
              isActive
                ? 'text-white/55'
                : 'translate-x-1 text-white/40 opacity-0 group-hover/link:translate-x-0 group-hover/link:opacity-100'
            }`}
            size={14}
          />
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState(loadExpandedGroups)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'AD'
  const activeGroupId = navGroups.find((group) =>
    group.items.some((item) => location.pathname.startsWith(item.to)),
  )?.id

  function isGroupOpen(groupId) {
    return groupId === activeGroupId || expandedGroups.includes(groupId)
  }

  function toggleGroup(groupId) {
    setExpandedGroups((current) => {
      const next = current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col overflow-hidden border-r border-white/8 bg-[var(--sidebar)] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/8 px-4">
        <span className="grid size-10 place-items-center overflow-hidden rounded-[12px] border border-white/10 bg-white shadow-lg shadow-black/10">
          <img
            className="size-8 object-contain"
            src="/brand/eam-logo-icon.png"
            alt="EAM Workspace"
          />
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

      <nav
        className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]"
        aria-label={t('Điều hướng quản trị')}
      >
        <p className="px-3 pb-2 text-[9px] font-extrabold tracking-[0.14em] text-white/35 uppercase">
          {t('Không gian quản trị')}
        </p>

        <SidebarLink item={overviewItem} onNavigate={onClose} t={t} />

        <div className="mt-1.5 grid gap-1.5">
          {navGroups.map((group) => {
            const GroupIcon = group.icon
            const expanded = isGroupOpen(group.id)
            const hasActiveItem = group.id === activeGroupId
            const contentId = `admin-nav-group-${group.id}`

            return (
              <section key={group.id}>
                <button
                  className={`group flex min-h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[13px] font-semibold transition ${
                    hasActiveItem
                      ? 'bg-emerald-400/8 text-emerald-200'
                      : 'text-white/65 hover:bg-white/6 hover:text-white'
                  }`}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={contentId}
                  onClick={() => toggleGroup(group.id)}
                >
                  <GroupIcon
                    className={hasActiveItem ? 'text-emerald-300' : 'text-white/55 group-hover:text-white/75 font-bold'}
                    size={16}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-[14px]">{t(group.label)}</span>
                  <ChevronDown
                    className={`text-white/40 transition-transform duration-200 ${
                      expanded ? 'rotate-0' : '-rotate-90'
                    }`}
                    size={14}
                  />
                </button>

                <div
                  id={contentId}
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                    expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="relative mt-1 ml-4 grid gap-0.5 border-l border-white/8 pl-2">
                      {group.items.map((item) => (
                        <SidebarLink
                          key={item.to}
                          item={item}
                          nested
                          onNavigate={onClose}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <SidebarLink item={settingsItem} onNavigate={onClose} t={t} />
        </div>
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-[14px] border border-white/10 bg-white/6 p-1.5 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-600 text-xs font-extrabold shadow-lg shadow-black/15">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-bold">{t('Quản trị viên')}</strong>
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
