import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, signupMember } from '../../api/auth'
import { setCurrentWorkspaceId } from '../../api/client'
import { validateInviteCode } from '../../api/workspace'

export default function SignupMemberPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode || !email || !name || !password) { setError('모든 필드를 입력해주세요.'); return }
    if (inviteCode.length < 6) { setError('초대코드를 확인해주세요.'); return }

    setLoading(true)
    setError('')

    try {
      const invite = await validateInviteCode(inviteCode)
      setCurrentWorkspaceId(invite.workspace_id)
      await signupMember({
        invite_code: inviteCode,
        email,
        password,
        name,
      })
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '멤버 회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">멤버 회원가입</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">관리자에게 받은 초대코드로 가입하세요.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">초대코드</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="WORKB-XXXXXX"
            maxLength={12}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-mono tracking-widest"
          />
          <p className="text-mini text-muted-foreground mt-1">관리자로부터 전달받은 초대코드를 입력하세요.</p>
        </div>
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
          <label className="block text-sm font-medium text-foreground mb-1">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
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
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? '가입 중...' : '회원가입 완료'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        초대코드 없이 가입하려면?{' '}
        <Link to="/signup/admin" className="text-accent font-medium hover:underline">관리자로 가입</Link>
      </p>
    </div>
  )
}
