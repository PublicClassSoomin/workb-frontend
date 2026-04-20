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

function getBaseUrl() {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (!base) throw new Error('VITE_API_BASE_URL is not set')
  return base.replace(/\/+$/, '')
}

export async function fetchWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberApiItem[]> {
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  const res = await fetch(`${getBaseUrl()}/api/v1/workspaces/${workspaceId}/members`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Workspace members API failed (${res.status}): ${text}`)
  }
  const data = (await res.json()) as WorkspaceMembersResponse
  return Array.isArray(data.members) ? data.members : []
}

