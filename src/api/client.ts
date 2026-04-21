<<<<<<< HEAD
// src/api/client.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
=======
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? import.meta.env.VITE_API_URL
  ?? 'http://127.0.0.1:8000/api/v1'
>>>>>>> main

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

interface ApiRequestOptions extends RequestInit {
  skipAuthRefresh?: boolean
}

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
    if (nested && typeof nested === 'object' && 'message' in nested) {
      const message = (nested as { message: unknown }).message
      if (typeof message === 'string') return message
    }
  }

  return 'API 요청에 실패했습니다.'
}

export function getAccessToken(): string | null {
  return localStorage.getItem('workb-access-token')
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('workb-refresh-token')
}

export function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken())
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('workb-access-token', accessToken)
  localStorage.setItem('workb-refresh-token', refreshToken)
  localStorage.setItem('workb-auth-mock', 'true')
}

export function clearAuthTokens(): void {
  localStorage.removeItem('workb-access-token')
  localStorage.removeItem('workb-refresh-token')
  localStorage.removeItem('workb-auth-mock')
}

export function getCurrentWorkspaceId(): number {
  const stored = Number(localStorage.getItem('workb-workspace-id'))
  return Number.isFinite(stored) && stored > 0 ? stored : 1
}

export function setCurrentWorkspaceId(workspaceId: number): void {
  localStorage.setItem('workb-workspace-id', String(workspaceId))
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
