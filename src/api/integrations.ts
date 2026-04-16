// src/api/integrations.ts
import { apiFetch } from './client'

export type ServiceName = 'jira' | 'slack' | 'notion' | 'google_calendar' | 'kakao'
export type OAuthService = 'google_calendar' | 'slack' | 'notion'
export type ApiKeyService = 'jira' | 'kakao'

export interface IntegrationItem {
  id: number
  service: ServiceName
  is_connected: boolean
  updated_at: string
}

export interface IntegrationListResponse {
  integrations: IntegrationItem[]
}

export interface JiraConnectBody {
  domain: string        // company.atlassian.net
  email: string         // Atlassian 계정 이메일
  api_token: string     // Atlassian API Token
  project_key: string   // 예: PROJ
}

// --- 목록 조회 ---
export function getIntegrations(workspaceId: number) {
  return apiFetch<IntegrationListResponse>(`/integrations/workspaces/${workspaceId}`)
}

// --- OAuth 방식 (Google / Slack / Notion) ---
const OAUTH_PATHS: Record<OAuthService, string> = {
  google_calendar: 'google',
  slack: 'slack',
  notion: 'notion',
}

export function getOAuthUrl(service: OAuthService, workspaceId: number) {
  return apiFetch<{ auth_url: string }>(
    `/integrations/${OAUTH_PATHS[service]}/auth?workspace_id=${workspaceId}`
  )
}

// --- API Key 방식 (JIRA) ---
export function connectJira(workspaceId: number, body: JiraConnectBody) {
  return apiFetch<IntegrationItem>(
    `/integrations/workspaces/${workspaceId}/jira/connect`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}

// --- API Key 방식 (카카오) ---
export function connectKakao(workspaceId: number, apiKey: string) {
  return apiFetch<IntegrationItem>(
    `/integrations/workspaces/${workspaceId}/kakao/connect`,
    { method: 'POST', body: JSON.stringify({ api_key: apiKey }) }
  )
}

// --- 공통 ---
export function disconnectIntegration(workspaceId: number, service: ServiceName) {
  return apiFetch<IntegrationItem>(
    `/integrations/workspaces/${workspaceId}/${service}/disconnect`,
    { method: 'POST' }
  )
}

export function testIntegration(workspaceId: number, service: ServiceName) {
  return apiFetch<{ success: boolean; message: string }>(
    `/integrations/workspaces/${workspaceId}/${service}/test`,
    { method: 'POST' }
  )
}
