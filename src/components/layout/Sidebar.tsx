import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Home,
  History,
  Video,
  Plus,
  Settings,
  Mic,
  Users,
  LayoutGrid,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  ListTodo,
  FileBarChart,
  Share2,
  Search,
  Link2,
  Gauge,
  Building2,
  X,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'

interface NavItemDef {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItemDef[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '홈',
    items: [
      { to: '/', label: '홈 대시보드', icon: Home },
      { to: '/history', label: '회의 히스토리', icon: History },
    ],
  },
  {
    label: '회의',
    items: [
      { to: '/meetings/new', label: '회의 생성 · 예약', icon: Plus },
      { to: '/meetings/context', label: '이전 회의 맥락', icon: Search },
      { to: '/live/m1', label: '실시간 회의', icon: Video },
    ],
  },
  {
    label: '회의 후',
    items: [
      { to: '/meetings/m5/notes', label: '회의록', icon: FileText },
      { to: '/meetings/m5/wbs', label: 'WBS · 태스크', icon: ListTodo },
      { to: '/meetings/m5/reports', label: '보고서 생성', icon: FileBarChart },
      { to: '/meetings/m5/export', label: '내보내기 · 공유', icon: Share2 },
    ],
  },
  {
    label: '설정',
    items: [
      { to: '/settings/workspace', label: '워크스페이스', icon: LayoutGrid },
      { to: '/settings/members', label: '멤버 · 권한', icon: Users },
      { to: '/settings/departments', label: '부서 관리', icon: Building2 },
      { to: '/settings/voice', label: '화자 등록', icon: Mic },
      { to: '/settings/integrations', label: '연동 관리', icon: Link2 },
      { to: '/settings/device', label: '장비 설정', icon: Gauge },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  // Close drawer on Escape key (mobile)
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen, onMobileClose])

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

    <aside
      aria-label="주 내비게이션 패널"
      {...(mobileOpen ? { 'aria-modal': true } : {})}
      className={clsx(
        'flex flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground h-screen',
        // Mobile: fixed overlay, slide in/out
        'fixed inset-y-0 left-0 z-50 w-64',
        'transition-transform duration-200 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop (md+): back in flow, use collapsed/expanded widths
        'md:relative md:z-auto md:translate-x-0 md:shrink-0',
        collapsed ? 'md:w-12' : 'md:w-56',
      )}
    >
      {/* Header — workspace identity */}
      <div className={clsx(
        'flex items-center gap-2 px-2.5 py-2.5 border-b border-sidebar-border shrink-0',
        collapsed ? 'justify-center' : 'justify-between',
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/brand/workb-logo.png"
              alt="Workb 로고"
              className="w-6 h-6 rounded object-cover shrink-0"
            />
            <span className="text-sm font-medium truncate text-sidebar-foreground">Workb 팀</span>
          </div>
        )}
        {collapsed && (
          <img
            src="/brand/workb-logo.png"
            alt="Workb 로고"
            className="w-6 h-6 rounded object-cover"
          />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
            aria-label="사이드바 접기"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Scroll area */}
      <nav className="flex-1 overflow-y-auto py-2" role="navigation" aria-label="주 내비게이션">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? 'mt-1' : ''}>
            {/* Group label */}
            {!collapsed ? (
              <div className="mx-3 mt-3 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-micro font-medium text-muted-foreground/60 uppercase tracking-widest">{group.label}</span>
                  <div className="flex-1 border-t border-sidebar-border" />
                </div>
              </div>
            ) : groupIdx > 0 ? (
              <div className="mx-2.5 my-2 border-t border-sidebar-border" />
            ) : null}

            {/* Items */}
            <div className="px-1.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  aria-current={undefined}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm transition-colors',
                      'text-sidebar-foreground hover:bg-sidebar-hover cursor-pointer',
                      collapsed ? 'justify-center' : '',
                      isActive && 'bg-sidebar-active text-accent font-medium',
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={15} className={clsx('shrink-0', isActive ? 'text-accent' : '')} aria-hidden="true" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge && item.badge > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-micro font-medium">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border py-1.5 px-1.5 shrink-0">
        <NavLink
          to="/settings/workspace"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm transition-colors text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground',
              collapsed ? 'justify-center' : '',
              isActive && 'bg-sidebar-active text-accent',
            )
          }
          title={collapsed ? '설정' : undefined}
        >
          <Settings size={15} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span className="flex-1">설정</span>}
        </NavLink>

        <button
          className={clsx(
            'flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors',
            collapsed ? 'justify-center' : '',
          )}
          onClick={() => console.log('TODO: open help')}
          title={collapsed ? '고객지원' : undefined}
        >
          <HelpCircle size={15} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span className="flex-1">고객지원</span>}
        </button>

        {/* Mobile: close button */}
        <button
          onClick={onMobileClose}
          className={clsx(
            'md:hidden flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm text-muted-foreground',
            'hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors',
          )}
          aria-label="사이드바 닫기"
        >
          <X size={15} /><span>닫기</span>
        </button>

        {/* Desktop: collapse toggle */}
        <button
          onClick={onToggle}
          className={clsx(
            'hidden md:flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-sm text-muted-foreground',
            'hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors',
            collapsed ? 'justify-center' : '',
          )}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed
            ? <PanelLeftOpen size={15} />
            : <><PanelLeftClose size={15} /><span>접기</span></>
          }
        </button>
      </div>
    </aside>
    </>
  )
}
