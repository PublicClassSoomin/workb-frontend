import { apiRequest } from './client'
import type { WbsStatus, WbsPriority } from '../types/wbs'

export interface WbsTaskApi {
  id: number; epic_id: number; title: string
  assignee_id: number | null; assignee_name: string | null; priority: string
  due_date: string | null; progress: number; status: string
}
export interface WbsEpicApi {
  id: number; title: string; order_index: number; tasks: WbsTaskApi[]
}
export interface WbsPageApi { epics: WbsEpicApi[] }

export const toStatus = (s: string): WbsStatus =>
  s === 'in_progress' ? 'inprogress' : s === 'done' ? 'done' : 'todo'

export const fromStatus = (s: WbsStatus): string =>
  s === 'inprogress' || s === 'blocked' ? 'in_progress' : s

export const toPriority = (p: string): WbsPriority =>
  p === 'critical' ? 'urgent' : (['high', 'medium', 'low'].includes(p) ? p as WbsPriority : 'medium')

const u = (m: string | number, w: number, p = '') =>
  `/actions/meetings/${m}/wbs${p}?workspace_id=${w}`

export const getWbs = (m: string | number, w: number) =>
  apiRequest<WbsPageApi>(u(m, w))

export const generateWbs = (m: string | number, w: number) =>
  apiRequest<WbsPageApi>(u(m, w, '/generate'), { method: 'POST' })

export const createEpic = (m: string | number, w: number, title: string, order: number) =>
  apiRequest<WbsEpicApi>(u(m, w, '/epics'), { method: 'POST', body: JSON.stringify({ title, order_index: order }) })

export const createTask = (m: string | number, w: number, epicId: number, title: string) =>
  apiRequest<WbsTaskApi>(u(m, w, '/tasks'), { method: 'POST', body: JSON.stringify({ epic_id: epicId, title }) })

export const patchTask = (m: string | number, w: number, taskId: number, body: object) =>
  apiRequest<WbsTaskApi>(u(m, w, `/tasks/${taskId}`), { method: 'PATCH', body: JSON.stringify(body) })

export const deleteEpic = (m: string | number, w: number, epicId: number) =>
  apiRequest<{ status: string }>(u(m, w, `/epics/${epicId}`), { method: 'DELETE' })

export const deleteTask = (m: string | number, w: number, taskId: number) =>
  apiRequest<{ status: string }>(u(m, w, `/tasks/${taskId}`), { method: 'DELETE' })
