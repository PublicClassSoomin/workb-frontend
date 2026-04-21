import { useEffect, useState } from 'react'
import { Check, RefreshCw, Unlink } from 'lucide-react'
import { getCurrentWorkspaceId } from '../../api/client'
import {
  connectIntegration,
  disconnectIntegration,
  getWorkspaceIntegrations,
} from '../../api/integration'
import { INTEGRATIONS } from '../../data/mockIntegrations'
import type { Integration } from '../../types/integrations'

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS.map((integration) => ({
    ...integration,
    status: 'disconnected',
    connectedAs: undefined,
    lastSynced: undefined,
  })))
  const [loading, setLoading] = useState(true)
  const [busyService, setBusyService] = useState<string | null>(null)
  const [error, setError] = useState('')
  const workspaceId = getCurrentWorkspaceId()

  useEffect(() => {
    let active = true

    async function loadIntegrations() {
      setLoading(true)
      setError('')

      try {
        const integrationStatuses = await getWorkspaceIntegrations(workspaceId)
        const statusMap = new Map(
          integrationStatuses.map((item) => [
            item.service.replace('_', '-'),
            item,
          ]),
        )

        if (!active) return
        setIntegrations(INTEGRATIONS.map((integration) => {
          const backend = statusMap.get(integration.id)
          return {
            ...integration,
            status: backend?.is_connected ? 'connected' : 'disconnected',
            lastSynced: backend?.created_at,
            connectedAs: backend?.is_connected ? integration.connectedAs : undefined,
          }
        }))
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

  async function changeConnection(serviceId: string, connected: boolean) {
    setBusyService(serviceId)
    setError('')

    try {
      const response = connected
        ? await connectIntegration(workspaceId, serviceId)
        : await disconnectIntegration(workspaceId, serviceId)

      setIntegrations((prev) => prev.map((integration) => (
        integration.id === response.service.replace('_', '-')
          ? {
              ...integration,
              status: response.is_connected ? 'connected' : 'disconnected',
              lastSynced: response.created_at,
              connectedAs: response.is_connected ? integration.connectedAs ?? '개발 테스트 계정' : undefined,
            }
          : integration
      )))
    } catch (err) {
      setError(err instanceof Error ? err.message : '연동 상태 변경에 실패했습니다.')
    } finally {
      setBusyService(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">연동 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">외부 서비스와의 연동 상태를 관리합니다.</p>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading && <p className="text-sm text-muted-foreground">연동 상태를 불러오는 중입니다...</p>}
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            busy={busyService === integration.id}
            onConnect={() => changeConnection(integration.id, true)}
            onDisconnect={() => changeConnection(integration.id, false)}
          />
        ))}
      </div>
    </div>
  )
}

function IntegrationCard({
  integration,
  busy,
  onConnect,
  onDisconnect,
}: {
  integration: Integration
  busy: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  const isConnected = integration.status === 'connected'

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{integration.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-foreground">{integration.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-micro font-medium ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
              {isConnected ? '연결됨' : '연결 안됨'}
            </span>
          </div>
          <p className="text-mini text-muted-foreground">{integration.description}</p>
          {isConnected && integration.connectedAs && (
            <p className="text-mini text-muted-foreground mt-1">계정: {integration.connectedAs}</p>
          )}
          {isConnected && integration.lastSynced && (
            <p className="text-mini text-muted-foreground">
              마지막 동기화: {new Date(integration.lastSynced).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        {isConnected ? (
          <>
            <button
              disabled
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm text-muted-foreground cursor-not-allowed"
            >
              <RefreshCw size={13} /> 토큰 갱신
            </button>
            <button
              onClick={onDisconnect}
              disabled={busy}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Unlink size={13} /> {busy ? '처리 중...' : '연결 해제'}
            </button>
          </>
        ) : (
          <button
            onClick={onConnect}
            disabled={busy}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Check size={13} /> {busy ? '처리 중...' : '연결'}
          </button>
        )}
      </div>
    </div>
  )
}
