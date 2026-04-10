import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'sent'>('email')
  const [email, setEmail] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    // TODO: send reset email
    console.log('TODO: send password reset email to', email)
    setStep('sent')
  }

  if (step === 'sent') {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-foreground mb-2">이메일을 확인하세요</h1>
        <p className="text-sm text-muted-foreground mb-6">
          <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
        </p>
        <Link to="/login" className="text-accent text-sm font-medium hover:underline">
          로그인으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">비밀번호 재설정</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">가입한 이메일 주소를 입력하면 재설정 링크를 보내드립니다.</p>

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
        <button type="submit" className="h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
          재설정 링크 보내기
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        <Link to="/login" className="text-accent font-medium hover:underline">로그인으로 돌아가기</Link>
      </p>
    </div>
  )
}
