import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

type Tab = 'admin' | 'member'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    // TODO: authenticate user
    console.log('TODO: login', { tab, email, password })
    localStorage.setItem('workb-auth-mock', 'true')
    navigate('/')
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
          className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors mt-1"
        >
          로그인
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
          <Link to="/signup/admin" className="text-accent font-medium hover:underline">
            {tab === 'admin' ? '관리자 회원가입' : '회원가입'}
          </Link>
        </span>
      </div>
    </div>
  )
}
