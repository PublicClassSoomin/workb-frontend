import { useEffect, useState } from 'react'
import { Check, Unlink } from 'lucide-react'
import { getCurrentWorkspaceId } from '../../api/client'
import {
  getIntegrations,
  getOAuthUrl,
  connectJira,
  connectKakao,
  disconnectIntegration,
  getSlackChannels,
  saveSlackChannel,
  getGoogleCalendars,
  createGoogleCalendar,
  selectGoogleCalendar,
  type IntegrationItem,
  type ServiceName,
  type OAuthService,
  type JiraConnectBody,
  type SlackChannel,
  type GoogleCalendarItem,
} from '../../api/integrations'

const OAUTH_SERVICES: OAuthService[] = ['google_calendar', 'slack', 'notion']

const SERVICE_META: Record<ServiceName, { name: string; description: string; icon: string; buttonLabel: string }> = {
  jira: { name: 'JIRA', description: '이슈 자동 생성 및 WBS 매핑', icon: '🔵', buttonLabel: 'API Key 입력' },
  slack: { name: 'Slack', description: '회의 요약 및 액션 아이템 알림', icon: '💬', buttonLabel: 'Slack에 추가' },
  notion: { name: 'Notion', description: '회의록 자동 내보내기', icon: '📝', buttonLabel: 'Notion 연결' },
  google_calendar: { name: 'Google Calendar', description: '회의 일정 연동 및 자동 등록', icon: '📅', buttonLabel: 'Google 연결' },
  kakao: { name: '카카오톡 알림', description: '회의 요약·액션 아이템 알림 발송', icon: '💛', buttonLabel: 'API Key 입력' },
}

type ModalState = { type: 'jira' } | { type: 'kakao' } | null

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [googleCalendarModalOpen, setGoogleCalendarModalOpen] = useState(false)
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarItem[]>([])
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleCalendarName, setGoogleCalendarName] = useState('')
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([])
  const [channelLoading, setChannelLoading] = useState(false)
  const [jiraForm, setJiraForm] = useState<JiraConnectBody>({
    domain: '',
    email: '',
    api_token: '',
    project_key: '',
  })
  const [kakaoApiKey, setKakaoApiKey] = useState('')
  const workspaceId = getCurrentWorkspaceId()

  async function refreshList() {
    setError('')
    const response = await getIntegrations(workspaceId)
    setIntegrations(response.integrations)

    const slack = response.integrations.find((integration) => integration.service === 'slack')
    if (slack?.is_connected) {
      setChannelLoading(true)
      getSlackChannels(workspaceId)
        .then((result) => setSlackChannels(result.channels))
        .catch(() => setSlackChannels([]))
        .finally(() => setChannelLoading(false))
    } else {
      setSlackChannels([])
    }
  }

  async function openGoogleCalendarPicker() {
    setGoogleCalendarModalOpen(true)
    setGoogleLoading(true)
    try {
      const res = await getGoogleCalendars(workspaceId)
      setGoogleCalendars(Array.isArray(res.calendars) ? res.calendars : [])
      setError('')
    } catch (err) {
      setGoogleCalendars([])
      setError(err instanceof Error ? err.message : '캘린더 목록을 불러오지 못했습니다.')
    } finally {
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const service = params.get('service') as ServiceName | null

    if (status === 'connected' && service) {
      setSuccessMessage(`${SERVICE_META[service]?.name ?? service} 연동이 완료되었습니다!`)
      window.history.replaceState({}, '', '/settings/integrations')
      setTimeout(() => setSuccessMessage(null), 4000)
      // Google Calendar는 OAuth 직후 캘린더 선택/생성이 필요
      if (service === 'google_calendar') {
        void openGoogleCalendarPicker()
      }
    } else if (status === 'error') {
      setError('연동 중 오류가 발생했습니다. 다시 시도해주세요.')
      window.history.replaceState({}, '', '/settings/integrations')
    }

    refreshList()
      .catch((err) => setError(err instanceof Error ? err.message : '연동 상태를 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [workspaceId])

  async function handleConnect(service: ServiceName) {
    try {
      if (OAUTH_SERVICES.includes(service as OAuthService)) {
        const { auth_url } = await getOAuthUrl(service as OAuthService, workspaceId)
        window.location.href = auth_url
      } else if (service === 'jira') {
        setJiraForm({ domain: '', email: '', api_token: '', project_key: '' })
        setModal({ type: 'jira' })
      } else if (service === 'kakao') {
        setKakaoApiKey('')
        setModal({ type: 'kakao' })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '연동 요청에 실패했습니다.')
    }
  }

  async function handleDisconnect(service: ServiceName) {
    try {
      await disconnectIntegration(workspaceId, service)
      await refreshList()
    } catch (err) {
      setError(err instanceof Error ? err.message : '연동 해제에 실패했습니다.')
    }
  }

  async function handleJiraSubmit() {
    if (!jiraForm.domain || !jiraForm.email || !jiraForm.api_token || !jiraForm.project_key) return
    await connectJira(workspaceId, jiraForm)
    await refreshList()
    setModal(null)
    setSuccessMessage('JIRA 연동이 완료되었습니다!')
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleKakaoSubmit() {
    if (!kakaoApiKey.trim()) return
    await connectKakao(workspaceId, kakaoApiKey.trim())
    await refreshList()
    setModal(null)
    setSuccessMessage('카카오톡 알림 연동이 완료되었습니다!')
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">연동 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">외부 서비스와의 연동 상태를 관리합니다.</p>

      {successMessage && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {integrations.map((item) => (
          <IntegrationCard
            key={item.service}
            item={item}
            onConnect={() => handleConnect(item.service)}
            onDisconnect={() => handleDisconnect(item.service)}
            slackChannels={item.service === 'slack' ? slackChannels : undefined}
            slackSelectedChannelId={item.service === 'slack' ? item.selected_channel_id : undefined}
            channelLoading={item.service === 'slack' ? channelLoading : false}
            onChannelChange={(channelId) => saveSlackChannel(workspaceId, channelId).catch(console.error)}
          />
        ))}
      </div>

      {modal?.type === 'jira' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">JIRA 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">Atlassian 계정 정보를 입력하세요.</p>
            <div className="flex flex-col gap-2 mb-4">
              <input type="text" placeholder="도메인 (예: company.atlassian.net)" value={jiraForm.domain} onChange={(event) => setJiraForm({ ...jiraForm, domain: event.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="email" placeholder="이메일 (Atlassian 계정)" value={jiraForm.email} onChange={(event) => setJiraForm({ ...jiraForm, email: event.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="password" placeholder="API Token" value={jiraForm.api_token} onChange={(event) => setJiraForm({ ...jiraForm, api_token: event.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="text" placeholder="프로젝트 키 (예: PROJ)" value={jiraForm.project_key} onChange={(event) => setJiraForm({ ...jiraForm, project_key: event.target.value })} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setModal(null)} className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
                취소
              </button>
              <button onClick={handleJiraSubmit} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                <Check size={13} /> 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'kakao' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">카카오톡 알림 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">카카오 REST API Key를 입력하세요.</p>
            <input type="password" placeholder="REST API Key" value={kakaoApiKey} onChange={(event) => setKakaoApiKey(event.target.value)} className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent" />
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setModal(null)} className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
                취소
              </button>
              <button onClick={handleKakaoSubmit} className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                <Check size={13} /> 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {googleCalendarModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">Google Calendar 선택</h2>
            <p className="text-mini text-muted-foreground mb-4">
              워크스페이스에서 사용할 캘린더를 선택하거나 새로 생성하세요.
            </p>

            <div className="mb-4">
              <p className="text-mini text-muted-foreground mb-1.5">새 캘린더 생성</p>
              <div className="flex gap-2">
                <input
                  value={googleCalendarName}
                  onChange={(e) => setGoogleCalendarName(e.target.value)}
                  placeholder="예: WorkB - 팀방"
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  disabled={!googleCalendarName.trim() || googleLoading}
                  onClick={async () => {
                    const name = googleCalendarName.trim()
                    if (!name) return
                    setGoogleLoading(true)
                    try {
                      const created = await createGoogleCalendar(workspaceId, name)
                      await selectGoogleCalendar(workspaceId, created.calendar_id)
                      setSuccessMessage('캘린더가 생성/선택되었습니다.')
                      setTimeout(() => setSuccessMessage(null), 3000)
                      setGoogleCalendarModalOpen(false)
                      setGoogleCalendarName('')
                      await refreshList()
                    } catch (err) {
                      setError(err instanceof Error ? err.message : '캘린더 생성에 실패했습니다.')
                    } finally {
                      setGoogleLoading(false)
                    }
                  }}
                  className="h-9 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
                >
                  생성
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-mini text-muted-foreground mb-1.5">기존 캘린더 선택</p>
              {googleLoading ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : googleCalendars.length === 0 ? (
                <p className="text-sm text-muted-foreground">캘린더가 없습니다.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {googleCalendars.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={async () => {
                        setGoogleLoading(true)
                        try {
                          await selectGoogleCalendar(workspaceId, c.id)
                          setSuccessMessage('캘린더가 선택되었습니다.')
                          setTimeout(() => setSuccessMessage(null), 3000)
                          setGoogleCalendarModalOpen(false)
                          await refreshList()
                        } catch (err) {
                          setError(err instanceof Error ? err.message : '캘린더 선택에 실패했습니다.')
                        } finally {
                          setGoogleLoading(false)
                        }
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-muted/40 transition-colors"
                    >
                      <p className="text-sm text-foreground font-medium">
                        {c.summary || '(제목 없음)'}
                        {c.primary ? ' (primary)' : ''}
                      </p>
                      {c.id && <p className="text-mini text-muted-foreground truncate">{c.id}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setGoogleCalendarModalOpen(false)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IntegrationCard({
  item,
  onConnect,
  onDisconnect,
  slackChannels,
  slackSelectedChannelId,
  channelLoading,
  onChannelChange,
}: {
  item: IntegrationItem
  onConnect: () => void
  onDisconnect: () => void
  slackChannels?: SlackChannel[]
  slackSelectedChannelId?: string
  channelLoading?: boolean
  onChannelChange?: (channelId: string) => void
}) {
  const meta = SERVICE_META[item.service]
  const isConnected = item.is_connected

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground">{meta.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-micro font-medium ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {isConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
          <p className="text-mini text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {item.service === 'slack' && isConnected && (
        <div className="mb-3 pt-3 border-t border-border">
          <p className="text-mini text-muted-foreground mb-1.5">기본 전송 채널</p>
          {channelLoading ? (
            <p className="text-mini text-muted-foreground">채널 불러오는 중...</p>
          ) : (
            <select
              onChange={(event) => onChannelChange?.(event.target.value)}
              defaultValue={slackSelectedChannelId ?? ''}
              className="w-full h-8 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="" disabled>채널 선택</option>
              {slackChannels?.map((channel) => (
                <option key={channel.id} value={channel.id}>#{channel.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Unlink size={13} /> 연결 해제
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Check size={13} /> {meta.buttonLabel}
          </button>
        )}
      </div>
    </div>
  )
}
