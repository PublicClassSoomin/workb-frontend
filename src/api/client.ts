import { getApiV1BaseUrl } from './baseUrl'

export const API_BASE_URL = getApiV1BaseUrl()

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export type UserRole = 'admin' | 'member' | 'viewer'

export interface StoredUser {
  id: number
  email: string
  name: string
  role: UserRole
  workspace_id: number | null
}

interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean
}

const ACCESS_TOKEN_KEY = 'workb-access-token'
const REFRESH_TOKEN_KEY = 'workb-refresh-token'
const CURRENT_USER_KEY = 'workb-current-user'
const WORKSPACE_ID_KEY = 'workb-workspace-id'

let refreshPromise: Promise<TokenResponse> | null = null

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(formatErrorMessage(detail))
    this.status = status
    this.detail = detail
  }
}

function formatErrorMessage(detail: unknown): string {
  if (typeof detail === 'string') return detail

  if (detail && typeof detail === 'object' && 'detail' in detail) {
    const nested = (detail as { detail: unknown }).detail
    if (typeof nested === 'string') return nested
    if (Array.isArray(nested)) {
      const parts = nested
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg)
          }
          return null
        })
        .filter((x): x is string => Boolean(x))
      if (parts.length) return parts.join(' ')
    }
    if (nested && typeof nested === 'object' && 'message' in nested) {
      const message = (nested as { message: unknown }).message
      if (typeof message === 'string') return message
    }
  }

  return 'API 요청에 실패했습니다.'
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken())
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem('workb-auth-mock', 'true')
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem('workb-auth-mock')
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))

  if (user.workspace_id) {
    setCurrentWorkspaceId(user.workspace_id)
  }
}

export function getCurrentWorkspaceId(): number {
  const stored = Number(localStorage.getItem(WORKSPACE_ID_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : 1
}

export function setCurrentWorkspaceId(workspaceId: number): void {
  localStorage.setItem(WORKSPACE_ID_KEY, String(workspaceId))
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'member' || value === 'viewer'
}

function readStringClaim(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readWorkspaceIdClaim(value: unknown): number | null | undefined {
  if (value === null) return null

  const workspaceId = Number(value)
  return Number.isFinite(workspaceId) && workspaceId > 0 ? workspaceId : undefined
}

export function syncStoredUserFromToken(
  fallback: Partial<StoredUser> = {},
): StoredUser | null {
  const token = getAccessToken()
  if (!token) return getStoredUser()

  const payload = decodeJwtPayload(token)
  const id = Number(payload?.sub ?? fallback.id)
  const role = isUserRole(payload?.role) ? payload.role : fallback.role
  const email = readStringClaim(payload?.email) ?? fallback.email
  const name = readStringClaim(payload?.name) ?? fallback.name
  const workspaceId = readWorkspaceIdClaim(payload?.workspace_id)
    ?? fallback.workspace_id

  if (!Number.isFinite(id) || !role) return getStoredUser()

  const previous = getStoredUser()
  const user: StoredUser = {
    id,
    email: email ?? previous?.email ?? '',
    name: name ?? previous?.name ?? email ?? previous?.email ?? '사용자',
    role,
    workspace_id: workspaceId ?? previous?.workspace_id ?? getCurrentWorkspaceId(),
  }

  setStoredUser(user)
  return user
}

function buildHeaders(
  customHeaders: HeadersInit | undefined,
  token: string | null,
  body: BodyInit | null | undefined,
): Headers {
  const headers = new Headers(customHeaders)

  if (!(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

async function refreshAuthTokens(): Promise<TokenResponse> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearAuthTokens()
    throw new ApiError(401, { detail: '로그인이 필요합니다.' })
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/users/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const detail = await response.json().catch(() => null)
          clearAuthTokens()
          throw new ApiError(response.status, detail)
        }

        const tokens = await response.json() as TokenResponse
        setAuthTokens(tokens.access_token, tokens.refresh_token)
        syncStoredUserFromToken()

        return tokens
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function ensureAuthSession(): Promise<boolean> {
  if (getAccessToken()) return true

  await refreshAuthTokens()
  return true
}

async function fetchApi(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, getAccessToken(), options.body),
  })
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuthRefresh = false, ...requestOptions } = options
  const response = await fetchApi(path, requestOptions)

  if (!response.ok) {
    if (response.status === 401 && !skipAuthRefresh) {
      await refreshAuthTokens()
      return apiRequest<T>(path, {
        ...requestOptions,
        skipAuthRefresh: true,
      })
    }

    const detail = await response.json().catch(() => null)
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function apiFetch<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  return apiRequest<T>(path, options)
}
