import { apiRequest } from './client'

export interface WorkspaceMemberApiItem {
  user_id: number
  name: string
  department?: string | null
  role: string
}

interface WorkspaceMembersResponse {
  success: boolean
  members: WorkspaceMemberApiItem[]
  message?: string
}

export async function fetchWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberApiItem[]> {
  const data = await apiRequest<WorkspaceMembersResponse>(`/workspaces/${workspaceId}/members`)
  return Array.isArray(data.members) ? data.members : []
}
