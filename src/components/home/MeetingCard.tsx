import { Clock, CheckSquare, MessageSquare, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Badge from '../ui/Badge'
import { AvatarGroup } from '../ui/Avatar'
import type { Meeting } from '../../types/meeting'
import { formatRelativeTime, formatTime } from '../../utils/format'

interface MeetingCardProps {
  meeting: Meeting
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const navigate = useNavigate()

  return (
    <article
      onClick={() => navigate(`/meetings/${meeting.id}`)} // TODO: implement meeting detail page
      className={clsx(
        'group flex flex-col gap-2.5 p-3.5 rounded-lg border bg-card cursor-pointer',
        'hover:shadow-card-hover hover:border-accent/25 transition-all duration-quick',
        meeting.status === 'inprogress'
          ? 'border-status-inprogress/25 ring-1 ring-status-inprogress/15'
          : 'border-border',
      )}
    >
      {/* Top row: status badge + time */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant={meeting.status}
          dot={meeting.status === 'inprogress'}
        />
        <span className="text-mini text-muted-foreground flex items-center gap-1">
          <Clock size={11} />
          {meeting.status === 'inprogress'
            ? `진행 중 · ${formatRelativeTime(meeting.startAt)}`
            : meeting.status === 'upcoming'
            ? formatTime(meeting.startAt)
            : formatTime(meeting.startAt)
          }
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">
        {meeting.title}
      </h3>

      {/* Tags */}
      {meeting.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meeting.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-micro bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary (completed only) */}
      {meeting.status === 'completed' && meeting.summary && (
        <p className="text-mini text-muted-foreground line-clamp-2 leading-relaxed">
          {meeting.summary}
        </p>
      )}

      {/* Agenda preview (upcoming) */}
      {meeting.status === 'upcoming' && meeting.agenda && meeting.agenda.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {meeting.agenda.slice(0, 2).map((item, i) => (
            <li key={i} className="flex items-center gap-1.5 text-mini text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
              {item}
            </li>
          ))}
          {meeting.agenda.length > 2 && (
            <li className="text-mini text-muted-foreground/60">+{meeting.agenda.length - 2}개 더</li>
          )}
        </ul>
      )}

      {/* Bottom row: participants + stats */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <AvatarGroup participants={meeting.participants} max={4} />
        <div className="flex items-center gap-3 text-mini text-muted-foreground">
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
          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </article>
  )
}
