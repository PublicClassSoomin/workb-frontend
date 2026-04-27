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
  selected_channel_id?: string
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

// --- Slack 채널 ---
export interface SlackChannel {
  id: string
  name: string
}

export function getSlackChannels(workspaceId: number) {
  return apiFetch<{ channels: SlackChannel[] }>(
    `/integrations/workspaces/${workspaceId}/slack/channels`
  )
}

export function saveSlackChannel(workspaceId: number, channelId: string) {
  return apiFetch<{ status: string }>(
    `/integrations/slack/channel?workspace_id=${workspaceId}`,
    { method: 'PATCH', body: JSON.stringify({ channel_id: channelId }) }
  )
}

// --- Google Calendar events ---
export interface GoogleCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  description?: string | null
  html_link?: string | null
}

export function getGoogleCalendarEvents(
  workspaceId: number,
  timeMin?: string,
  maxResults = 50,
) {
  const params = new URLSearchParams({ workspace_id: String(workspaceId), max_results: String(maxResults) })
  if (timeMin) params.append('time_min', timeMin)
  return apiFetch<{ events: GoogleCalendarEvent[] }>(`/integrations/google/events?${params}`)
}
