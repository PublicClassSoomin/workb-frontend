import { apiFetch, API_BASE_URL, getAccessToken } from './client'

// ── Slack ─────────────────────────────────────────────────────────────
export interface SlackExportRequest {
  channel_id?: string
  include_action_items?: boolean
  include_reports?: boolean
}

export interface TimeSlot {
  start: string
  end: string
}

export function exportSlack(
  meetingId: string | number,
  workspaceId: number,
  body: SlackExportRequest = {},
) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/export/slack?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function exportGoogleCalendar(meetingId: string | number, workspaceId: number) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/export/google-calendar?workspace_id=${workspaceId}`,
    { method: 'POST' },
  )
}

export function suggestNextMeeting(
  meetingId: string | number,
  workspaceId: number,
  body: { duration_minutes?: number } = {},
) {
  return apiFetch<{ slots: TimeSlot[] }>(
    `/actions/meetings/${meetingId}/next-meeting/suggest?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function registerNextMeeting(
  meetingId: string | number,
  workspaceId: number,
  body: { title: string; scheduled_at: string; participant_ids?: number[] },
) {
  return apiFetch<{ event_id: string }>(
    `/actions/meetings/${meetingId}/next-meeting/register?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify(body) },
  )
}

/**
 * 다음 회의 일정 수정 (구글 캘린더 연동 등)
 */
export function updateNextMeeting(
  meetingId: string | number,
  workspaceId: number,
  eventId: string,
  body: { title?: string; scheduled_at?: string },
) {
  return apiFetch<{ event_id: string }>(
    `/actions/meetings/${meetingId}/next-meeting/${eventId}?workspace_id=${workspaceId}`,
    { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    },
  );
}

/**
 * 다음 회의 일정 삭제
 */
export function deleteNextMeeting(
  meetingId: string | number,
  workspaceId: number,
  eventId: string,
) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/next-meeting/${eventId}?workspace_id=${workspaceId}`,
    { 
      method: 'DELETE' 
    },
  );
}


// ── 회의록 ────────────────────────────────────────────────────────────
export interface MinutesResponse {
  meeting_id: number
  content: string | null
  updated_at: string
}

export function generateMinutes(meetingId: string | number, workspaceId: number) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/minutes/generate?workspace_id=${workspaceId}`,
    { method: 'POST' },
  )
}

export function getMinutes(meetingId: string | number, workspaceId: number) {
  return apiFetch<MinutesResponse>(
    `/actions/meetings/${meetingId}/minutes?workspace_id=${workspaceId}`,
  )
}

export function patchMinutes(
  meetingId: string | number,
  workspaceId: number,
  content: string,
) {
  return apiFetch<MinutesResponse>(
    `/actions/meetings/${meetingId}/minutes?workspace_id=${workspaceId}`,
    { method: 'PATCH', body: JSON.stringify({ content }) },
  )
}

// ── 보고서 ────────────────────────────────────────────────────────────
export interface ReportItem {
  id: number
  format: string
  title: string
  thumbnail_url: string | null
  updated_at: string
}

export function generateReport(
  meetingId: string | number,
  workspaceId: number,
  format: string,
) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/reports/generate?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify({ format }) },
  )
}

export function getReports(meetingId: string | number, workspaceId: number) {
  return apiFetch<ReportItem[]>(
    `/actions/meetings/${meetingId}/reports?workspace_id=${workspaceId}`,
  )
}

export async function downloadReport(
  meetingId: string | number,
  reportId: number,
  workspaceId: number,
  filename: string,
) {
  const token = getAccessToken()
  const url = `${API_BASE_URL}/actions/meetings/${meetingId}/reports/${reportId}/download?workspace_id=${workspaceId}`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('다운로드 실패')
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
