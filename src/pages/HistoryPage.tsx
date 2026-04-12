import { useState, useMemo } from 'react'
import { Search, User, ChevronDown, MessageSquare, CheckSquare, Clock } from 'lucide-react'
import clsx from 'clsx'
import Badge from '../components/ui/Badge'
import { AvatarGroup } from '../components/ui/Avatar'
import { MEETINGS, PARTICIPANTS } from '../data/mockData'
import type { Meeting } from '../types/meeting'
import { formatDateFull, durationMinutes } from '../utils/format'
import { useNavigate } from 'react-router-dom'

export default function HistoryPage() {
  const [query, setQuery] = useState('')
  const [participantFilter, setParticipantFilter] = useState<string | null>(null)

  // Only show completed + in-progress (not upcoming) in history
  const historyMeetings = MEETINGS.filter((m) => m.status !== 'upcoming')

  const filtered = useMemo(() => {
    return historyMeetings.filter((m) => {
      const matchQuery = query === '' ||
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.tags.some((t) => t.includes(query))

      const matchParticipant = participantFilter === null ||
        m.participants.some((p) => p.id === participantFilter)

      return matchQuery && matchParticipant
    })
  }, [query, participantFilter, historyMeetings])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">

      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">회의 히스토리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          키워드, 참석자 기준으로 이전 회의를 검색할 수 있습니다.
        </p>
      </div>

      {/* Filter bar — sticky */}
      <div className="sticky top-0 z-10 -mx-4 px-4 sm:-mx-6 sm:px-6 py-2.5 mb-4 bg-background border-b border-border flex flex-wrap items-center gap-2">
        {/* Keyword search */}
        <div className="flex items-center gap-2 h-8 px-3 rounded border border-border bg-card flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            type="search"
            placeholder="회의 제목, 태그 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          />
        </div>

        {/* Participant filter */}
        <div className="relative">
          <select
            value={participantFilter ?? ''}
            onChange={(e) => setParticipantFilter(e.target.value || null)}
            className={clsx(
              'appearance-none h-8 pl-8 pr-7 rounded border text-sm bg-card cursor-pointer',
              'border-border hover:border-muted-foreground transition-colors outline-none',
              participantFilter ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <option value="">모든 참석자</option>
            {PARTICIPANTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        {/* Result count */}
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length}개 회의
        </span>
      </div>

      {/* Meeting list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Search size={32} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border border border-border rounded-lg overflow-hidden bg-card">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2 bg-muted/60 text-micro font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            <span>회의 제목</span>
            <span className="text-right">일시</span>
            <span className="text-right">참석자</span>
            <span className="text-right">결과</span>
          </div>

          {filtered.map((meeting) => (
            <MeetingRow key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {/* Chatbot placeholder */}
      <div className="mt-6 mb-6 p-4 rounded-lg border border-dashed border-border bg-muted/20 text-center">
        <MessageSquare size={18} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">챗봇으로 과거 회의 내용 질문하기</p>
        <p className="text-mini text-muted-foreground/70 mt-0.5">
          {/* TODO: implement chatbot panel for history search */}
          예: "지난 달 투자 관련 회의에서 결정된 사항을 알려줘"
        </p>
      </div>
    </div>
  )
}

// ── MeetingRow ────────────────────────────────────────────────────────────
function MeetingRow({ meeting }: { meeting: Meeting }) {
  const navigate = useNavigate()
  const duration = meeting.endAt ? durationMinutes(meeting.startAt, meeting.endAt) : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/meetings/${meeting.id}/notes`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/meetings/${meeting.id}/notes`) } }}
      className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 md:gap-4 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
    >
      {/* Title + tags */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant={meeting.status} dot={meeting.status === 'inprogress'} />
          <h3 className="text-sm font-medium text-foreground truncate">{meeting.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1">
          {meeting.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-micro bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Date + duration */}
      <div className="flex flex-col items-end justify-center gap-0.5 text-right">
        <span className="text-sm text-foreground whitespace-nowrap">
          {formatDateFull(meeting.startAt)}
        </span>
        {duration && (
          <span className="flex items-center gap-1 text-mini text-muted-foreground">
            <Clock size={10} />
            {duration}분
          </span>
        )}
      </div>

      {/* Participants */}
      <div className="flex items-center justify-end">
        <AvatarGroup participants={meeting.participants} max={3} />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-end gap-3 text-mini text-muted-foreground">
        {meeting.actionItemCount > 0 && (
          <span className="flex items-center gap-1">
            <CheckSquare size={11} />
            {meeting.actionItemCount}
          </span>
        )}
        {meeting.decisionCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare size={11} />
            {meeting.decisionCount}
          </span>
        )}
      </div>
    </div>
  )
}
