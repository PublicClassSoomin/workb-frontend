import { useParams, useNavigate, Link } from 'react-router-dom'
import { Edit2, Share2, CheckSquare, AlertCircle, MessageSquare, Clock, Sparkles } from 'lucide-react'
import { MEETINGS } from '../../data/mockData'
import { COMPLETED_TRANSCRIPT } from '../../data/mockTranscript'
import { AvatarGroup } from '../../components/ui/Avatar'
import { formatDateFull } from '../../utils/format'

const DECISIONS = [
  '홈 대시보드 와이어프레임 승인',
  '사이드바 컬러 시스템 확정 (#5668F3 기반)',
  '다음 스프린트 컴포넌트 구현 착수',
]

const OPEN_ISSUES = [
  '모바일 반응형 레이아웃 검토 필요',
  '다크모드 색상 토큰 세부 조정 미완',
]

const ACTION_ITEMS_NOTES = [
  { id: 'n1', text: 'API 인증 엔드포인트 설계 문서 작성', assignee: '박준혁', due: '2일 후', done: false },
  { id: 'n2', text: '홈 대시보드 컴포넌트 구현', assignee: '김수민', due: '3일 후', done: false },
  { id: 'n3', text: '디자인 시스템 토큰 확정', assignee: '이지현', due: '어제', done: true },
]

export default function NotesPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[4] // m5 = UI/UX 디자인 검토

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-accent" />
            <span className="text-mini text-accent font-medium">AI 자동 생성 회의록</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-mini text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock size={11} /> {formatDateFull(meeting.startAt)}</span>
            <span>{meeting.participants.length}명 참석</span>
            <AvatarGroup participants={meeting.participants} max={4} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(`/meetings/${meetingId}/notes/edit`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            <Edit2 size={13} /> 편집
          </button>
          <button
            onClick={() => navigate(`/meetings/${meetingId}/export`)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            <Share2 size={13} /> 공유
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Summary */}
        {meeting.summary && (
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">요약</h2>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 px-4 py-3 rounded-lg border border-border">
              {meeting.summary}
            </p>
          </section>
        )}

        {/* Decisions */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-500" /> 결정사항
          </h2>
          <ul className="space-y-1.5">
            {DECISIONS.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-micro font-bold shrink-0 mt-0.5">{i + 1}</span>
                {d}
              </li>
            ))}
          </ul>
        </section>

        {/* Open Issues */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertCircle size={15} className="text-yellow-500" /> 미결 이슈
          </h2>
          <ul className="space-y-1.5">
            {OPEN_ISSUES.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                {issue}
              </li>
            ))}
          </ul>
        </section>

        {/* Action items */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <CheckSquare size={15} className="text-green-500" /> 액션 아이템
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">내용</th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">담당자</th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">기한</th>
                  <th className="text-left px-3 py-2 text-mini font-medium text-muted-foreground">상태</th>
                </tr>
              </thead>
              <tbody>
                {ACTION_ITEMS_NOTES.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className={`px-3 py-2.5 ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.text}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{item.assignee}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{item.due}</td>
                    <td className="px-3 py-2.5">
                      {item.done
                        ? <span className="px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-micro font-medium">완료</span>
                        : <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-micro font-medium">진행 중</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Full transcript */}
        <section>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <MessageSquare size={15} className="text-muted-foreground" /> 전문 타임라인
          </h2>
          <div className="flex flex-col gap-2.5">
            {COMPLETED_TRANSCRIPT.map((u) => {
              const mins = String(Math.floor(u.startTime / 60)).padStart(2, '0')
              const secs = String(u.startTime % 60).padStart(2, '0')
              return (
                <div key={u.id} className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-mini font-bold shrink-0"
                    style={{ backgroundColor: u.speakerColor }}
                  >
                    {u.speakerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">{u.speakerName}</span>
                      <span className="text-mini text-muted-foreground">{mins}:{secs}</span>
                      {u.isDecision && (
                        <span className="px-1.5 py-0.5 rounded text-micro bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">결정</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{u.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Link to={`/meetings/${meetingId}/wbs`} className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center">
            WBS 보기
          </Link>
          <Link to={`/meetings/${meetingId}/reports`} className="flex-1 h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5">
            <Sparkles size={14} /> 보고서 생성
          </Link>
        </div>
      </div>
    </div>
  )
}
