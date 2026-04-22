export type WorkspaceRole = 'admin' | 'member' | 'viewer' | string

export interface WorkspaceListItem {
  id: number
  name: string
  role: WorkspaceRole
}

interface WorkspaceListResponse {
  success: boolean
  workspaces: WorkspaceListItem[]
  message?: string
}

import { getApiV1BaseUrl } from './baseUrl'

export async function fetchMyWorkspaces(): Promise<WorkspaceListItem[]> {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  const res = await fetch(`${getApiV1BaseUrl()}/workspaces`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Workspaces API failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as WorkspaceListResponse
  return Array.isArray(data.workspaces) ? data.workspaces : []
}

