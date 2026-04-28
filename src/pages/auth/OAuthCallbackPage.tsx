import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { setAuthTokens, syncStoredUserFromToken } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshSession } = useAuth()

  useEffect(() => {
    async function completeSocialLogin() {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const errorMessage = searchParams.get('error')

      if (errorMessage) {
        setError(errorMessage)
        return
      }

      if (!accessToken || !refreshToken) {
        setError('소셜 로그인 응답이 올바르지 않습니다.')
        return
      }

      setAuthTokens(accessToken, refreshToken)
      syncStoredUserFromToken()
      await refreshSession()
      navigate('/', { replace: true })
    }

    void completeSocialLogin()
  }, [navigate, refreshSession, searchParams])

  return (
    <div className="w-full max-w-sm text-center">
      <h1 className="mb-2 text-2xl font-bold text-foreground">소셜 로그인</h1>
      {error ? (
        <>
          <p className="mb-6 text-sm text-red-500">{error}</p>
          <Link to="/login" className="text-sm font-medium text-accent hover:underline">
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">로그인 정보를 확인하는 중입니다...</p>
      )}
    </div>
  )
}
