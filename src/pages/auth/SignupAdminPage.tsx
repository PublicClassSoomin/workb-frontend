import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignupAdminPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('모든 필드를 입력해주세요.'); return }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return }
    // TODO: register admin
    console.log('TODO: signup admin', { email, password })
    navigate('/onboarding/workspace')
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">관리자 회원가입</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">가입 후 워크스페이스를 생성할 수 있습니다.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">비밀번호 확인</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors mt-1">
          회원가입 → 워크스페이스 생성
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-accent font-medium hover:underline">로그인</Link>
      </p>
    </div>
  )
}
