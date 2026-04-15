import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Sun, Moon, Bell, Monitor, Menu } from 'lucide-react'
import clsx from 'clsx'
import type { ThemePreference } from '../../hooks/useThemePreference'
import NotificationsPanel from './NotificationsPanel'
import Tooltip from '../ui/Tooltip'

interface TopBarProps {
  themePreference: ThemePreference
  /** 실제 적용 중인 다크 여부 (시스템 모드면 OS와 동기) */
  resolvedDark: boolean
  onCycleTheme: () => void
  onMenuOpen?: () => void
}

const THEME_CYCLE_HINT: Record<ThemePreference, string> = {
  system: '테마: 시스템에 맞춤. 클릭하면 라이트 고정',
  light: '테마: 라이트 고정. 클릭하면 다크 고정',
  dark: '테마: 다크 고정. 클릭하면 시스템에 맞춤',
}

export default function TopBar({
  themePreference,
  resolvedDark,
  onCycleTheme,
  onMenuOpen,
}: TopBarProps) {
  const navigate = useNavigate()
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // 알림 패널 외부 클릭으로 닫기
  useEffect(() => {
    if (!notifOpen) return
    function handleDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [notifOpen])

  return (
    <header className="flex items-center gap-2 px-3 sm:px-4 h-11 border-b border-border bg-background shrink-0">
      {/* 햄버거 — 모바일 전용 */}
      <Tooltip label="메뉴 열기" placement="bottom">
        <button
          className="md:hidden flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          aria-label="메뉴 열기"
          aria-expanded={false}
          onClick={onMenuOpen}
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </Tooltip>

      {/* 검색 */}
      <div
        className={clsx(
          'flex items-center gap-2 flex-1 max-w-xs h-7 px-2.5 rounded border text-sm transition-colors',
          searchFocused
            ? 'border-accent bg-card ring-1 ring-accent/20'
            : 'border-border bg-muted hover:border-muted-foreground/60',
        )}
      >
        <Search size={13} className="text-muted-foreground shrink-0" aria-hidden="true" />
        <input
          type="search"
          placeholder="회의 검색..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          aria-label="회의 검색"
          // TODO: implement real search handler
        />
        {!searchFocused && (
          <kbd className="hidden sm:flex items-center gap-0.5 text-micro text-muted-foreground">
            <span>⌘K</span>
          </kbd>
        )}
      </div>

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* 액션 영역 */}
      <div className="flex items-center gap-1">
        {/* 새 회의 버튼 → /meetings/new */}
        <Tooltip label="새 회의 생성" placement="bottom">
          <button
            onClick={() => navigate('/meetings/new')}
            className={clsx(
              'flex items-center gap-1.5 h-7 px-3 rounded text-sm font-medium transition-colors',
              'bg-accent text-accent-foreground hover:opacity-90',
            )}
            aria-label="새 회의 생성"
          >
            <Plus size={13} aria-hidden="true" />
            <span className="hidden sm:inline">새 회의</span>
          </button>
        </Tooltip>

        {/* 알림 버튼 + 팝오버 */}
        <div ref={notifRef} className="relative">
          <Tooltip label="알림" placement="bottom">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
              aria-label="알림"
              aria-haspopup="dialog"
              aria-expanded={notifOpen}
            >
              <Bell size={15} aria-hidden="true" />
              {/* 읽지 않은 알림 표시 */}
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            </button>
          </Tooltip>

          {/* 알림 패널 */}
          {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* 테마 전환: system → light → dark */}
        <Tooltip label={THEME_CYCLE_HINT[themePreference]} placement="bottom">
          <button
            type="button"
            onClick={onCycleTheme}
            className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={THEME_CYCLE_HINT[themePreference]}
          >
            {themePreference === 'system' ? (
              <Monitor size={15} aria-hidden="true" />
            ) : resolvedDark ? (
              <Moon size={15} aria-hidden="true" />
            ) : (
              <Sun size={15} aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
