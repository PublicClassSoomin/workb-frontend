import { useState } from 'react'
import { Search, Plus, Sun, Moon, Bell, Monitor, Menu, LogOut } from 'lucide-react'
import clsx from 'clsx'
import type { ThemePreference } from '../../hooks/useThemePreference'

interface TopBarProps {
  themePreference: ThemePreference
  /** 실제 적용 중인 다크 여부 (시스템 모드면 OS와 동기) */
  resolvedDark: boolean
  onCycleTheme: () => void
  onMenuOpen?: () => void
  onLogout?: () => void
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
  onLogout,
}: TopBarProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="flex items-center gap-2 px-3 sm:px-4 h-11 border-b border-border bg-background shrink-0">
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
        aria-label="메뉴 열기"
        aria-expanded={false}
        onClick={onMenuOpen}
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div className={clsx(
        'flex items-center gap-2 flex-1 max-w-xs h-7 px-2.5 rounded border text-sm transition-colors',
        searchFocused
          ? 'border-accent bg-card ring-1 ring-accent/20'
          : 'border-border bg-muted hover:border-muted-foreground/60',
      )}>
        <Search size={13} className="text-muted-foreground shrink-0" />
        <input
          type="search"
          placeholder="회의 검색..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          // TODO: implement real search handler
        />
        {!searchFocused && (
          <kbd className="hidden sm:flex items-center gap-0.5 text-micro text-muted-foreground">
            <span>⌘K</span>
          </kbd>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* New meeting button */}
        <button
          className={clsx(
            'flex items-center gap-1.5 h-7 px-3 rounded text-sm font-medium transition-colors',
            'bg-accent text-accent-foreground hover:opacity-90',
          )}
          // TODO: open create-meeting modal
        >
          <Plus size={13} />
          <span className="hidden sm:inline">새 회의</span>
        </button>

        {/* Notifications */}
        <button
          className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative"
          aria-label="알림"
          // TODO: open notifications panel
        >
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>

        {/* Theme: system → light → dark (cycle) */}
        <button
          type="button"
          onClick={onCycleTheme}
          className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={THEME_CYCLE_HINT[themePreference]}
          title={THEME_CYCLE_HINT[themePreference]}
        >
          {themePreference === 'system' ? (
            <Monitor size={15} aria-hidden />
          ) : resolvedDark ? (
            <Moon size={15} aria-hidden />
          ) : (
            <Sun size={15} aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="로그아웃"
          title="로그아웃"
        >
          <LogOut size={15} aria-hidden />
        </button>
      </div>
    </header>
  )
}
