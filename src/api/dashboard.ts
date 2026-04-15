import type { Meeting, MeetingStatus, WeeklyStats, Participant } from '../types/meeting'

type BackendMeetingStatus = 'scheduled' | 'in_progress' | 'done'

interface BackendMeetingItem {
  id: number
  title: string
  status: BackendMeetingStatus
  scheduled_at?: string | null
  started_at?: string | null
  ended_at?: string | null
}

interface BackendDashboardResponse {
  meetings: {
    in_progress: BackendMeetingItem[]
    scheduled: BackendMeetingItem[]
    done: BackendMeetingItem[]
  }
  weekly_summary: {
    total_count: number
    total_duration_min: number
    summary_cards: unknown[]
  }
  pending_action_items: {
    id: number
    content: string
    due_date?: string | null
    meeting_title: string
  }[]
  next_meeting_suggestion: null | {
    suggested_at: string
    reason: string
  }
}

const DEFAULT_TOP_PARTICIPANT: Participant = {
  id: 'p0',
  name: '—',
  avatarInitials: '—',
  color: '#64748b',
}

function getBaseUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (!base) throw new Error('VITE_API_BASE_URL is not set')
  return base.replace(/\/+$/, '')
}

function mapStatus(s: BackendMeetingStatus): MeetingStatus {
  if (s === 'in_progress') return 'inprogress'
  if (s === 'scheduled') return 'upcoming'
  return 'completed'
}

function pickStartAt(m: BackendMeetingItem): string {
  return (
    m.started_at ??
    m.scheduled_at ??
    m.ended_at ??
    new Date().toISOString()
  )
}

function toMeeting(m: BackendMeetingItem): Meeting {
  return {
    id: String(m.id),
    title: m.title,
    status: mapStatus(m.status),
    startAt: pickStartAt(m),
    endAt: m.ended_at ?? undefined,
    participants: [],
    agenda: [],
    summary: undefined,
    actionItemCount: 0,
    decisionCount: 0,
    tags: [],
  }
}

export async function fetchWorkspaceDashboard(workspaceId: number) {
  const url = `${getBaseUrl()}/api/v1/workspaces/${workspaceId}/dashboard`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Dashboard API failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as BackendDashboardResponse

  const meetings: Meeting[] = [
    ...data.meetings.in_progress.map(toMeeting),
    ...data.meetings.scheduled.map(toMeeting),
    ...data.meetings.done.map(toMeeting),
  ]

  const weeklyStats: WeeklyStats = {
    totalMeetings: data.weekly_summary.total_count,
    totalMinutes: Math.round(data.weekly_summary.total_duration_min),
    actionItemsTotal: data.pending_action_items.length,
    actionItemsDone: 0,
    topParticipant: DEFAULT_TOP_PARTICIPANT,
  }

  return { raw: data, meetings, weeklyStats }
}

