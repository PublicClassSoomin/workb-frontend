import { useState, useEffect, type ReactNode } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Sparkles, FileSpreadsheet, Code, Download, FileText, GitBranch,
  Loader2, Check, Edit2, ChevronDown, ChevronUp, X,
  ArrowLeft, FileBarChart2, Share2, ExternalLink, Lock, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'
import { getCurrentWorkspaceId } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import {
  generateMinutes, getMinutes,
  generateReport, getReports, downloadReport,
  exportSlack, exportGoogleCalendar,
  type MinutesResponse, type ReportItem,
} from '../../api/actions'
import { getIntegrations, type ServiceName } from '../../api/integrations'

// 결과가 나올 때까지 최대 10회 폴링 (간격 1.5s = 최대 15s 대기)
async function pollUntil(
  check: () => Promise<boolean>,
  maxAttempts = 10,
  interval = 1500,
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, interval))
    if (await check()) return true
  }
  return false
}

// ── 탭 정의 ───────────────────────────────────────────────────────────────────
type Tab = 'minutes' | 'reports' | 'export'

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'minutes', label: '회의록', icon: <FileText size={14} /> },
  { id: 'reports', label: '보고서', icon: <FileBarChart2 size={14} /> },
  { id: 'export',  label: '내보내기', icon: <Share2 size={14} /> },
]

// ── 포맷 정의 ─────────────────────────────────────────────────────────────────
type Format = 'markdown' | 'html' | 'excel' | 'wbs'

const FORMAT_OPTIONS: { id: Format; label: string; icon: ReactNode; desc: string }[] = [
  { id: 'markdown', label: 'Markdown', icon: <FileText size={18} />,        desc: '텍스트 기반' },
  { id: 'html',     label: 'HTML',     icon: <Code size={18} />,            desc: '웹 공유용' },
  { id: 'excel',    label: 'Excel',    icon: <FileSpreadsheet size={18} />, desc: '표·데이터' },
  { id: 'wbs',      label: 'WBS',      icon: <GitBranch size={18} />,       desc: '태스크 구조' },
]

const FORMAT_EXT: Record<Format, string> = {
  markdown: 'md', html: 'html', excel: 'xlsx', wbs: 'json',
}

// ── 내보내기 서비스 정의 ──────────────────────────────────────────────────────
const EXPORT_SERVICES = [
  { id: 'slack',            label: 'Slack',           icon: '💬', desc: '선택한 채널에 회의록 공유',       service: 'slack' as ServiceName,            implemented: true },
  { id: 'google-calendar',  label: 'Google Calendar', icon: '📅', desc: '캘린더 이벤트에 회의록 첨부',     service: 'google_calendar' as ServiceName,  implemented: true },
  { id: 'notion',           label: 'Notion',          icon: '📝', desc: 'Notion 페이지로 자동 저장',       service: 'notion' as ServiceName,           implemented: false },
  { id: 'jira',             label: 'JIRA',            icon: '🔵', desc: 'WBS 태스크를 JIRA 이슈로 생성',  service: 'jira' as ServiceName,             implemented: false },
]

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const workspaceId = getCurrentWorkspaceId()
  const { isAdmin } = useAuth()

  const activeTab = (searchParams.get('tab') as Tab) ?? 'minutes'
  const meetingTitle: string = (location.state as { meetingTitle?: string } | null)?.meetingTitle ?? `회의 #${meetingId}`

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setTab(tab: Tab) {
    setSearchParams({ tab }, { replace: true })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white',
        )}>
          {toast.type === 'error' && <X size={13} />}
          {toast.message}
        </div>
      )}

      {/* 헤더 */}
      <div className="border-b border-border bg-card px-4 sm:px-6 pt-4 pb-0 shrink-0">
        <button
          onClick={() => navigate('/meetings/post')}
          className="flex items-center gap-1.5 text-mini text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={12} /> 회의 목록
        </button>

        <div className="mb-3">
          <h1 className="text-lg font-semibold text-foreground truncate">{meetingTitle}</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'minutes' && (
          <MinutesTab meetingId={meetingId!} workspaceId={workspaceId} showToast={showToast} />
        )}
        {activeTab === 'reports' && (
          <ReportsTab meetingId={meetingId!} workspaceId={workspaceId} showToast={showToast} />
        )}
        {activeTab === 'export' && (
          <ExportTab meetingId={meetingId!} workspaceId={workspaceId} isAdmin={isAdmin} showToast={showToast} />
        )}
      </div>
    </div>
  )
}

// ── 회의록 탭 ─────────────────────────────────────────────────────────────────
function MinutesTab({
  meetingId, workspaceId, showToast,
}: {
  meetingId: string; workspaceId: number; showToast: (m: string, t?: 'success' | 'error') => void
}) {
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<MinutesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function load() {
    try {
      const data = await getMinutes(meetingId, workspaceId)
      setMinutes(data)
    } catch {
      setMinutes(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [meetingId])

  async function handleGenerate() {
    setGenerating(true)
    try {
      await generateMinutes(meetingId, workspaceId)
      const ok = await pollUntil(async () => {
        const data = await getMinutes(meetingId, workspaceId).catch(() => null)
        if (data?.content) { setMinutes(data); return true }
        return false
      })
      if (ok) {
        showToast('회의록이 생성되었습니다.')
        setExpanded(true)
      } else {
        showToast('회의록 생성에 실패했습니다. 회의 요약 데이터를 확인해주세요.', 'error')
      }
    } catch {
      showToast('회의록 생성에 실패했습니다.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : !minutes?.content ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <FileText size={22} className="text-accent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-1">회의록이 아직 없습니다</p>
            <p className="text-mini text-muted-foreground">AI가 회의 내용을 분석하여 자동으로 생성합니다.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 h-10 px-6 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {generating
              ? <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
              : <><Sparkles size={14} /> AI 회의록 생성</>
            }
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Check size={13} className="text-green-500" />
              <span className="text-sm font-medium text-foreground">생성 완료</span>
              <span className="text-mini text-muted-foreground">
                · {new Date(minutes.updated_at).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(`/meetings/${meetingId}/notes/edit`)}
                className="flex items-center gap-1 h-7 px-2.5 rounded border border-border text-mini hover:bg-muted transition-colors"
              >
                <Edit2 size={11} /> 편집
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 h-7 px-2.5 rounded border border-border text-mini hover:bg-muted transition-colors"
              >
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {expanded ? '접기' : '내용 보기'}
              </button>
            </div>
          </div>

          {/* 내용 */}
          {expanded ? (
            <div className="px-5 py-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {minutes.content}
              </pre>
            </div>
          ) : (
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {minutes.content?.substring(0, 200)}...
              </p>
              <button
                onClick={() => setExpanded(true)}
                className="mt-2 text-mini text-accent hover:underline"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 보고서 탭 ─────────────────────────────────────────────────────────────────
function ReportsTab({
  meetingId, workspaceId, showToast,
}: {
  meetingId: string; workspaceId: number; showToast: (m: string, t?: 'success' | 'error') => void
}) {
  const [format, setFormat] = useState<Format>('markdown')
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)

  async function load() {
    try {
      const data = await getReports(meetingId, workspaceId)
      setReports(data)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [meetingId])

  async function handleGenerate() {
    setGenerating(true)
    const prevCount = reports.length
    try {
      await generateReport(meetingId, workspaceId, format)
      const ok = await pollUntil(async () => {
        const data = await getReports(meetingId, workspaceId).catch(() => null)
        if (data && data.length > prevCount) { setReports(data); return true }
        return false
      })
      if (ok) {
        showToast(`${FORMAT_OPTIONS.find((o) => o.id === format)?.label} 보고서가 생성되었습니다.`)
      } else {
        showToast('보고서 생성에 실패했습니다. 회의록이 먼저 생성되어야 합니다.', 'error')
      }
    } catch {
      showToast('보고서 생성에 실패했습니다.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDownload(report: ReportItem) {
    setDownloading(report.id)
    try {
      const ext = FORMAT_EXT[report.format as Format] ?? 'txt'
      await downloadReport(meetingId, report.id, workspaceId, `${report.title}.${ext}`)
    } catch {
      showToast('다운로드에 실패했습니다.', 'error')
    } finally {
      setDownloading(null)
    }
  }

  const hasFormat = (fmt: Format) => reports.some((r) => r.format === fmt)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* 포맷 선택 */}
      <div>
        <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-2">포맷 선택</p>
        <div className="grid grid-cols-4 gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFormat(opt.id)}
              className={clsx(
                'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all',
                format === opt.id
                  ? 'border-accent bg-accent/10 text-accent shadow-sm'
                  : 'border-border text-muted-foreground hover:border-foreground/40 hover:bg-muted/30',
              )}
            >
              {hasFormat(opt.id) && (
                <span className="absolute top-1.5 right-1.5">
                  <Check size={10} className="text-green-500" />
                </span>
              )}
              {opt.icon}
              <span className="font-medium">{opt.label}</span>
              <span className="text-micro text-center leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full h-11 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {generating
          ? <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
          : <><Sparkles size={14} /> {FORMAT_OPTIONS.find((o) => o.id === format)?.label} 보고서 생성</>
        }
      </button>

      {/* 생성된 보고서 목록 */}
      <div>
        <p className="text-mini font-medium text-muted-foreground uppercase tracking-wide mb-2">생성된 보고서</p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : reports.length > 0 ? (
          <div className="flex flex-col gap-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card"
              >
                <span className="text-micro font-bold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent uppercase shrink-0">
                  {report.format}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">{report.title}</span>
                <span className="text-mini text-muted-foreground shrink-0">
                  {new Date(report.updated_at).toLocaleDateString('ko-KR')}
                </span>
                <button
                  onClick={() => handleDownload(report)}
                  disabled={downloading === report.id}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border text-mini hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
                >
                  {downloading === report.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Download size={11} />
                  }
                  다운로드
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl border border-dashed border-border">
            <FileBarChart2 size={24} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">포맷을 선택하고 보고서를 생성하세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 내보내기 탭 ───────────────────────────────────────────────────────────────
function ExportTab({
  meetingId, workspaceId, isAdmin, showToast,
}: {
  meetingId: string; workspaceId: number; isAdmin: boolean; showToast: (m: string, t?: 'success' | 'error') => void
}) {
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState<{ service: ServiceName; is_connected: boolean }[]>([])
  const [exporting, setExporting] = useState<Record<string, boolean>>({})
  const [exported, setExported] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getIntegrations(workspaceId)
      .then((res) => setIntegrations(res.integrations))
      .catch(() => setIntegrations([]))
  }, [workspaceId])

  function isConnected(service: ServiceName) {
    return integrations.find((i) => i.service === service)?.is_connected ?? false
  }

  async function handleExport(serviceId: string) {
    if (!isAdmin) return
    setExporting((p) => ({ ...p, [serviceId]: true }))
    try {
      if (serviceId === 'slack') {
        await exportSlack(meetingId, workspaceId, { include_action_items: true, include_reports: true })
      } else if (serviceId === 'google-calendar') {
        await exportGoogleCalendar(meetingId, workspaceId)
      }
      setExported((p) => ({ ...p, [serviceId]: true }))
      showToast('내보내기가 완료되었습니다.')
    } catch {
      showToast('내보내기에 실패했습니다.', 'error')
    } finally {
      setExporting((p) => ({ ...p, [serviceId]: false }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {!isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-mini text-amber-700 dark:text-amber-400">
          <Lock size={11} />
          내보내기 기능은 관리자만 실행할 수 있습니다.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {EXPORT_SERVICES.map((svc) => {
          const connected = isConnected(svc.service)
          const isExporting = exporting[svc.id]
          const isDone = exported[svc.id]

          return (
            <div
              key={svc.id}
              className="flex items-center gap-3.5 p-4 rounded-xl border border-border bg-card"
            >
              <span className="text-2xl shrink-0">{svc.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{svc.label}</p>
                  {!svc.implemented && (
                    <span className="text-micro px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      준비 중
                    </span>
                  )}
                </div>
                <p className="text-mini text-muted-foreground mt-0.5">{svc.desc}</p>
              </div>

              {!svc.implemented ? (
                <span className="text-mini text-muted-foreground shrink-0">준비 중</span>
              ) : !connected ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-mini text-muted-foreground">연동 필요</span>
                  <button
                    onClick={() => navigate('/settings/integrations')}
                    className="flex items-center gap-1 h-7 px-2.5 rounded border border-border text-mini hover:border-foreground transition-colors"
                  >
                    연결 <ChevronRight size={10} />
                  </button>
                </div>
              ) : !isAdmin ? (
                <span className="flex items-center gap-1 text-mini text-muted-foreground shrink-0">
                  <Lock size={10} /> 관리자 전용
                </span>
              ) : isDone ? (
                <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400 font-medium shrink-0">
                  <Check size={12} /> 완료
                </span>
              ) : (
                <button
                  onClick={() => handleExport(svc.id)}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-mini font-medium hover:bg-accent/90 transition-colors disabled:opacity-60 shrink-0"
                >
                  {isExporting
                    ? <><Loader2 size={11} className="animate-spin" /> 전송 중</>
                    : <><ExternalLink size={11} /> 내보내기</>
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 다음 회의 일정 제안 — 링크 */}
      <div
        className="mt-4 p-4 rounded-xl border border-accent/30 bg-accent/5 flex items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors"
        onClick={() => navigate(`/meetings/${meetingId}/export`)}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles size={14} className="text-accent" />
          <div>
            <p className="text-sm font-medium text-accent">AI 다음 회의 일정 제안</p>
            <p className="text-mini text-muted-foreground mt-0.5">참석자 가용 시간 분석 → 최적 일정 3개 추천</p>
          </div>
        </div>
        <ChevronRight size={14} className="text-accent shrink-0" />
      </div>
    </div>
  )
}
