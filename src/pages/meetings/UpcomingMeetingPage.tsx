import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Calendar, Video, ChevronRight } from 'lucide-react'
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

  const canJoin = diffMs <= 10 * 60 * 1000 // 10분 전부터 입장 가능

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

      {/* 아젠다 */}
      {meeting.agenda && meeting.agenda.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">아젠다</h2>
          <ol className="flex flex-col gap-2">
            {meeting.agenda.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent-subtle text-accent text-micro font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(`/meetings/${meeting.id}/agenda`)}
          className="flex items-center justify-center gap-2 flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          아젠다 수정
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => navigate(`/live/${meeting.id}`)}
          disabled={!canJoin}
          className={`flex items-center justify-center gap-2 flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
            canJoin
              ? 'bg-accent text-accent-foreground hover:bg-accent/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          title={canJoin ? '회의 입장' : '회의 시작 10분 전부터 입장 가능합니다'}
        >
          <Video size={15} />
          {canJoin ? '회의 입장' : `${countdownLabel} 후 입장 가능`}
        </button>
      </div>

      {/* 수정 링크 */}
      <div className="mt-4 flex items-center justify-end">
        <Link
          to={`/meetings/new`}
          className="text-mini text-muted-foreground hover:text-foreground transition-colors"
        >
          회의 정보 수정
        </Link>
      </div>
    </div>
  )
}
