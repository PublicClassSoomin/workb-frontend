import type { Meeting } from '../types/meeting'
import { apiRequest } from './client'
import { mapApiMeetingItemToMeeting, type BackendMeetingItem } from './dashboard'

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
  const body = await apiRequest<MeetingDetailResponseBody>(
    `/meetings/workspaces/${workspaceId}/${meetingId}`,
  )
  if (!body.data) {
    throw new Error('Meeting detail API: empty data')
  }
  return mapApiMeetingItemToMeeting(body.data)
}
