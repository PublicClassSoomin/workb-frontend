import { useState, useEffect } from 'react'
import { Check, Unlink } from 'lucide-react'
import {
  getIntegrations,
  getOAuthUrl,
  connectJira,
  connectKakao,
  disconnectIntegration,
  type IntegrationItem,
  type ServiceName,
  type OAuthService,
  type JiraConnectBody,
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

type ModalState =
  | { type: 'jira' }
  | { type: 'kakao' }
  | null

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // JIRA 입력 상태
  const [jiraForm, setJiraForm] = useState<JiraConnectBody>({
    domain: '', email: '', api_token: '', project_key: '',
  })
  // 카카오 입력 상태
  const [kakaoApiKey, setKakaoApiKey] = useState('')

  const refreshList = () =>
    getIntegrations(WORKSPACE_ID).then((res) => setIntegrations(res.integrations))

  useEffect(() => {
    // OAuth 콜백 후 리다이렉트 파라미터 처리
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const service = params.get('service') as ServiceName | null

    if (status === 'connected' && service) {
      setSuccessMessage(`${SERVICE_META[service]?.name ?? service} 연동이 완료되었습니다!`)
      window.history.replaceState({}, '', '/settings/integrations')
      setTimeout(() => setSuccessMessage(null), 4000)
    } else if (status === 'error') {
      setSuccessMessage('연동 중 오류가 발생했습니다. 다시 시도해주세요.')
      window.history.replaceState({}, '', '/settings/integrations')
      setTimeout(() => setSuccessMessage(null), 4000)
    }

    refreshList().finally(() => setLoading(false))
  }, [])

  async function handleConnect(service: ServiceName) {
    if (OAUTH_SERVICES.includes(service as OAuthService)) {
      // OAuth: URL 받아서 리다이렉트
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
    setSuccessMessage('JIRA 연동이 완료되었습니다!')
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleKakaoSubmit() {
    if (!kakaoApiKey.trim()) return
    await connectKakao(WORKSPACE_ID, kakaoApiKey.trim())
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
          ✅ {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {integrations.map((item) => (
          <IntegrationCard
            key={item.service}
            item={item}
            onConnect={() => handleConnect(item.service)}
            onDisconnect={() => handleDisconnect(item.service)}
          />
        ))}
      </div>

      {/* JIRA 모달 */}
      {modal?.type === 'jira' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">JIRA 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">Atlassian 계정 정보를 입력하세요.</p>
            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="도메인 (예: company.atlassian.net)"
                value={jiraForm.domain}
                onChange={(e) => setJiraForm({ ...jiraForm, domain: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="email"
                placeholder="이메일 (Atlassian 계정)"
                value={jiraForm.email}
                onChange={(e) => setJiraForm({ ...jiraForm, email: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="password"
                placeholder="API Token"
                value={jiraForm.api_token}
                onChange={(e) => setJiraForm({ ...jiraForm, api_token: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="프로젝트 키 (예: PROJ)"
                value={jiraForm.project_key}
                onChange={(e) => setJiraForm({ ...jiraForm, project_key: e.target.value })}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleJiraSubmit}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Check size={13} /> 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 모달 */}
      {modal?.type === 'kakao' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">카카오톡 알림 연결</h2>
            <p className="text-mini text-muted-foreground mb-4">카카오 REST API Key를 입력하세요.</p>
            <input
              type="password"
              placeholder="REST API Key"
              value={kakaoApiKey}
              onChange={(e) => setKakaoApiKey(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setModal(null)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleKakaoSubmit}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Check size={13} /> 저장
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
}: {
  item: IntegrationItem
  onConnect: () => void
  onDisconnect: () => void
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
