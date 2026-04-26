import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Users, ChevronRight, FileText, CalendarDays } from 'lucide-react'
import clsx from 'clsx'

interface MockMeeting {
  id: number
  title: string
  date: string
  duration: number
  attendeeCount: number
  summary: string
}

const MOCK_MEETINGS: MockMeeting[] = [
  {
    id: 1,
    title: '2분기 개발 킥오프 회의',
    date: '2025-04-26T14:00:00',
    duration: 60,
    attendeeCount: 3,
    summary: '2분기 백엔드 개발 일정 및 역할 분담 논의',
  },
  {
    id: 2,
    title: '주간 스프린트 회의 #18',
    date: '2025-04-20T10:00:00',
    duration: 45,
    attendeeCount: 5,
    summary: 'WBS 태스크 점검 및 블로커 논의',
  },
  {
    id: 3,
    title: '서비스 런칭 전략 회의',
    date: '2025-04-15T15:00:00',
    duration: 90,
    attendeeCount: 7,
    summary: '런칭 일정 확정 및 마케팅 전략 수립',
  },
  {
    id: 4,
    title: 'UI/UX 디자인 검토 회의',
    date: '2025-04-10T13:00:00',
    duration: 75,
    attendeeCount: 4,
    summary: '홈 대시보드 와이어프레임 최종 승인',
  },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function MeetingSelectPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  const filtered = MOCK_MEETINGS.filter((m) =>
    m.title.toLowerCase().includes(keyword.toLowerCase()) ||
    m.summary.toLowerCase().includes(keyword.toLowerCase())
  )

  function handleSelect(meeting: MockMeeting) {
    navigate(`/meetings/${meeting.id}/reports?tab=minutes`, {
      state: { meetingTitle: meeting.title, meetingDate: meeting.date },
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText size={15} className="text-accent" />
          <span className="text-mini text-accent font-medium">회의 후 작업</span>
        </div>
        <h1 className="text-xl font-semibold text-foreground">회의 선택</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          회의록·보고서를 작성할 완료된 회의를 선택하세요.
        </p>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-border bg-card mb-5 focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition-all">
        <Search size={14} className="text-muted-foreground shrink-0" />
        <input
          type="search"
          placeholder="회의 제목 또는 내용 검색..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* 회의 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Search size={32} className="opacity-20" />
          <p className="text-sm">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => handleSelect(meeting)}
              className={clsx(
                'group flex items-start gap-4 p-4 rounded-xl border border-border bg-card text-left',
                'hover:border-accent/60 hover:bg-accent/5 hover:shadow-sm transition-all duration-150',
              )}
            >
              {/* 날짜 아이콘 */}
              <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-muted shrink-0">
                <CalendarDays size={18} className="text-muted-foreground mb-0.5" />
                <span className="text-micro text-muted-foreground font-medium">
                  {new Date(meeting.date).getDate()}일
                </span>
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                  {meeting.title}
                </p>
                <p className="text-mini text-muted-foreground mt-0.5 line-clamp-1">
                  {meeting.summary}
                </p>
                <div className="flex items-center gap-3 mt-2 text-mini text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={10} />
                    {formatDate(meeting.date)} {formatTime(meeting.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {meeting.duration}분
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {meeting.attendeeCount}명
                  </span>
                </div>
              </div>

              {/* 화살표 */}
              <ChevronRight
                size={16}
                className="text-muted-foreground shrink-0 mt-3 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
              />
            </button>
          ))}
        </div>
      )}

      {/* 안내 */}
      <p className="text-center text-mini text-muted-foreground mt-6">
        목데이터입니다 — 추후 실제 완료된 회의 목록으로 교체 예정
      </p>
    </div>
  )
}
