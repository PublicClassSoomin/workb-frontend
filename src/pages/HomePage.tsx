<<<<<<< HEAD
import { useEffect, useMemo, useState } from 'react'
=======
import { useState } from 'react'
import { Link } from 'react-router-dom'
>>>>>>> main
import clsx from 'clsx'
import { Sparkles, Calendar } from 'lucide-react'
import MeetingCard from '../components/home/MeetingCard'
import WeeklyStatsCard from '../components/home/WeeklyStats'
import MiniCalendar from '../components/home/MiniCalendar'
import type { MeetingStatus } from '../types/meeting'
import type { Meeting, WeeklyStats } from '../types/meeting'
import { fetchWorkspaceDashboard } from '../api/dashboard'

type Tab = MeetingStatus

const TABS: { id: Tab; label: string }[] = [
  { id: 'inprogress', label: '진행 중' },
  { id: 'upcoming',   label: '예정' },
  { id: 'completed',  label: '완료' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('inprogress')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchWorkspaceDashboard(1)
      .then(({ meetings, weeklyStats }) => {
        if (!mounted) return
        setMeetings(meetings)
        setWeeklyStats(weeklyStats)
        setError(null)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(
    () => meetings.filter((m) => m.status === activeTab),
    [meetings, activeTab],
  )

  return (
    <div className="flex h-full">
      {/* ── Main feed ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

          {/* Page heading */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-foreground">홈</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            {/* AI 추천 일정 제안 — placeholder */}
            <button className="self-start flex items-center gap-1.5 h-8 px-3 rounded border border-accent/40 text-sm text-accent font-medium hover:bg-accent-subtle transition-colors">
              <Sparkles size={13} />
              AI 일정 제안
              {/* TODO: trigger AI meeting scheduling */}
            </button>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="회의 목록 그룹"
            className="flex items-center gap-0.5 mb-4 border-b border-border"
          >
            {TABS.map((tab) => {
              const count = meetings.filter((m) => m.status === tab.id).length
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab.id
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={clsx(
                      'px-1.5 py-0.5 rounded-full text-micro',
                      activeTab === tab.id ? 'bg-accent-subtle text-accent' : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab panel */}
          <div
            role="tabpanel"
            aria-label={`${TABS.find((t) => t.id === activeTab)?.label} 회의 목록`}
          >
            {error && (
              <div className="mb-3 p-3 rounded border border-red-500/20 bg-red-500/5 text-sm text-red-600">
                {error}
              </div>
            )}
            {filtered.length === 0 ? (
              <EmptyState status={activeTab} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filtered.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right aside panel ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-l border-border overflow-y-auto bg-muted/20">
        <div className="sticky top-0 px-4 py-4 flex flex-col gap-4">

          {/* Next meeting callout */}
          <NextMeetingBanner meetings={meetings} />

          {/* Weekly stats */}
          {weeklyStats && <WeeklyStatsCard stats={weeklyStats} />}

          {/* Calendar */}
          <MiniCalendar meetings={meetings} />
        </div>
      </aside>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────

function EmptyState({ status }: { status: Tab }) {
  const msg: Record<Tab, string> = {
    inprogress: '현재 진행 중인 회의가 없습니다.',
    upcoming:   '예정된 회의가 없습니다. 새 회의를 예약해 보세요.',
    completed:  '완료된 회의가 없습니다.',
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      <Calendar size={32} className="text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{msg[status]}</p>
    </div>
  )
}

function NextMeetingBanner({ meetings }: { meetings: Meeting[] }) {
  const next = meetings.find((m) => m.status === 'upcoming')
  if (!next) return null

  const diffMs = new Date(next.startAt).getTime() - Date.now()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const label = diffHours > 0 ? `${diffHours}시간 ${diffMins}분 후` : `${diffMins}분 후`

  return (
    <Link
      to={`/meetings/${next.id}/upcoming`}
      aria-label={`다음 회의: ${next.title} 상세 보기`}
      className="block p-3 rounded-lg bg-accent-subtle border border-accent/20 hover:border-accent/50 hover:bg-accent/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Sparkles size={12} className="text-accent" />
        <span className="text-mini font-medium text-accent">다음 회의</span>
        <span className="ml-auto text-mini text-accent/70">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground line-clamp-1">{next.title}</p>
      <p className="text-mini text-muted-foreground mt-0.5">
        {next.participants.length}명 참석 예정
      </p>
    </Link>
  )
}
