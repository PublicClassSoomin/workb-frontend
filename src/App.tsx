import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AppShell from './components/layout/AppShell'
import AuthLayout from './components/layout/AuthLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import SignupAdminPage from './pages/auth/SignupAdminPage'
import SignupMemberPage from './pages/auth/SignupMemberPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Onboarding pages
import OnboardingWorkspacePage from './pages/onboarding/OnboardingWorkspacePage'
import OnboardingIntegrationsPage from './pages/onboarding/OnboardingIntegrationsPage'
import OnboardingInvitePage from './pages/onboarding/OnboardingInvitePage'

// App shell pages
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'

// Meeting pages
import NewMeetingPage from './pages/meetings/NewMeetingPage'
import AgendaPage from './pages/meetings/AgendaPage'
import MeetingContextPage from './pages/meetings/MeetingContextPage'
import NotesPage from './pages/meetings/NotesPage'
import NotesEditPage from './pages/meetings/NotesEditPage'
import WbsPage from './pages/meetings/WbsPage'
import ReportsPage from './pages/meetings/ReportsPage'
import ExportPage from './pages/meetings/ExportPage'

// Live pages
import LivePage from './pages/live/LivePage'
import LiveSearchPage from './pages/live/LiveSearchPage'
import LiveScreenPage from './pages/live/LiveScreenPage'
import LiveSpeakersPage from './pages/live/LiveSpeakersPage'

// Settings pages
import WorkspaceSettingsPage from './pages/settings/WorkspaceSettingsPage'
import MembersSettingsPage from './pages/settings/MembersSettingsPage'
import DepartmentsSettingsPage from './pages/settings/DepartmentsSettingsPage'
import VoiceSettingsPage from './pages/settings/VoiceSettingsPage'
import IntegrationsSettingsPage from './pages/settings/IntegrationsSettingsPage'
import DeviceSettingsPage from './pages/settings/DeviceSettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth routes (no AppShell) ─── */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/admin" element={<SignupAdminPage />} />
          <Route path="/signup/member" element={<SignupMemberPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Onboarding routes (no AppShell) ─── */}
        <Route element={<AuthLayout />}>
          <Route path="/onboarding/workspace" element={<OnboardingWorkspacePage />} />
          <Route path="/onboarding/integrations" element={<OnboardingIntegrationsPage />} />
          <Route path="/onboarding/invite" element={<OnboardingInvitePage />} />
        </Route>

        {/* ── App shell routes ─── */}
        <Route path="/" element={<AppShell />}>
          {/* Home */}
          <Route index element={<HomePage />} />

          {/* History */}
          <Route path="history" element={<HistoryPage />} />

          {/* Meeting: create & pre-meeting */}
          <Route path="meetings/new" element={<NewMeetingPage />} />
          <Route path="meetings/context" element={<MeetingContextPage />} />
          <Route path="meetings/:meetingId/agenda" element={<AgendaPage />} />

          {/* Meeting: post-meeting */}
          <Route path="meetings/:meetingId/notes" element={<NotesPage />} />
          <Route path="meetings/:meetingId/notes/edit" element={<NotesEditPage />} />
          <Route path="meetings/:meetingId/wbs" element={<WbsPage />} />
          <Route path="meetings/:meetingId/reports" element={<ReportsPage />} />
          <Route path="meetings/:meetingId/export" element={<ExportPage />} />

          {/* Live */}
          <Route path="live" element={<LivePage />} />
          <Route path="live/:meetingId" element={<LivePage />} />
          <Route path="live/:meetingId/search" element={<LiveSearchPage />} />
          <Route path="live/:meetingId/screen" element={<LiveScreenPage />} />
          <Route path="live/:meetingId/speakers" element={<LiveSpeakersPage />} />

          {/* Settings */}
          <Route path="settings/workspace" element={<WorkspaceSettingsPage />} />
          <Route path="settings/members" element={<MembersSettingsPage />} />
          <Route path="settings/departments" element={<DepartmentsSettingsPage />} />
          <Route path="settings/voice" element={<VoiceSettingsPage />} />
          <Route path="settings/integrations" element={<IntegrationsSettingsPage />} />
          <Route path="settings/device" element={<DeviceSettingsPage />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
