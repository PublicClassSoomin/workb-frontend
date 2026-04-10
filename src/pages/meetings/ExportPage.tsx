import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ExternalLink, Calendar, Sparkles, Check } from 'lucide-react'
import { MEETINGS } from '../../data/mockData'
import { INTEGRATIONS } from '../../data/mockIntegrations'

export default function ExportPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[4]
  const [exported, setExported] = useState<Record<string, boolean>>({})
  const [scheduleSuggestion] = useState({
    title: '후속 회의: UI/UX 디자인 2차 검토',
    suggested: '2026년 4월 16일 (목) 오전 10:00',
    participants: ['김수민', '이지현', '최은영'],
  })

  function handleExport(target: string) {
    // TODO: export to external service
    console.log('TODO: export to', target, meetingId)
    setExported((prev) => ({ ...prev, [target]: true }))
    alert(`${target}으로 내보냈습니다. (TODO: 연동 필요)`)
  }

  function handleSchedule() {
    // TODO: create next meeting in calendar
    console.log('TODO: schedule next meeting', scheduleSuggestion)
    alert('캘린더에 일정이 등록되었습니다. (TODO: Google Calendar 연동)')
  }

  const exportTargets = [
    { id: 'jira', label: 'JIRA 이슈 생성', desc: 'WBS 태스크를 JIRA 이슈로 자동 생성', icon: '🔵', connected: INTEGRATIONS.find((i) => i.id === 'jira')?.status === 'connected' },
    { id: 'excel', label: 'Excel 내보내기', desc: '회의록·WBS를 엑셀 파일로 다운로드', icon: '📊', connected: true },
    { id: 'notion', label: 'Notion 내보내기', desc: 'Notion 페이지로 자동 저장', icon: '📝', connected: INTEGRATIONS.find((i) => i.id === 'notion')?.status === 'connected' },
    { id: 'slack', label: 'Slack 공유', desc: '선택한 채널에 회의 요약 공유', icon: '💬', connected: INTEGRATIONS.find((i) => i.id === 'slack')?.status === 'connected' },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">내보내기 · 공유</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{meeting.title}</p>
      </div>

      {/* Export targets */}
      <div className="flex flex-col gap-3 mb-6">
        {exportTargets.map((target) => (
          <div key={target.id} className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card">
            <span className="text-2xl">{target.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{target.label}</p>
              <p className="text-mini text-muted-foreground">{target.desc}</p>
            </div>
            {!target.connected ? (
              <div className="flex items-center gap-2">
                <span className="text-mini text-muted-foreground">연동 필요</span>
                <button
                  onClick={() => navigate('/settings/integrations')}
                  className="px-2.5 py-1 rounded border border-border text-mini text-muted-foreground hover:border-foreground transition-colors"
                >
                  연결
                </button>
              </div>
            ) : exported[target.id] ? (
              <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400 font-medium">
                <Check size={13} /> 완료
              </span>
            ) : (
              <button
                onClick={() => handleExport(target.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors"
              >
                <ExternalLink size={12} /> 내보내기
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Next meeting suggestion */}
      <div className="p-4 rounded-xl border border-accent/30 bg-accent-subtle/40">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-accent" />
          <span className="text-sm font-semibold text-accent">AI 다음 회의 일정 제안</span>
        </div>
        <p className="text-sm font-medium text-foreground mb-1">{scheduleSuggestion.title}</p>
        <div className="flex items-center gap-2 text-mini text-muted-foreground mb-3">
          <Calendar size={12} />
          <span>{scheduleSuggestion.suggested}</span>
          <span>·</span>
          <span>{scheduleSuggestion.participants.join(', ')}</span>
        </div>
        <button
          onClick={handleSchedule}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors"
        >
          <Calendar size={13} /> 캘린더에 등록
        </button>
      </div>
    </div>
  )
}
