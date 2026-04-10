import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Mic, MicOff, Camera, CameraOff, Square, Search, Monitor, Users, MessageSquare, CheckSquare, Zap } from 'lucide-react'
import clsx from 'clsx'
import { LIVE_TRANSCRIPT } from '../../data/mockTranscript'
import { MEETINGS } from '../../data/mockData'

type PanelTab = 'decisions' | 'actions' | 'chat'

export default function LivePage() {
  const { meetingId = 'm1' } = useParams()
  const navigate = useNavigate()
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[0]
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(false)
  const [panelTab, setPanelTab] = useState<PanelTab>('decisions')
  const [chatInput, setChatInput] = useState('')

  const decisions = LIVE_TRANSCRIPT.filter((u) => u.isDecision)
  const actions = LIVE_TRANSCRIPT.filter((u) => u.isActionItem)

  // Elapsed time mock
  const elapsedSec = meeting.startAt ? Math.floor((Date.now() - new Date(meeting.startAt).getTime()) / 1000) : 0
  const elapsed = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`

  return (
    <div className="flex h-full bg-background">
      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-mini font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              진행 중
            </span>
            <h1 className="text-sm font-medium text-foreground truncate">{meeting.title}</h1>
            <span className="text-mini text-muted-foreground shrink-0">{elapsed}</span>
          </div>

          {/* Live nav links */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Link to={`/live/${meetingId}/search`} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-mini text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="즉석 자료 검색">
              <Search size={13} /><span className="hidden sm:inline">검색</span>
            </Link>
            <Link to={`/live/${meetingId}/screen`} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-mini text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="화면 공유 분석">
              <Monitor size={13} /><span className="hidden sm:inline">화면공유</span>
            </Link>
            <Link to={`/live/${meetingId}/speakers`} className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-mini text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="화자 등록 · 확인">
              <Users size={13} /><span className="hidden sm:inline">화자</span>
            </Link>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMicOn((v) => !v)}
              className={clsx(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                micOn ? 'bg-muted hover:bg-muted-foreground/20' : 'bg-red-500 text-white hover:bg-red-600',
              )}
              aria-label={micOn ? '마이크 끄기' : '마이크 켜기'}
            >
              {micOn ? <Mic size={15} /> : <MicOff size={15} />}
            </button>
            <button
              onClick={() => setCamOn((v) => !v)}
              className={clsx(
                'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                camOn ? 'bg-muted hover:bg-muted-foreground/20' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20',
              )}
              aria-label={camOn ? '카메라 끄기' : '카메라 켜기'}
            >
              {camOn ? <Camera size={15} /> : <CameraOff size={15} />}
            </button>
            <button
              onClick={() => {
                // TODO: stop meeting, trigger post-meeting process
                console.log('TODO: end meeting, trigger notes/WBS generation')
                navigate(`/meetings/${meetingId}/notes`)
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500 text-white text-mini font-medium hover:bg-red-600 transition-colors"
            >
              <Square size={12} fill="currentColor" /> 종료
            </button>
          </div>
        </div>

        {/* Mobile panel tab strip — visible below lg */}
        <div role="tablist" className="lg:hidden flex border-b border-border bg-card shrink-0">
          {([
            { id: 'decisions', label: '결정', icon: CheckSquare },
            { id: 'actions', label: '액션', icon: Zap },
            { id: 'chat', label: 'AI 챗', icon: MessageSquare },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={panelTab === id}
              onClick={() => setPanelTab((prev) => prev === id ? 'decisions' : id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-mini font-medium transition-colors border-b-2',
                panelTab === id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* STT Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={13} className="text-accent" />
              <span className="text-mini font-medium text-muted-foreground uppercase tracking-wide">실시간 STT 발화 스트림</span>
            </div>

            <div className="flex flex-col gap-3">
              {LIVE_TRANSCRIPT.map((utterance) => {
                const mins = String(Math.floor(utterance.startTime / 60)).padStart(2, '0')
                const secs = String(utterance.startTime % 60).padStart(2, '0')
                return (
                  <div key={utterance.id} className={clsx(
                    'flex gap-3 p-3 rounded-lg',
                    utterance.isDecision && 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800',
                    utterance.isActionItem && 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800',
                    !utterance.isDecision && !utterance.isActionItem && 'bg-card border border-border',
                  )}>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-mini font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: utterance.speakerColor }}
                    >
                      {utterance.speakerName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{utterance.speakerName}</span>
                        <span className="text-mini text-muted-foreground">{mins}:{secs}</span>
                        {utterance.isDecision && (
                          <span className="px-1.5 py-0.5 rounded text-micro bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">결정사항</span>
                        )}
                        {utterance.isActionItem && (
                          <span className="px-1.5 py-0.5 rounded text-micro bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 font-medium">액션아이템</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">{utterance.text}</p>
                    </div>
                  </div>
                )
              })}

              {/* Live cursor */}
              <div className="flex gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                  <Mic size={14} className="text-accent animate-pulse" />
                </div>
                <div className="flex-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-mini text-muted-foreground ml-1">인식 중...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile panel content — visible below lg */}
          <div className="lg:hidden border-t border-border bg-card px-3 py-3">
            {panelTab === 'decisions' && (
              <div className="flex flex-col gap-2">
                <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">감지된 결정사항</p>
                {decisions.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold" style={{ backgroundColor: d.speakerColor }}>{d.speakerName[0]}</span>
                      <span className="text-mini font-medium text-foreground">{d.speakerName}</span>
                    </div>
                    <p className="text-mini text-foreground">{d.text}</p>
                  </div>
                ))}
                {decisions.length === 0 && <p className="text-mini text-muted-foreground">아직 감지된 결정사항이 없습니다.</p>}
              </div>
            )}
            {panelTab === 'actions' && (
              <div className="flex flex-col gap-2">
                <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">감지된 액션아이템</p>
                {actions.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold" style={{ backgroundColor: a.speakerColor }}>{a.speakerName[0]}</span>
                      <span className="text-mini font-medium text-foreground">{a.speakerName}</span>
                    </div>
                    <p className="text-mini text-foreground">{a.text}</p>
                  </div>
                ))}
                {actions.length === 0 && <p className="text-mini text-muted-foreground">아직 감지된 액션아이템이 없습니다.</p>}
              </div>
            )}
            {panelTab === 'chat' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="무엇이든 질문하세요..."
                    className="flex-1 bg-transparent outline-none text-mini placeholder:text-muted-foreground"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log('TODO: AI chat', chatInput)
                        setChatInput('')
                      }
                    }}
                  />
                  <button className="text-accent" aria-label="전송"><MessageSquare size={13} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border bg-card">
        {/* Panel tabs */}
        <div role="tablist" className="flex border-b border-border">
          {([
            { id: 'decisions', label: '결정', icon: CheckSquare },
            { id: 'actions', label: '액션', icon: Zap },
            { id: 'chat', label: 'AI 챗', icon: MessageSquare },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={panelTab === id}
              onClick={() => setPanelTab(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-mini font-medium transition-colors border-b-2',
                panelTab === id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {panelTab === 'decisions' && (
            <div className="flex flex-col gap-2">
              <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">실시간 감지된 결정사항</p>
              {decisions.map((d) => (
                <div key={d.id} className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold" style={{ backgroundColor: d.speakerColor }}>{d.speakerName[0]}</span>
                    <span className="text-mini font-medium text-foreground">{d.speakerName}</span>
                  </div>
                  <p className="text-mini text-foreground">{d.text}</p>
                </div>
              ))}
              {decisions.length === 0 && <p className="text-mini text-muted-foreground">아직 감지된 결정사항이 없습니다.</p>}
            </div>
          )}

          {panelTab === 'actions' && (
            <div className="flex flex-col gap-2">
              <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">실시간 감지된 액션아이템</p>
              {actions.map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro font-bold" style={{ backgroundColor: a.speakerColor }}>{a.speakerName[0]}</span>
                    <span className="text-mini font-medium text-foreground">{a.speakerName}</span>
                  </div>
                  <p className="text-mini text-foreground">{a.text}</p>
                </div>
              ))}
              {actions.length === 0 && <p className="text-mini text-muted-foreground">아직 감지된 액션아이템이 없습니다.</p>}
            </div>
          )}

          {panelTab === 'chat' && (
            <div className="flex flex-col gap-2">
              <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-1">AI 챗봇 패널</p>
              <div className="p-2.5 rounded-lg bg-accent-subtle border border-accent/20">
                <p className="text-mini text-accent font-medium mb-1">가능한 기능</p>
                <div className="flex flex-col gap-1">
                  {['현재까지 내용 요약', '인터넷 자료 검색', '회사 DB 조회', '데이터 시각화', '일정 자동 등록'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setChatInput(f)}
                      className="text-left text-mini text-accent/80 hover:text-accent transition-colors"
                    >
                      • {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 p-2 rounded-lg border border-border bg-background">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="무엇이든 질문하세요..."
                  className="flex-1 bg-transparent outline-none text-mini placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // TODO: send to AI
                      console.log('TODO: AI chat', chatInput)
                      setChatInput('')
                    }
                  }}
                />
                <button className="text-accent" aria-label="전송">
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
