import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, Sparkles, UserCheck, Plus, Trash2 } from 'lucide-react'
import { MEETINGS } from '../../data/mockData'

export default function NotesEditPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS.find((m) => m.status === 'completed') ?? MEETINGS[0]

  const [summary, setSummary] = useState(meeting.summary ?? '')
  const [decisions, setDecisions] = useState([
    '홈 대시보드 와이어프레임 승인',
    '사이드바 컬러 시스템 확정',
    '다음 스프린트 컴포넌트 구현 착수',
  ])
  const [reviewer, setReviewer] = useState('')
  const [reviewerEmail, setReviewerEmail] = useState('')

  function addDecision() {
    setDecisions((prev) => [...prev, ''])
  }

  function updateDecision(i: number, val: string) {
    setDecisions((prev) => prev.map((d, idx) => idx === i ? val : d))
  }

  function removeDecision(i: number) {
    setDecisions((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    // TODO: save meeting notes
    console.log('TODO: save notes', { summary, decisions })
    navigate(`/meetings/${meetingId}/notes`)
  }

  function handleReviewRequest() {
    // TODO: send review request via Slack/Kakao
    console.log('TODO: request review', { reviewer, reviewerEmail })
    alert('검토 요청이 발송되었습니다. (TODO: Slack/카카오톡 연동)')
  }

  function handleRegenerate() {
    // TODO: re-summarize via AI
    console.log('TODO: regenerate summary via AI')
    setSummary('(AI 재요약 결과가 여기에 표시됩니다) ' + summary)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">회의록 편집</h1>
          <p className="text-sm text-muted-foreground">{meeting.title}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-accent text-accent text-sm hover:bg-accent-subtle transition-colors"
          >
            <Sparkles size={13} /> 재요약
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Save size={13} /> 저장
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Summary */}
        <section>
          <label className="block text-sm font-medium text-foreground mb-2">요약</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            placeholder="회의 요약 내용..."
          />
        </section>

        {/* Decisions */}
        <section>
          <label className="block text-sm font-medium text-foreground mb-2">결정사항</label>
          <div className="flex flex-col gap-2">
            {decisions.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-accent-subtle text-accent text-micro font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={d}
                  onChange={(e) => updateDecision(i, e.target.value)}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="결정사항..."
                />
                <button onClick={() => removeDecision(i)} className="text-muted-foreground hover:text-red-500 transition-colors" aria-label="삭제">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addDecision}
              className="flex items-center gap-1.5 h-8 px-3 rounded border border-dashed border-border text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors w-fit"
            >
              <Plus size={13} /> 결정사항 추가
            </button>
          </div>
        </section>

        {/* Review request */}
        <section className="p-4 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-1.5 mb-3">
            <UserCheck size={15} className="text-accent" />
            <span className="text-sm font-medium text-foreground">상급자 검토 요청</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              placeholder="검토자 이름"
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <input
              type="email"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              placeholder="이메일 또는 Slack ID"
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            />
            <button
              onClick={handleReviewRequest}
              className="h-9 px-3 rounded-lg border border-accent text-accent text-sm hover:bg-accent-subtle transition-colors whitespace-nowrap"
            >
              요청 발송
            </button>
          </div>
          <p className="text-mini text-muted-foreground mt-1.5">Slack · 카카오톡으로 검토 요청 알림이 발송됩니다. (TODO: 연동 필요)</p>
        </section>
      </div>
    </div>
  )
}
