import type { Meeting } from '../types/meeting'
import { getApiV1BaseUrl } from './baseUrl'
import { mapApiMeetingItemToMeeting, type BackendMeetingItem } from './dashboard'

function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface MeetingDetailResponseBody {
  success: boolean
  data: BackendMeetingItem
  message?: string
}

/**
 * GET /api/v1/meetings/workspaces/{workspaceId}/{meetingId}
 * 홈·캘린더 등에서 숫자 id로 연 회의 상세(예정/진행/완료 공통 스키마).
 */
export async function fetchWorkspaceMeetingDetail(
  workspaceId: number,
  meetingId: number,
): Promise<Meeting> {
  const res = await fetch(
    `${getApiV1BaseUrl()}/meetings/workspaces/${workspaceId}/${meetingId}`,
    { headers: authHeaders() },
  )
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Meeting detail API failed (${res.status}): ${text}`)
  }
  const body = (await res.json()) as MeetingDetailResponseBody
  if (!body.data) {
    throw new Error('Meeting detail API: empty data')
  }
  return mapApiMeetingItemToMeeting(body.data)
}
