import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
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

export default function OnboardingIntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [modalService, setModalService] = useState<ServiceName | null>(null)
  const [webhookInput, setWebhookInput] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getIntegrations(WORKSPACE_ID).then((res) => setIntegrations(res.integrations))
  }, [])

  async function handleConnect() {
    if (!modalService || !webhookInput.trim()) return
    await connectIntegration(WORKSPACE_ID, modalService, webhookInput.trim())
    const res = await getIntegrations(WORKSPACE_ID)
    setIntegrations(res.integrations)
    setModalService(null)
    setWebhookInput('')
  }

  async function handleDisconnect(service: ServiceName) {
    await disconnectIntegration(WORKSPACE_ID, service)
    const res = await getIntegrations(WORKSPACE_ID)
    setIntegrations(res.integrations)
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
          return (
            <div key={item.service} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
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
                  onClick={() => { setModalService(item.service); setWebhookInput('') }}
                  className="px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors"
                >
                  연결
                </button>
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

      {/* Webhook URL 입력 모달 */}
      {modalService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm mx-4">
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
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setModalService(null)}
                className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConnect}
                className="h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
