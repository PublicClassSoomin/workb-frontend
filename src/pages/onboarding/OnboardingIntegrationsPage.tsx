import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getCurrentWorkspaceId } from '../../api/client'
import {
  connectIntegration,
  disconnectIntegration,
  getWorkspaceIntegrations,
} from '../../api/integration'
import { INTEGRATIONS } from '../../data/mockIntegrations'
import type { IntegrationStatus } from '../../types/integrations'

export default function OnboardingIntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, IntegrationStatus>>(
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, 'disconnected' as IntegrationStatus]))
  )
  const [loading, setLoading] = useState(true)
  const [busyService, setBusyService] = useState<string | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const workspaceId = getCurrentWorkspaceId()

  useEffect(() => {
    let active = true

    async function loadIntegrations() {
      setLoading(true)
      setError('')

      try {
        const integrations = await getWorkspaceIntegrations(workspaceId)
        if (!active) return
        setStatuses(Object.fromEntries(
          integrations.map((integration) => [
            integration.service.replace('_', '-'),
            integration.is_connected ? 'connected' : 'disconnected',
          ]),
        ))
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '연동 상태를 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadIntegrations()

    return () => {
      active = false
    }
  }, [workspaceId])

  async function toggleIntegration(serviceId: string, nextConnected: boolean) {
    setBusyService(serviceId)
    setError('')

    try {
      const response = nextConnected
        ? await connectIntegration(workspaceId, serviceId)
        : await disconnectIntegration(workspaceId, serviceId)

      setStatuses((prev) => ({
        ...prev,
        [response.service.replace('_', '-')]: response.is_connected ? 'connected' : 'disconnected',
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '연동 상태 변경에 실패했습니다.')
    } finally {
      setBusyService(null)
    }
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
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      <div className="flex flex-col gap-3 mb-6">
        {loading && <p className="text-sm text-muted-foreground">연동 상태를 불러오는 중입니다...</p>}
        {INTEGRATIONS.map((integration) => {
          const status = statuses[integration.id]
          return (
            <div key={integration.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <span className="text-2xl">{integration.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{integration.name}</p>
                <p className="text-mini text-muted-foreground">{integration.description}</p>
              </div>
              {status === 'connected' ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-mini font-medium">
                    <Check size={11} /> 연결됨
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleIntegration(integration.id, false)}
                    disabled={busyService === integration.id}
                    className="text-mini text-muted-foreground hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {busyService === integration.id ? '처리 중...' : '해제'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleIntegration(integration.id, true)}
                  disabled={busyService === integration.id}
                  className="px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busyService === integration.id ? '처리 중...' : '연결'}
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
    </div>
  )
}
