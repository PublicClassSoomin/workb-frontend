import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ExternalLink, Calendar, Sparkles, Check, Lock, X, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { MEETINGS } from '../../data/mockData'
import { getIntegrations, type IntegrationItem, type ServiceName } from '../../api/integrations'
import {
  exportSlack,
  exportGoogleCalendar,
  suggestNextMeeting,
  registerNextMeeting,
  type TimeSlot,
} from '../../api/actions'
import { useAuth } from '../../context/AuthContext'
import { getCurrentWorkspaceId } from '../../api/client'

type ToastState = { message: string; type: 'success' | 'error' } | null

export default function ExportPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const workspaceId = getCurrentWorkspaceId()
  const meeting =
    MEETINGS.find((m) => m.id === meetingId) ??
    MEETINGS.find((m) => m.status === 'completed') ??
    MEETINGS[0]

  const [exported, setExported] = useState<Record<string, boolean>>({})
  const [exporting, setExporting] = useState<Record<string, boolean>>({})
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [toast, setToast] = useState<ToastState>(null)

  // Next meeting suggestion flow
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registeredEventId, setRegisteredEventId] = useState<string | null>(null)

  useEffect(() => {
    getIntegrations(workspaceId)
      .then((res) => setIntegrations(res.integrations))
      .catch(console.error)
  }, [workspaceId])

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function isConnected(service: ServiceName) {
    return integrations.find((i) => i.service === service)?.is_connected ?? false
  }

  async function handleExport(targetId: string, label: string) {
    if (!meetingId || !isAdmin) return
    setExporting((prev) => ({ ...prev, [targetId]: true }))
    try {
      if (targetId === 'slack') {
        await exportSlack(meetingId, { include_action_items: true })
      } else if (targetId === 'google-calendar') {
        await exportGoogleCalendar(meetingId, workspaceId)
      }
      setExported((prev) => ({ ...prev, [targetId]: true }))
      showToast(`${label} 내보내기가 완료되었습니다.`)
    } catch {
      showToast('내보내기 실패. 다시 시도해주세요.', 'error')
    } finally {
      setExporting((prev) => ({ ...prev, [targetId]: false }))
    }
  }

  async function handleSuggest() {
    if (!meetingId) return
    setSuggestLoading(true)
    setSlots([])
    setSelectedSlot(null)
    setRegisteredEventId(null)
    try {
      const res = await suggestNextMeeting(meetingId, { duration_minutes: 60 })
      setSlots(res.slots)
      if (res.slots.length === 0) showToast('가능한 시간대가 없습니다. 나중에 다시 시도해주세요.', 'error')
    } catch {
      showToast('일정 제안 실패. 다시 시도해주세요.', 'error')
    } finally {
      setSuggestLoading(false)
    }
  }

  async function handleRegister() {
    if (!meetingId || !selectedSlot || !newMeetingTitle.trim()) return
    setRegistering(true)
    try {
      const res = await registerNextMeeting(meetingId, workspaceId, {
        title: newMeetingTitle,
        scheduled_at: selectedSlot.start,
      })
      setRegisteredEventId(res.event_id)
      showToast('Google Calendar에 일정이 등록되었습니다.')
    } catch {
      showToast('일정 등록 실패. 다시 시도해주세요.', 'error')
    } finally {
      setRegistering(false)
    }
  }

  function formatSlot(slot: TimeSlot) {
    const start = new Date(slot.start)
    const end = new Date(slot.end)
    const date = start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    const startTime = start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    const endTime = end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    return `${date}  ${startTime} — ${endTime}`
  }

  const googleConnected = isConnected('google_calendar')

  const exportTargets = [
    {
      id: 'jira',
      label: 'JIRA 이슈 생성',
      desc: 'WBS 태스크를 JIRA 이슈로 자동 생성',
      icon: '🔵',
      service: 'jira' as ServiceName,
    },
    {
      id: 'excel',
      label: 'Excel 내보내기',
      desc: '회의록·WBS를 엑셀 파일로 다운로드',
      icon: '📊',
      service: null,
    },
    {
      id: 'notion',
      label: 'Notion 내보내기',
      desc: 'Notion 페이지로 자동 저장',
      icon: '📝',
      service: 'notion' as ServiceName,
    },
    {
      id: 'slack',
      label: 'Slack 공유',
      desc: '선택한 채널에 회의 요약 공유',
      icon: '💬',
      service: 'slack' as ServiceName,
    },
    {
      id: 'google-calendar',
      label: 'Google Calendar',
      desc: '회의록을 캘린더 이벤트에 첨부',
      icon: '📅',
      service: 'google_calendar' as ServiceName,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2',
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white',
          )}
        >
          {toast.type === 'success' ? <Check size={15} /> : <X size={15} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">내보내기 · 공유</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{meeting.title}</p>
        {!isAdmin && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
            <Lock size={11} />
            내보내기 기능은 관리자만 실행할 수 있습니다.
          </p>
        )}
      </div>

      {/* Export targets */}
      <div className="flex flex-col gap-3 mb-6">
        {exportTargets.map((target) => {
          const connected = target.service ? isConnected(target.service) : true
          return (
            <div
              key={target.id}
              className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card"
            >
              <span className="text-2xl shrink-0">{target.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{target.label}</p>
                <p className="text-mini text-muted-foreground">{target.desc}</p>
              </div>

              {!connected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-mini text-muted-foreground">연동 필요</span>
                  <button
                    onClick={() => navigate('/settings/integrations')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded border border-border text-mini text-muted-foreground hover:border-foreground transition-colors"
                  >
                    연결 <ChevronRight size={11} />
                  </button>
                </div>
              ) : !isAdmin ? (
                <span className="flex items-center gap-1 text-mini text-muted-foreground shrink-0">
                  <Lock size={11} /> 관리자 전용
                </span>
              ) : exported[target.id] ? (
                <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400 font-medium shrink-0">
                  <Check size={13} /> 완료
                </span>
              ) : (
                <button
                  onClick={() => handleExport(target.id, target.label)}
                  disabled={exporting[target.id]}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <ExternalLink size={12} />
                  {exporting[target.id] ? '전송 중...' : '내보내기'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* AI 다음 회의 일정 제안 */}
      <div className="p-4 rounded-xl border border-accent/30 bg-accent-subtle/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent" />
            <span className="text-sm font-semibold text-accent">AI 다음 회의 일정 제안</span>
          </div>
          {!googleConnected && (
            <span className="text-mini text-muted-foreground">Google Calendar 연동 필요</span>
          )}
        </div>

        {!googleConnected ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Google Calendar를 연동하면 참석자의 빈 시간을 자동으로 찾아 최적의 회의 시간을 제안합니다.
            </p>
            <button
              onClick={() => navigate('/settings/integrations')}
              className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-mini font-medium hover:bg-muted transition-colors"
            >
              <Calendar size={13} /> 연결
            </button>
          </div>
        ) : registeredEventId ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
            <Check size={16} />
            Google Calendar에 다음 회의 일정이 등록되었습니다.
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              Slack 채널 멤버의 가용 시간을 분석해 최적의 회의 시간 3개를 추천합니다.
            </p>

            {slots.length === 0 ? (
              <button
                onClick={handleSuggest}
                disabled={suggestLoading || !isAdmin}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestLoading ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Calendar size={13} />
                    {isAdmin ? '일정 제안 받기' : '관리자 전용'}
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-foreground">추천 시간대를 선택하세요</p>
                <div className="flex flex-col gap-2">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedSlot(slot)
                        setNewMeetingTitle('')
                      }}
                      className={clsx(
                        'flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-sm transition-colors',
                        selectedSlot === slot
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border hover:border-accent/50 hover:bg-muted/40 text-foreground',
                      )}
                    >
                      <Calendar size={13} className="shrink-0" />
                      <span className="flex-1">{formatSlot(slot)}</span>
                      {selectedSlot === slot && <Check size={13} className="shrink-0" />}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newMeetingTitle}
                      onChange={(e) => setNewMeetingTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                      placeholder="다음 회의 제목 입력"
                      className="flex-1 h-9 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    />
                    <button
                      onClick={handleRegister}
                      disabled={registering || !newMeetingTitle.trim()}
                      className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-lg bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? '등록 중...' : '캘린더에 등록'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
