import { useState } from 'react'
import { Check, RefreshCw, Unlink } from 'lucide-react'
import { INTEGRATIONS } from '../../data/mockIntegrations'
import type { Integration } from '../../types/integrations'

export default function IntegrationsSettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS)

  function handleConnect(id: string) {
    // TODO: OAuth connect
    console.log('TODO: connect', id)
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status: 'connected', lastSynced: new Date().toISOString() } : i))
  }

  function handleDisconnect(id: string) {
    // TODO: disconnect
    console.log('TODO: disconnect', id)
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status: 'disconnected', connectedAs: undefined, lastSynced: undefined } : i))
  }

  function handleRefresh(id: string) {
    // TODO: refresh token
    console.log('TODO: refresh token', id)
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, lastSynced: new Date().toISOString() } : i))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">연동 관리</h1>
      <p className="text-sm text-muted-foreground mb-6">외부 서비스와의 연동 상태를 관리합니다.</p>

      <div className="flex flex-col gap-4">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={() => handleConnect(integration.id)}
            onDisconnect={() => handleDisconnect(integration.id)}
            onRefresh={() => handleRefresh(integration.id)}
          />
        ))}
      </div>
    </div>
  )
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onRefresh,
}: {
  integration: Integration
  onConnect: () => void
  onDisconnect: () => void
  onRefresh: () => void
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
              onClick={onRefresh}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
            >
              <RefreshCw size={13} /> 토큰 갱신
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Unlink size={13} /> 연결 해제
            </button>
          </>
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
