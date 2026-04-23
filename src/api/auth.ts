import {
  apiRequest,
  clearAuthTokens,
  setAuthTokens,
  syncStoredUserFromToken,
  type StoredUser,
} from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AdminSignupPayload {
  email: string
  password: string
  name: string
}

export interface AdminSignupResponse {
  id: number
  email: string
  name: string
  role: 'admin'
  workspace_id: number
  invite_code: string
  welcome_email_sent?: boolean
}

export interface MemberSignupPayload {
  invite_code: string
  email: string
  password: string
  name: string
}

export interface UserResponse {
  id: number
  email: string
  name: string
  role: 'admin' | 'member' | 'viewer'
}

interface MessageResponse {
  message: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export function signupAdmin(payload: AdminSignupPayload): Promise<AdminSignupResponse> {
  return apiRequest<AdminSignupResponse>('/users/signup/admin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function signupMember(payload: MemberSignupPayload): Promise<UserResponse> {
  return apiRequest<UserResponse>('/users/signup/member', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/users/password-change', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function login(
  payload: LoginPayload,
  userFallback: Partial<StoredUser> = {},
): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  setAuthTokens(tokens.access_token, tokens.refresh_token)
  syncStoredUserFromToken({ email: payload.email, ...userFallback })
  return tokens
}

export async function refreshToken(refreshTokenValue: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>('/users/auth/token/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
    body: JSON.stringify({ refresh_token: refreshTokenValue }),
  })
  setAuthTokens(tokens.access_token, tokens.refresh_token)
  syncStoredUserFromToken()
  return tokens
}

export async function logout(refreshTokenValue: string): Promise<void> {
  try {
    await apiRequest<{ message: string }>('/users/logout', {
      method: 'POST',
      skipAuthRefresh: true,
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    })
  } finally {
    clearAuthTokens()
  }
}
