// src/api/integrations.ts
import { apiFetch } from './client'

export type ServiceName = 'jira' | 'slack' | 'notion' | 'google_calendar' | 'kakao'

export interface IntegrationItem {
  id: number
  service: ServiceName
  is_connected: boolean
  webhook_url: string | null
  updated_at: string
}

export interface IntegrationListResponse {
  integrations: IntegrationItem[]
}

export function getIntegrations(workspaceId: number) {
  return apiFetch<IntegrationListResponse>(
    `/integrations/workspaces/${workspaceId}`
  )
}

export function connectIntegration(
  workspaceId: number,
  service: ServiceName,
  webhookUrl: string
) {
  return apiFetch<IntegrationItem>(
    `/integrations/workspaces/${workspaceId}/${service}/connect`,
    {
      method: 'POST',
      body: JSON.stringify({ webhook_url: webhookUrl }),
    }
  )
}

export function disconnectIntegration(workspaceId: number, service: ServiceName) {
  return apiFetch<IntegrationItem>(
    `/integrations/workspaces/${workspaceId}/${service}/disconnect`,
    { method: 'POST' }
  )
}

export function testWebhook(workspaceId: number, service: ServiceName, webhookUrl: string) {
  return apiFetch<{ success: boolean; message: string }>(
    `/integrations/workspaces/${workspaceId}/${service}/test`,
    {
      method: 'POST',
      body: JSON.stringify({ webhook_url: webhookUrl }),
    }
  )
}
