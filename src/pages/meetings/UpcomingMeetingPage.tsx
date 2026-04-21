import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Calendar, Video, DoorOpen } from 'lucide-react'
import { MEETINGS } from '../../data/mockData'
import { formatTime } from '../../utils/format'

export default function UpcomingMeetingPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const meeting = MEETINGS.find((m) => m.id === meetingId)

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p className="text-sm">회의를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-accent hover:underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    )
  }

  const startDate = new Date(meeting.startAt)
  const diffMs = startDate.getTime() - Date.now()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  const countdownLabel =
    diffMs <= 0
      ? '지금 시작 가능'
      : diffHours > 0
      ? `${diffHours}시간 ${diffMins}분 후`
      : `${diffMins}분 후`

  const dateLabel = startDate.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      {/* 뒤로 가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        뒤로
      </button>

      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full text-mini font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            예정된 회의
          </span>
          <span className="text-mini text-muted-foreground">{countdownLabel}</span>
        </div>
        <h1 className="text-xl font-semibold text-foreground">{meeting.title}</h1>
        {meeting.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meeting.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded text-micro bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 정보 카드 */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 mb-5">
        {/* 날짜 */}
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{dateLabel}</p>
          </div>
        </div>

        {/* 시간 */}
        <div className="flex items-start gap-3">
          <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">{formatTime(meeting.startAt)}</p>
            {meeting.endAt && (
              <p className="text-mini text-muted-foreground mt-0.5">
                ~ {formatTime(meeting.endAt)}
              </p>
            )}
          </div>
        </div>

        {/* 회의실 */}
        {meeting.roomName && (
          <div className="flex items-start gap-3">
            <DoorOpen size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{meeting.roomName}</p>
            </div>
          </div>
        )}

        {/* 참석자 */}
        <div className="flex items-start gap-3">
          <Users size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">
              {meeting.participants.length}명 참석 예정
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meeting.participants.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-mini bg-muted text-foreground"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: p.color, fontSize: '8px', fontWeight: 700 }}
                    aria-hidden="true"
                  >
                    {p.avatarInitials[0]}
                  </span>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/live/${meeting.id}`)}
          className="flex items-center justify-center gap-2 flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Video size={15} />
          회의 입장
        </button>
      </div>

      {/* 수정 링크 */}
      <div className="mt-4 flex items-center justify-end">
        <Link
          to="/meetings/new"
          className="text-mini text-muted-foreground hover:text-foreground transition-colors"
        >
          회의 정보 수정
        </Link>
      </div>
    </div>
  )
}
