import { apiRequest } from './client'

export type UserRole = 'admin' | 'member' | 'viewer'

export interface WorkspaceResponse {
  workspace_id: number
  name: string
  invite_code: string
  industry: string | null
  default_language: string | null
  summary_style: string | null
  logo_url: string | null
}

export interface WorkspaceUpdatePayload {
  name?: string
  industry?: string | null
  default_language?: string | null
  summary_style?: string | null
  logo_url?: string | null
}

export interface WorkspaceMember {
  user_id: number
  name: string
  email: string
  role: UserRole
  department_id: number | null
  department: string | null
}

export interface Department {
  department_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface InviteCodeIssueResponse {
  workspace_id: number
  invite_code: string
}

export interface InviteCodeValidateResponse {
  valid: boolean
  workspace_id: number
  workspace_name: string
}

export function getWorkspace(workspaceId: number): Promise<WorkspaceResponse> {
  return apiRequest<WorkspaceResponse>(`/workspaces/${workspaceId}`)
}

export function updateWorkspace(
  workspaceId: number,
  payload: WorkspaceUpdatePayload,
): Promise<WorkspaceResponse> {
  return apiRequest<WorkspaceResponse>(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function issueInviteCode(workspaceId: number): Promise<InviteCodeIssueResponse> {
  return apiRequest<InviteCodeIssueResponse>(`/workspaces/${workspaceId}/invite-codes`, {
    method: 'POST',
  })
}

export function validateInviteCode(inviteCode: string): Promise<InviteCodeValidateResponse> {
  return apiRequest<InviteCodeValidateResponse>('/workspaces/invite-codes/validate', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode }),
  })
}

export async function getWorkspaceMembers(
  workspaceId: number,
  departmentId?: number,
): Promise<WorkspaceMember[]> {
  const search = departmentId ? `?department_id=${departmentId}` : ''
  const response = await apiRequest<{ members: WorkspaceMember[] }>(
    `/workspaces/${workspaceId}/members${search}`,
  )
  return response.members
}

export async function updateMemberRole(
  workspaceId: number,
  userId: number,
  role: UserRole,
): Promise<{ user_id: number; role: UserRole }> {
  return apiRequest<{ user_id: number; role: UserRole }>(
    `/workspaces/${workspaceId}/members/${userId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  )
}

export async function updateMemberDepartment(
  workspaceId: number,
  userId: number,
  departmentId: number | null,
): Promise<{ user_id: number; department_id: number | null; department: string | null }> {
  return apiRequest<{ user_id: number; department_id: number | null; department: string | null }>(
    `/workspaces/${workspaceId}/members/${userId}/department`,
    {
      method: 'PATCH',
      body: JSON.stringify({ department_id: departmentId }),
    },
  )
}

export async function getDepartments(workspaceId: number): Promise<Department[]> {
  const response = await apiRequest<{ departments: Department[] }>(
    `/workspaces/${workspaceId}/departments`,
  )
  return response.departments
}

export function createDepartment(workspaceId: number, name: string): Promise<Department> {
  return apiRequest<Department>(`/workspaces/${workspaceId}/departments`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateDepartment(
  workspaceId: number,
  departmentId: number,
  name: string,
): Promise<Department> {
  return apiRequest<Department>(`/workspaces/${workspaceId}/departments/${departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteDepartment(workspaceId: number, departmentId: number): Promise<void> {
  return apiRequest<void>(`/workspaces/${workspaceId}/departments/${departmentId}`, {
    method: 'DELETE',
  })
}
