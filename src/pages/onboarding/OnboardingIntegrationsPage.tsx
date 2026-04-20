import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  getIntegrations,
  getOAuthUrl,
  connectJira,
  connectKakao,
  disconnectIntegration,
  getSlackChannels,
  saveSlackChannel,
  type IntegrationItem,
  type ServiceName,
  type OAuthService,
  type JiraConnectBody,
  type SlackChannel,
} from '../../api/integrations'

const WORKSPACE_ID = 1 // TODO: auth context에서 가져오기

const OAUTH_SERVICES: OAuthService[] = ['google_calendar', 'slack', 'notion']

const SERVICE_META: Record<ServiceName, { name: string; description: string; icon: string; buttonLabel: string }> = {
  jira:            { name: 'JIRA',            description: '이슈 자동 생성 및 WBS 매핑',      icon: '🔵', buttonLabel: 'API Key 입력' },
  slack:           { name: 'Slack',           description: '회의 요약 및 액션 아이템 알림',    icon: '💬', buttonLabel: 'Slack에 추가'  },
  notion:          { name: 'Notion',          description: '회의록 자동 내보내기',             icon: '📝', buttonLabel: 'Notion 연결'  },
  google_calendar: { name: 'Google Calendar', description: '회의 일정 연동 및 자동 등록',      icon: '📅', buttonLabel: 'Google 연결'  },
  kakao:           { name: '카카오톡 알림',   description: '회의 요약·액션 아이템 알림 발송',  icon: '💛', buttonLabel: 'API Key 입력' },
}

type ModalState = { type: 'jira' } | { type: 'kakao' } | null

export default function OnboardingIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [modal, setModal] = useState<ModalState>(null)
  const [jiraForm, setJiraForm] = useState<JiraConnectBody>({
    domain: '', email: '', api_token: '', project_key: '',
  })
  const [kakaoApiKey, setKakaoApiKey] = useState('')
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([])
  const [channelLoading, setChannelLoading] = useState(false)
  const navigate = useNavigate()

  const refreshList = () =>
    getIntegrations(WORKSPACE_ID).then((res) => {
      setIntegrations(res.integrations)
      const slack = res.integrations.find((i) => i.service === 'slack')
      if (slack?.is_connected) {
        setChannelLoading(true)
        getSlackChannels(WORKSPACE_ID)
          .then((r) => setSlackChannels(r.channels))
          .catch(() => setSlackChannels([]))
          .finally(() => setChannelLoading(false))
      } else {
        setSlackChannels([])
      }
    })

  useEffect(() => {
    // OAuth 콜백 후 리다이렉트 파라미터 처리
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status) {
      window.history.replaceState({}, '', '/onboarding/integrations')
    }
    refreshList()
  }, [])

  async function handleConnect(service: ServiceName) {
    if (OAUTH_SERVICES.includes(service as OAuthService)) {
      const { auth_url } = await getOAuthUrl(service as OAuthService, WORKSPACE_ID)
      window.location.href = auth_url
    } else if (service === 'jira') {
      setJiraForm({ domain: '', email: '', api_token: '', project_key: '' })
      setModal({ type: 'jira' })
    } else if (service === 'kakao') {
      setKakaoApiKey('')
      setModal({ type: 'kakao' })
    }
  }

  async function handleDisconnect(service: ServiceName) {
    await disconnectIntegration(WORKSPACE_ID, service)
    await refreshList()
  }

  async function handleJiraSubmit() {
    if (!jiraForm.domain || !jiraForm.email || !jiraForm.api_token || !jiraForm.project_key) return
    await connectJira(WORKSPACE_ID, jiraForm)
    await refreshList()
    setModal(null)
  }

  async function handleKakaoSubmit() {
    if (!kakaoApiKey.trim()) return
    await connectKakao(WORKSPACE_ID, kakaoApiKey.trim())
    await refreshList()
    setModal(null)
  }

  return (
    <div className="w-full max-w-md">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {['워크스페이스', '연동 설정', '멤버 초대'].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-mini font-bold ${i === 1 ? 'bg-accent text-accent-foreground' : i < 1 ? 'bg-accent/30 text-accent' : 'bg-muted text-muted-foreground'}`}>
              {i < 1 ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-mini flex-1 ${i === 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
            {i < 2 && <div className="w-4 h-px bg-border" />}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">외부 서비스 연동</h1>
      <p className="text-sm text-muted-foreground mb-6">나중에도 설정에서 변경할 수 있습니다.</p>

      <div className="flex flex-col gap-3 mb-6">
        {integrations.map((item) => {
          const meta = SERVICE_META[item.service]
          const isSlack = item.service === 'slack'
          return (
            <div key={item.service} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{meta.name}</p>
                  <p className="text-mini text-muted-foreground">{meta.description}</p>
                </div>
                {item.is_connected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-mini font-medium">
                      <Check size={11} /> 연결됨
                    </span>
                    <button
                      onClick={() => handleDisconnect(item.service)}
                      className="text-mini text-muted-foreground hover:text-foreground"
                    >
                      해제
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(item.service)}
                    className="px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors"
                  >
                    {meta.buttonLabel}
                  </button>
                )}
              </div>

              {/* Slack 채널 선택 */}
              {isSlack && item.is_connected && (
                <div className="mt-2.5 pt-2.5 border-t border-border">
                  <p className="text-mini text-muted-foreground mb-1">기본 전송 채널</p>
                  {channelLoading ? (
                    <p className="text-mini text-muted-foreground">채널 불러오는 중...</p>
                  ) : (
                    <select
                      onChange={(e) => saveSlackChannel(WORKSPACE_ID, e.target.value).catch(console.error)}
                      defaultValue={item.selected_channel_id ?? ""}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="" disabled>채널 선택</option>
                      {slackChannels.map((c) => (
                        <option key={c.id} value={c.id}>#{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => navigate('/onboarding/invite')}
        className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
      >
        다음 → 멤버 초대
      </button>
      <button
        onClick={() => navigate('/onboarding/invite')}
        className="w-full h-9 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
      >
        건너뛰기
      </button>

      {/* JIRA 모달 */}
      {modal?.type === 'jira' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">JIRA 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">Atlassian 계정 정보를 입력하세요.</p>
            <div className="flex flex-col gap-2 mb-4">
              <input type="text" placeholder="도메인 (예: company.atlassian.net)"
                value={jiraForm.domain}
                onChange={(e) => setJiraForm({ ...jiraForm, domain: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input type="email" placeholder="이메일 (Atlassian 계정)"
                value={jiraForm.email}
                onChange={(e) => setJiraForm({ ...jiraForm, email: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input type="password" placeholder="API Token"
                value={jiraForm.api_token}
                onChange={(e) => setJiraForm({ ...jiraForm, api_token: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input type="text" placeholder="프로젝트 키 (예: PROJ)"
                value={jiraForm.project_key}
                onChange={(e) => setJiraForm({ ...jiraForm, project_key: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
                취소
              </button>
              <button onClick={handleJiraSubmit}
                className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 모달 */}
      {modal?.type === 'kakao' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">카카오톡 알림 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">카카오 REST API Key를 입력하세요.</p>
            <input type="password" placeholder="REST API Key"
              value={kakaoApiKey}
              onChange={(e) => setKakaoApiKey(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
                취소
              </button>
              <button onClick={handleKakaoSubmit}
                className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
