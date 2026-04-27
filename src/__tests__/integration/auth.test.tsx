import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
}))

const mockRefreshSession = vi.hoisted(() => vi.fn())
const mockSignOut = vi.hoisted(() => vi.fn())

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    refreshSession: mockRefreshSession,
    signOut: mockSignOut,
  }),
}))

import LoginPage from '../../pages/auth/LoginPage'
import { login } from '../../api/auth'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>홈 페이지</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('로그인 플로우 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefreshSession.mockResolvedValue(null)
    mockSignOut.mockResolvedValue(undefined)
  })

  describe('로그인 성공', () => {
    it('관리자로 로그인하면 홈으로 이동합니다', async () => {
      vi.mocked(login).mockResolvedValueOnce({
        access_token: 'fake-token',
        refresh_token: 'fake-refresh',
        token_type: 'bearer',
      })
      mockRefreshSession.mockResolvedValueOnce({ id: 'u1', email: 'admin@test.com', role: 'admin' })

      renderLoginPage()

      await userEvent.type(screen.getByLabelText('이메일'), 'admin@test.com')
      await userEvent.type(screen.getByLabelText('비밀번호'), 'Admin1234')
      await userEvent.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(screen.getByText('홈 페이지')).toBeInTheDocument()
      })
      expect(login).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'Admin1234' })
    })
  })

  describe('로그인 실패', () => {
    it('잘못된 자격증명으로 로그인하면 에러 메시지가 표시됩니다', async () => {
      vi.mocked(login).mockRejectedValueOnce(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'))

      renderLoginPage()

      await userEvent.type(screen.getByLabelText('이메일'), 'wrong@test.com')
      await userEvent.type(screen.getByLabelText('비밀번호'), 'wrong')
      await userEvent.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('멤버 탭', () => {
    it('멤버 탭으로 전환하면 회원가입 링크가 변경됩니다', async () => {
      renderLoginPage()
      await userEvent.click(screen.getByRole('tab', { name: '멤버' }))
      expect(screen.getByText('멤버 회원가입')).toBeInTheDocument()
    })

    it('멤버 탭에서 관리자 계정으로 로그인하면 에러가 표시됩니다', async () => {
      vi.mocked(login).mockResolvedValueOnce({
        access_token: 'fake-token',
        refresh_token: 'fake-refresh',
        token_type: 'bearer',
      })
      mockRefreshSession.mockResolvedValueOnce({ id: 'u1', email: 'admin@test.com', role: 'admin' })

      renderLoginPage()
      await userEvent.click(screen.getByRole('tab', { name: '멤버' }))
      await userEvent.type(screen.getByLabelText('이메일'), 'admin@test.com')
      await userEvent.type(screen.getByLabelText('비밀번호'), 'Admin1234')
      await userEvent.click(screen.getByRole('button', { name: '로그인' }))

      await waitFor(() => {
        expect(screen.getByText('멤버 계정으로 로그인해주세요.')).toBeInTheDocument()
      })
    })
  })

  describe('로딩 상태', () => {
    it('로그인 요청 중에는 버튼이 비활성화됩니다', async () => {
      vi.mocked(login).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000)),
      )

      renderLoginPage()

      await userEvent.type(screen.getByLabelText('이메일'), 'admin@test.com')
      await userEvent.type(screen.getByLabelText('비밀번호'), 'Admin1234')
      await userEvent.click(screen.getByRole('button', { name: '로그인' }))

      expect(screen.getByRole('button', { name: '로그인 중...' })).toBeDisabled()
    })
  })
})
