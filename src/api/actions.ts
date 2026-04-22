import { apiFetch } from './client'

export interface SlackExportRequest {
  channel_id?: string
  include_action_items?: boolean
}

export function exportSlack(meetingId: string | number, body: SlackExportRequest = {}) {
  return apiFetch<{ status: string }>(
    `/actions/meetings/${meetingId}/export/slack`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}
