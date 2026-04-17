import { useState } from 'react'
import { UserPlus, Copy, Check, MoreVertical, Shield } from 'lucide-react'
import { PARTICIPANTS, DEPARTMENTS } from '../../data/mockData'

type Role = '관리자' | '멤버' | '뷰어'

const ROLE_STYLES: Record<Role, string> = {
  관리자: 'bg-accent-subtle text-accent',
  멤버: 'bg-muted text-muted-foreground',
  뷰어: 'bg-muted text-muted-foreground',
}

export default function MembersSettingsPage() {
  const [members, setMembers] = useState(
    PARTICIPANTS.map((p, i) => ({
      ...p,
      email: `${p.avatarInitials.toLowerCase()}@workb.io`,
      role: (i === 0 ? '관리자' : '멤버') as Role,
      joined: '2026-01-15',
      department: p.department ?? '',
    }))
  )
  const [inviteCode] = useState('WORKB-M2K9XA')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function changeRole(id: string, role: Role) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)))
    console.log('TODO: update role', { id, role })
  }

  function changeDepartment(id: string, department: string) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, department } : m)))
    console.log('TODO: update department', { id, department })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">멤버 · 권한 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{members.length}명의 멤버</p>
        </div>
      </div>

      {/* Invite code */}
      <div className="p-3.5 rounded-lg border border-border bg-muted/20 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground mb-0.5">초대코드</p>
            <p className="text-mini text-muted-foreground">이 코드를 공유하면 누구나 참여할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm tracking-widest text-foreground bg-card px-3 py-2 rounded border border-border">
              {inviteCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-2 rounded border border-border text-sm hover:bg-muted transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? '복사됨' : '복사'}
            </button>
            <button
              onClick={() => console.log('TODO: generate new invite code')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <UserPlus size={13} /> 새 코드 발급
            </button>
          </div>
        </div>
      </div>

      {/* Member table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        {/* Table header — desktop only */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 bg-muted/40 border-b border-border text-micro font-medium text-muted-foreground uppercase tracking-wide">
          <span>멤버</span>
          <span>부서</span>
          <span>역할</span>
          <span>가입일</span>
          <span></span>
        </div>

        {members.map((member) => (
          <div
            key={member.id}
            className="px-4 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
          >
            {/* Mobile layout */}
            <div className="flex items-center justify-between gap-2 md:hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatarInitials[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                  <p className="text-mini text-muted-foreground truncate">{member.email}</p>
                  {member.department && (
                    <p className="text-micro text-muted-foreground truncate">{member.department}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end shrink-0">
                <select
                  value={member.department}
                  onChange={(e) => changeDepartment(member.id, e.target.value)}
                  className="appearance-none h-7 px-2 pr-5 rounded border border-border bg-card text-mini outline-none cursor-pointer hover:border-foreground transition-colors"
                  aria-label="부서 변경"
                >
                  <option value="">부서 없음</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <select
                    value={member.role}
                    onChange={(e) => changeRole(member.id, e.target.value as Role)}
                    className="appearance-none h-7 px-2 pr-5 rounded border border-border bg-card text-mini outline-none cursor-pointer hover:border-foreground transition-colors"
                    aria-label="역할 변경"
                  >
                    {(['관리자', '멤버', '뷰어'] as Role[]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <MoreVertical size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
              {/* 멤버 정보 */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatarInitials[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-mini text-muted-foreground">{member.email}</p>
                </div>
              </div>

              {/* 부서 선택 */}
              <select
                value={member.department}
                onChange={(e) => changeDepartment(member.id, e.target.value)}
                className="h-7 px-2 rounded border border-border bg-card text-mini outline-none cursor-pointer hover:border-foreground transition-colors"
                aria-label="부서 변경"
              >
                <option value="">부서 없음</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              {/* 역할 뱃지 */}
              <div className="flex items-center gap-1.5">
                {member.role === '관리자' && <Shield size={12} className="text-accent" />}
                <span className={`px-2 py-0.5 rounded-full text-mini font-medium ${ROLE_STYLES[member.role]}`}>
                  {member.role}
                </span>
              </div>

              {/* 가입일 */}
              <span className="text-mini text-muted-foreground">{member.joined}</span>

              {/* 역할 변경 */}
              <div className="relative">
                <select
                  value={member.role}
                  onChange={(e) => changeRole(member.id, e.target.value as Role)}
                  className="appearance-none h-7 px-2 pr-5 rounded border border-border bg-card text-mini outline-none cursor-pointer hover:border-foreground transition-colors"
                  aria-label="역할 변경"
                >
                  {(['관리자', '멤버', '뷰어'] as Role[]).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <MoreVertical size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
