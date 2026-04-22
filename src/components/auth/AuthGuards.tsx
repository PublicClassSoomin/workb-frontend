import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AuthLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">로그인 상태를 확인하는 중입니다...</p>
    </div>
  )
}

export function PublicOnlyRoute() {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingFallback />
  if (isAuthenticated) {
    const from = typeof location.state === 'object'
      && location.state
      && 'from' in location.state
      && typeof location.state.from === 'string'
      ? location.state.from
      : '/'

    return <Navigate to={from} replace />
  }

  return <Outlet />
}

export function RequireAuthRoute() {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingFallback />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RequireAdminRoute() {
  const { loading, isAuthenticated, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <AuthLoadingFallback />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
