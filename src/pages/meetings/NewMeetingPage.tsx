import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Tag } from 'lucide-react'
import { PARTICIPANTS } from '../../data/mockData'
import DatePicker from '../../components/ui/DatePicker'
import TimePicker from '../../components/ui/TimePicker'

const MEETING_TYPES = ['일반 회의', '스프린트 플래닝', '스탠드업', '회고', '브레인스토밍', '투자자 미팅']

export default function NewMeetingPage() {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [meetingType, setMeetingType] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const navigate = useNavigate()

  function getBaseUrl() {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
    if (!base) throw new Error('VITE_API_BASE_URL is not set')
    return base.replace(/\/+$/, '')
  }

  function todayYmd() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function isPastScheduled(nextDate: string, nextTime: string) {
    if (!nextDate || !nextTime) return false
    const dt = new Date(`${nextDate}T${nextTime}:00`)
    return dt.getTime() < Date.now()
  }

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !time) {
      alert('날짜와 시간을 선택해 주세요.')
      return
    }
    if (isPastScheduled(date, time)) {
      alert('현재보다 이전 시간으로 회의를 예약할 수 없습니다.')
      return
    }

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken')

    const body = {
      title,
      meeting_type: meetingType || '일반 회의',
      scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
      participant_ids: selectedParticipants.map((id) => Number(id)).filter((n) => Number.isFinite(n)),
      sync_google_calendar: false,
    }

    const res = await fetch(`${getBaseUrl()}/api/v1/workspaces/1/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      alert(`회의 생성 실패 (${res.status})\n${text}`)
      return
    }

    // success -> go home
    navigate('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">회의 생성 · 예약</h1>
        <p className="text-sm text-muted-foreground mt-0.5">새 회의를 예약하고 아젠다를 설정하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 회의 제목 */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Tag size={14} aria-hidden="true" /> 회의 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: Q2 제품 로드맵 리뷰"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            required
          />
        </div>

        {/* 날짜 & 시간 */}
        <div className="grid grid-cols-2 gap-3">
          {/* DatePicker — 커스텀 달력 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
              날짜
            </label>
            <DatePicker
              value={date}
              onChange={(next) => {
                if (next < todayYmd()) {
                  alert('현재보다 이전 날짜로 회의를 예약할 수 없습니다.')
                  return
                }
                setDate(next)
                // If selecting today and time already set to a past time, reset time.
                if (time && isPastScheduled(next, time)) setTime('')
              }}
              placeholder="날짜 선택"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
              시간
            </label>
            <TimePicker
              value={time}
              onChange={(next) => {
                if (date && isPastScheduled(date, next)) {
                  alert('현재보다 이전 시간으로 회의를 예약할 수 없습니다.')
                  return
                }
                setTime(next)
              }}
              placeholder="시간 선택"
            />
          </div>
        </div>

        {/* 예상 소요 시간 */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">예상 소요 시간</label>
          <div className="flex gap-2 flex-wrap">
            {['30', '60', '90', '120'].map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => setDuration(min)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                  duration === min
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                {min}분
              </button>
            ))}
          </div>
        </div>

        {/* 회의 유형 */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">회의 유형</label>
          <select
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          >
            <option value="">유형 선택 (선택사항)</option>
            {MEETING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 참석자 */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-1.5">
            <Users size={14} aria-hidden="true" /> 참석자
          </label>
          <div className="flex flex-wrap gap-2">
            {PARTICIPANTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleParticipant(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  selectedParticipants.includes(p.id)
                    ? 'border-accent bg-accent-subtle text-accent'
                    : 'border-border text-muted-foreground hover:border-foreground'
                }`}
                aria-pressed={selectedParticipants.includes(p.id)}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-micro"
                  style={{ backgroundColor: p.color }}
                  aria-hidden="true"
                >
                  {p.avatarInitials[0]}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Google Calendar 연동 */}
        <div className="p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">📅 Google Calendar 연동</p>
              <p className="text-mini text-muted-foreground mt-0.5">회의 일정을 캘린더에 자동 등록합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => console.log('TODO: Google Calendar sync')}
              className="px-3 py-1.5 rounded-lg border border-accent text-accent text-mini font-medium hover:bg-accent-subtle transition-colors"
            >
              캘린더 연동
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            회의 생성
          </button>
        </div>
      </form>
    </div>
  )
}
