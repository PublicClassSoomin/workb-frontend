import { apiFetch } from './client'

export interface SlackExportRequest {
  channel_id?: string
  include_action_items?: boolean
  include_reports?: boolean
}

export interface TimeSlot {
  start: string
  end: string
}

export function exportSlack(meetingId: string | number, workspaceId: number, body: SlackExportRequest = {}) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/export/slack?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}

export function exportGoogleCalendar(meetingId: string | number, workspaceId: number) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/export/google-calendar?workspace_id=${workspaceId}`,
    { method: 'POST' }
  )
}

export function suggestNextMeeting(meetingId: string | number, body: { duration_minutes?: number } = {}) {
  return apiFetch<{ slots: TimeSlot[] }>(
    `/actions/meetings/${meetingId}/next-meeting/suggest`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}

export function registerNextMeeting(
  meetingId: string | number,
  workspaceId: number,
  body: { title: string; scheduled_at: string; participant_ids?: number[] }
) {
  return apiFetch<{ event_id: string }>(
    `/actions/meetings/${meetingId}/next-meeting/register?workspace_id=${workspaceId}`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}
