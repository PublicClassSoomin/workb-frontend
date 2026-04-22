import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { login } from '../../api/auth'
import { validateInviteCode } from '../../api/workspace'
import { useAuth } from '../../context/AuthContext'

type Tab = 'admin' | 'member'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [verifiedInviteCode, setVerifiedInviteCode] = useState('')
  const [verifiedWorkspaceId, setVerifiedWorkspaceId] = useState<number | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validatingInvite, setValidatingInvite] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshSession, signOut } = useAuth()
  const returnTo = typeof location.state === 'object'
    && location.state
    && 'from' in location.state
    && typeof location.state.from === 'string'
    ? location.state.from
    : '/'

  function normalizeInviteCode(value: string) {
    return value.trim().toUpperCase()
  }

  async function handleValidateInviteCode() {
    const normalizedCode = normalizeInviteCode(inviteCode)
    if (normalizedCode.length < 6) {
      setError('초대코드를 확인해주세요.')
      return null
    }

    setValidatingInvite(true)
    setError('')

    try {
      const invite = await validateInviteCode(normalizedCode)
      setInviteCode(normalizedCode)
      setVerifiedInviteCode(normalizedCode)
      setVerifiedWorkspaceId(invite.workspace_id)
      setWorkspaceName(invite.workspace_name)
      return invite
    } catch (err) {
      setVerifiedInviteCode('')
      setVerifiedWorkspaceId(null)
      setWorkspaceName('')
      setError(err instanceof Error ? err.message : '유효하지 않은 초대코드입니다.')
      return null
    } finally {
      setValidatingInvite(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const normalizedCode = normalizeInviteCode(inviteCode)
      const invite = tab === 'member'
        ? verifiedInviteCode === normalizedCode && verifiedWorkspaceId
          ? { workspace_id: verifiedWorkspaceId, workspace_name: workspaceName, valid: true }
          : await handleValidateInviteCode()
        : null

      if (tab === 'member' && !invite) return

      await login(
        { email, password },
        invite ? { workspace_id: invite.workspace_id } : {},
      )
      const sessionUser = await refreshSession()

      if (tab === 'admin' && sessionUser?.role !== 'admin') {
        await signOut()
        setError('관리자 계정으로 로그인해주세요.')
        return
      }

      if (tab === 'member') {
        const invalidMemberSession = !sessionUser
          || sessionUser.role === 'admin'
          || sessionUser.workspace_id !== invite?.workspace_id

        if (invalidMemberSession) {
          await signOut()
          setError('초대코드와 계정 정보가 일치하지 않습니다.')
          return
        }
      }

      navigate(returnTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">로그인</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">워크스페이스에 오신 것을 환영합니다.</p>

      {/* Tab */}
      <div role="tablist" className="flex rounded-lg bg-muted p-1 mb-6">
        {(['admin', 'member'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'admin' ? '관리자' : '멤버'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {tab === 'member' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="invite-code">초대코드</label>
            <div className="flex gap-2">
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  const nextCode = e.target.value.toUpperCase()
                  setInviteCode(nextCode)
                  if (normalizeInviteCode(nextCode) !== verifiedInviteCode) {
                    setVerifiedInviteCode('')
                    setVerifiedWorkspaceId(null)
                    setWorkspaceName('')
                  }
                }}
                placeholder="WORKB-XXXXXX"
                maxLength={20}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 font-mono text-sm tracking-widest outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                onClick={handleValidateInviteCode}
                disabled={validatingInvite || loading}
                className="h-10 shrink-0 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {validatingInvite ? '확인 중...' : '코드 확인'}
              </button>
            </div>
            {workspaceName && (
              <p className="text-mini text-accent mt-1">{workspaceName} 워크스페이스로 로그인합니다.</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1" htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>

        {/* Social login */}
        <div className="flex items-center gap-2 my-1">
          <div className="flex-1 border-t border-border" />
          <span className="text-mini text-muted-foreground">또는</span>
          <div className="flex-1 border-t border-border" />
        </div>
        <button
          type="button"
          onClick={() => console.log('TODO: Google OAuth')}
          className="h-10 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          <span>🔵</span> Google로 계속하기
        </button>
        <button
          type="button"
          onClick={() => console.log('TODO: Kakao OAuth')}
          className="h-10 rounded-lg border border-border bg-[#FEE500] text-[#3A1D1D] text-sm font-medium hover:bg-[#FEE500]/90 transition-colors flex items-center justify-center gap-2"
        >
          <span>💛</span> 카카오로 계속하기
        </button>
      </form>

      <div className="flex flex-col items-center gap-2 mt-6 text-sm text-muted-foreground">
        <Link to="/reset-password" className="hover:text-foreground transition-colors">비밀번호를 잊으셨나요?</Link>
        <span>
          계정이 없으신가요?{' '}
          <Link
            to={tab === 'admin' ? '/signup/admin' : '/signup/member'}
            className="text-accent font-medium hover:underline"
          >
            {tab === 'admin' ? '관리자 회원가입' : '멤버 회원가입'}
          </Link>
        </span>
      </div>
    </div>
  )
}
