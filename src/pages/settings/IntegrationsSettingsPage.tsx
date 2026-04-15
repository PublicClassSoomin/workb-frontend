import { useState, useEffect } from 'react'
import { Check, Unlink, TestTube } from 'lucide-react'
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  testWebhook,
  type IntegrationItem,
  type ServiceName,
} from '../../api/integrations'

const WORKSPACE_ID = 1 // TODO: auth context에서 가져오기

const SERVICE_META: Record<ServiceName, { name: string; description: string; icon: string }> = {
  jira:            { name: 'JIRA',            description: '이슈 자동 생성 및 WBS 매핑',      icon: '🔵' },
  slack:           { name: 'Slack',           description: '회의 요약 및 액션 아이템 알림',    icon: '💬' },
  notion:          { name: 'Notion',          description: '회의록 자동 내보내기',             icon: '📝' },
  google_calendar: { name: 'Google Calendar', description: '회의 일정 연동 및 자동 등록',      icon: '📅' },
  kakao:           { name: '카카오톡 알림',   description: '회의 요약·액션 아이템 알림 발송',  icon: '💛' },
}

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalService, setModalService] = useState<ServiceName | null>(null)
  const [webhookInput, setWebhookInput] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    getIntegrations(WORKSPACE_ID)
      .then((res) => setIntegrations(res.integrations))
      .finally(() => setLoading(false))
  }, [])

  async function handleConnect() {
    if (!modalService || !webhookInput.trim()) return
    await connectIntegration(WORKSPACE_ID, modalService, webhookInput.trim())
    const res = await getIntegrations(WORKSPACE_ID)
    setIntegrations(res.integrations)
    setModalService(null)
    setWebhookInput('')
    setTestResult(null)
  }

  async function handleDisconnect(service: ServiceName) {
    await disconnectIntegration(WORKSPACE_ID, service)
    const res = await getIntegrations(WORKSPACE_ID)
    setIntegrations(res.integrations)
  }

  async function handleTest() {
    if (!modalService || !webhookInput.trim()) return
    setTestResult('테스트 중...')
    try {
      const res = await testWebhook(WORKSPACE_ID, modalService, webhookInput.trim())
      setTestResult(res.success ? '✅ 연결 성공' : '❌ 연결 실패')
    } catch {
      setTestResult('❌ 연결 실패')
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">연동 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">외부 서비스와의 연동 상태를 관리합니다.</p>

      <div className="flex flex-col gap-4">
        {integrations.map((item) => (
          <IntegrationCard
            key={item.service}
            item={item}
            onConnect={() => {
              setModalService(item.service)
              setWebhookInput(item.webhook_url ?? '')
              setTestResult(null)
            }}
            onDisconnect={() => handleDisconnect(item.service)}
          />
        ))}
      </div>

      {/* Webhook URL 입력 모달 */}
      {modalService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {SERVICE_META[modalService].name} 연결
            </h2>
            <p className="text-mini text-muted-foreground mb-4">
              n8n에서 생성한 webhook URL을 입력하세요.
            </p>
            <input
              type="text"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="http://localhost:5678/webhook/..."
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {testResult && (
              <p className="text-mini text-muted-foreground mb-3">{testResult}</p>
            )}
            <div className="flex items-center gap-2 justify-end mt-3">
              <button
                onClick={() => { setModalService(null); setTestResult(null) }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleTest}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                <TestTube size={13} /> 테스트
              </button>
              <button
                onClick={handleConnect}
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
          {isConnected && item.webhook_url && (
            <p className="text-mini text-muted-foreground mt-1 truncate">
              webhook: {item.webhook_url}
            </p>
          )}
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
            <Check size={13} /> 연결하기
          </button>
        )}
      </div>
    </div>
  )
}
