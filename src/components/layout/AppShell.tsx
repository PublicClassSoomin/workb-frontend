import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ChatFAB from '../chat/ChatFAB'
import { useThemePreference } from '../../hooks/useThemePreference'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { preference, isDark, cyclePreference } = useThemePreference()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          themePreference={preference}
          resolvedDark={isDark}
          onCycleTheme={cyclePreference}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main id="main" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Global chatbot FAB — visible on all authenticated pages */}
      <ChatFAB />
    </div>
  )
}
