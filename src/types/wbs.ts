export type WbsStatus = 'todo' | 'inprogress' | 'done' | 'blocked'
export type WbsPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface WbsTask {
  id: string
  epicId?: string
  title: string
  description?: string
  assigneeId?: string
  assigneeName?: string
  priority: WbsPriority
  status: WbsStatus
  dueDate?: string
  progress: number // 0-100
  jiraKey?: string
}

export interface WbsEpic {
  id: string
  title: string
  tasks: WbsTask[]
  progress: number
}
