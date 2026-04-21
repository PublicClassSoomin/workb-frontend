import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ChatFAB from '../chat/ChatFAB'
import { useThemePreference } from '../../hooks/useThemePreference'
import { logout } from '../../api/auth'
import {
  clearAuthTokens,
  ensureAuthSession,
  getRefreshToken,
  hasStoredSession,
} from '../../api/client'

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(hasStoredSession)
  const location = useLocation()
  const navigate = useNavigate()
  const { preference, isDark, cyclePreference } = useThemePreference()

  useEffect(() => {
    let active = true

    async function checkSession() {
      if (!hasStoredSession()) {
        setAuthenticated(false)
        setAuthChecked(true)
        return
      }

      try {
        await ensureAuthSession()
        if (active) setAuthenticated(true)
      } catch {
        if (active) setAuthenticated(false)
      } finally {
        if (active) setAuthChecked(true)
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  async function handleLogout() {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      await logout(refreshToken)
    } else {
      clearAuthTokens()
    }

    navigate('/login', { replace: true })
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">로그인 상태를 확인하는 중입니다...</p>
      </div>
    )
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

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
          onLogout={handleLogout}
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
