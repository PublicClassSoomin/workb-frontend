import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Mic, MicOff, Camera, CameraOff, Square,
  Monitor, Image as ImageIcon, MessageSquare, CheckSquare, Zap,
  X,
} from 'lucide-react'
import LiveScreenPage from '../../pages/live/LiveScreenPage'
import LiveImagePanel from './LiveImagePanel'

import clsx from 'clsx'
import { LIVE_TRANSCRIPT } from '../../data/mockTranscript'
import { MEETINGS } from '../../data/mockData'
import { readMeetingSnapshotForRoute } from '../../utils/meetingRoutes'
import type { Meeting } from '../../types/meeting'
import { endWorkspaceMeeting } from '../../api/meetings'
import { getCurrentWorkspaceId } from '../../utils/workspace'

// ── Panel types ───────────────────────────────────────────────────────────
type MainPanel = 'decisions' | 'actions'
type AuxPanel = 'screen' | 'image' | null

const DEVICE_STORAGE_KEY = 'workb-device-settings'

function getSelectedCameraId(): string | null {
  try {
    const raw = localStorage.getItem(DEVICE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { selectedCameraId?: string }
    const id = parsed?.selectedCameraId
    return typeof id === 'string' && id.trim() ? id : null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const { meetingId = '2' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const stateMeeting = (location.state as { meeting?: Meeting } | null)?.meeting
  const snap = readMeetingSnapshotForRoute(meetingId)
  const meeting = stateMeeting ?? snap ?? (MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[0])

  // Controls
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  // Main right panel (decisions / actions)
  const [mainPanel, setMainPanel] = useState<MainPanel>('decisions')

  // Aux panel (search / screen / speakers) — null = closed
  const [auxPanel, setAuxPanel] = useState<AuxPanel>(null)

  const decisions = LIVE_TRANSCRIPT.filter((u) => u.isDecision)
  const actions = LIVE_TRANSCRIPT.filter((u) => u.isActionItem)

  const elapsedSec = meeting.startAt
    ? Math.max(0, Math.floor((Date.now() - new Date(meeting.startAt).getTime()) / 1000))
    : 0
  const elapsed = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`

  function toggleAux(panel: Exclude<AuxPanel, null>) {
    setAuxPanel((prev) => (prev === panel ? null : panel))
  }

  useEffect(() => {
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('이 브라우저에서는 웹캠을 지원하지 않습니다.')
        return
      }
      setCameraError('')
      const selectedCameraId = getSelectedCameraId()
      try {
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
        cameraStreamRef.current = null
        setCameraStream(null)

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: selectedCameraId ? { deviceId: { exact: selectedCameraId } } : true,
        })
        cameraStreamRef.current = stream
        setCameraStream(stream)
      } catch (e) {
        setCameraError(e instanceof Error ? e.message : '웹캠을 켤 수 없습니다.')
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
        cameraStreamRef.current = null
        setCameraStream(null)
      }
    }

    function stopCamera() {
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop())
      cameraStreamRef.current = null
      setCameraStream(null)
      setCameraError('')
    }

    if (camOn) void startCamera()
    else stopCamera()

    return () => {
      stopCamera()
    }
  }, [camOn])

  // ── Panel content renderers ──────────────────────────────────────────
  function renderMainPanelContent() {
    if (mainPanel === 'decisions') {
      return (
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
      )
    }
    if (mainPanel === 'actions') {
      return (
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
      )
    }
  }

  function renderAuxPanelContent() {
    if (auxPanel === 'screen') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">화면 공유 해석</p>
            <button onClick={() => setAuxPanel(null)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="닫기">
              <X size={15} />
            </button>
          </div>
          {/* compact=true: 패널 안에 맞는 작은 사이즈 */}                                                         
          <LiveScreenPage meetingId={Number(meetingId)} compact />                                               
        </div>
      )
    }
    if (auxPanel === 'image') {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-sm font-semibold text-foreground">이미지</p>
            <button
              onClick={() => setAuxPanel(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <X size={15} />
            </button>
          </div>
          <LiveImagePanel
            workspaceId={getCurrentWorkspaceId()}
            meetingId={Number(meetingId)}
            camOn={camOn}
            stream={cameraStream}
            cameraError={cameraError}
          />
        </div>
      )
    }

    return null
  }

  // ── Render ────────────────────────────────────────────────────────────
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

          {/* Aux panel toggle buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {([
              { id: 'screen' as const, label: '화면공유', Icon: Monitor, title: '화면 공유 분석' },
              { id: 'image' as const, label: '이미지', Icon: ImageIcon, title: '웹캠 캡처' },
            ]).map(({ id, label, Icon, title }) => (
              <button
                key={id}
                onClick={() => toggleAux(id)}
                title={title}
                className={clsx(
                  'flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-mini transition-colors',
                  auxPanel === id
                    ? 'bg-accent-subtle text-accent'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-pressed={auxPanel === id}
              >
                <Icon size={13} /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
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
                // 회의 종료 → 상태를 done으로 전환한 뒤 회의록으로 이동
                const wsid = getCurrentWorkspaceId()
                const numericId = Number(meetingId)
                if (Number.isFinite(numericId) && numericId > 0) {
                  endWorkspaceMeeting(wsid, numericId)
                    .catch(() => {
                      // 실패해도 회의록 화면으로 이동은 허용
                    })
                    .finally(() => {
                      navigate(`/meetings/${meetingId}/notes`)
                    })
                  return
                }
                navigate(`/meetings/${meetingId}/notes`)
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500 text-white text-mini font-medium hover:bg-red-600 transition-colors"
            >
              <Square size={12} fill="currentColor" /> 종료
            </button>
          </div>
        </div>

        {/* Mobile panel tab strip */}
        <div role="tablist" className="lg:hidden flex border-b border-border bg-card shrink-0">
          {([
            { id: 'decisions', label: '결정', icon: CheckSquare },
            { id: 'actions', label: '액션', icon: Zap },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mainPanel === id}
              onClick={() => setMainPanel((prev) => prev === id ? 'decisions' : id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 text-mini font-medium transition-colors border-b-2',
                mainPanel === id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground',
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

          {/* Mobile: main panel content */}
          <div className="lg:hidden border-t border-border bg-card px-3 py-3 mt-4">
            {renderMainPanelContent()}
          </div>
        </div>
      </div>

      {/* ── Aux panel (검색/화면공유/화자) ─────────────────────── */}
      {auxPanel !== null && (
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3">
            {renderAuxPanelContent()}
          </div>
        </aside>
      )}

      {/* ── Main right panel (결정/액션/챗) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border bg-card">
        {/* Panel tabs */}
        <div role="tablist" className="flex border-b border-border shrink-0">
          {([
            { id: 'decisions', label: '결정', icon: CheckSquare },
            { id: 'actions', label: '액션', icon: Zap },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mainPanel === id}
              onClick={() => setMainPanel(id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-mini font-medium transition-colors border-b-2',
                mainPanel === id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {renderMainPanelContent()}
        </div>
      </aside>
    </div>
  )
}
