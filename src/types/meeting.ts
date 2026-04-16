export type MeetingStatus = 'inprogress' | 'upcoming' | 'completed'

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export interface Participant {
  id: string
  name: string
  avatarInitials: string
  color: string
  department?: string
}

export interface Department {
  id: string
  name: string
}

export interface ActionItem {
  id: string
  title: string
  assignee: Participant
  dueDate: string
  priority: Priority
  done: boolean
  meetingId: string
  meetingTitle: string
}

export interface Meeting {
  id: string
  title: string
  roomName?: string
  status: MeetingStatus
  startAt: string        // ISO 8601
  endAt?: string
  participants: Participant[]
  agenda?: string[]
  summary?: string
  actionItemCount: number
  decisionCount: number
  tags: string[]
}

export interface WeeklyStats {
  totalMeetings: number
  totalMinutes: number
  actionItemsTotal: number
  actionItemsDone: number
  topParticipant: Participant
}
