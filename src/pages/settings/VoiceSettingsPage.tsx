import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle, Mic, Sparkles, Square } from 'lucide-react'
import { getCurrentWorkspaceId } from '../../api/client'
import {
  getSpeakerProfiles,
  registerSpeakerProfile,
  type DiarizationMethod,
  type SpeakerProfileItem,
} from '../../api/speakerProfiles'
import { useAuth } from '../../context/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  admin: '관리자',
  member: '멤버',
  viewer: '뷰어',
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function getAvatarColor(userId: number): string {
  const colors = ['#6b78f6', '#22c55e', '#f97316', '#ec4899', '#eab308', '#14b8a6']
  return colors[userId % colors.length]
}

export default function VoiceSettingsPage() {
  const { isAdmin } = useAuth()
  const [profiles, setProfiles] = useState<SpeakerProfileItem[]>([])
  const [diarizationMethod, setDiarizationMethod] = useState<DiarizationMethod>('diarization')
  const [recordingUserId, setRecordingUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingUserId, setSavingUserId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const workspaceId = getCurrentWorkspaceId()

  useEffect(() => {
    let active = true

    async function loadProfiles() {
      setLoading(true)
      setError('')
      try {
        const rows = await getSpeakerProfiles(workspaceId)
        if (!active) return
        setProfiles(rows)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : '화자 프로필을 불러오지 못했습니다.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfiles()

    return () => {
      active = false
    }
  }, [workspaceId])

  async function saveProfile(userId: number) {
    setError('')
    setMessage('')
    setSavingUserId(userId)
    try {
      const response = await registerSpeakerProfile(workspaceId, userId, diarizationMethod)
      setProfiles((prev) => prev.map((profile) => (
        profile.user_id === response.profile.user_id ? response.profile : profile
      )))
      setMessage(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : '화자 프로필 등록에 실패했습니다.')
    } finally {
      setSavingUserId(null)
      setRecordingUserId(null)
    }
  }

  function handleRecordClick(userId: number) {
    if (recordingUserId === userId) {
      void saveProfile(userId)
      return
    }
    setError('')
    setMessage('')
    setRecordingUserId(userId)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">화자 프로필을 불러오는 중입니다...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles size={14} className="text-accent" />
        <span className="text-mini font-medium text-accent">AI 기능</span>
      </div>
      <h1 className="mb-1 text-xl font-semibold text-foreground">성문(음성) 수집 · 화자 등록</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isAdmin
          ? '관리자는 워크스페이스 멤버의 화자 프로필을 등록할 수 있습니다.'
          : '멤버는 본인 화자 프로필만 등록할 수 있습니다.'}
      </p>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-accent/25 bg-accent-subtle px-3 py-2 text-sm text-accent">
          <CheckCircle size={15} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">화자 분리 방식</h2>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
            <input
              type="radio"
              name="diarization"
              value="stereo"
              checked={diarizationMethod === 'stereo'}
              onChange={() => setDiarizationMethod('stereo')}
              className="mt-0.5 accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-foreground">스테레오 마이크 방식</p>
              <p className="text-mini text-muted-foreground">발화 방향 또는 채널로 화자를 구분합니다.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50">
            <input
              type="radio"
              name="diarization"
              value="diarization"
              checked={diarizationMethod === 'diarization'}
              onChange={() => setDiarizationMethod('diarization')}
              className="mt-0.5 accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-foreground">AI 음성 분석 방식</p>
              <p className="text-mini text-muted-foreground">일반 마이크 녹음 샘플로 화자 프로필을 등록합니다.</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {isAdmin ? '팀원 화자 프로필' : '내 화자 프로필'}
        </h2>
        <div className="flex flex-col gap-2">
          {profiles.map((profile) => {
            const recording = recordingUserId === profile.user_id
            const saving = savingUserId === profile.user_id
            return (
              <div key={profile.user_id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: getAvatarColor(profile.user_id) }}
                    >
                      {getInitial(profile.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
                      <p className="truncate text-mini text-muted-foreground">{profile.email}</p>
                      <p className="text-micro text-muted-foreground">{ROLE_LABELS[profile.role] ?? profile.role}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {profile.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-mini font-medium text-green-600 dark:bg-green-950/30 dark:text-green-400">
                        <CheckCircle size={12} />
                        등록됨
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-mini font-medium text-muted-foreground">
                        <AlertCircle size={12} />
                        미등록
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRecordClick(profile.user_id)}
                      disabled={saving || (recordingUserId !== null && !recording)}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        recording
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-accent text-accent-foreground hover:bg-accent/90'
                      }`}
                    >
                      {recording ? (
                        <>
                          <Square size={13} fill="currentColor" />
                          {saving ? '저장 중...' : '녹음 중지 및 저장'}
                        </>
                      ) : (
                        <>
                          <Mic size={13} />
                          {profile.is_verified ? '재등록' : '등록'}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {recording && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span>음성 샘플 녹음 중입니다. 안내 문장을 5초 이상 읽은 뒤 저장하세요.</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
