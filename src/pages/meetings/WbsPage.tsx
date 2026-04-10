import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, ExternalLink, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { WBS_M1 } from '../../data/mockWbs'
import type { WbsEpic, WbsTask, WbsStatus, WbsPriority } from '../../types/wbs'

const STATUS_STYLES: Record<WbsStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  inprogress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  blocked: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

const STATUS_LABELS: Record<WbsStatus, string> = {
  todo: '할 일',
  inprogress: '진행 중',
  done: '완료',
  blocked: '블록',
}

const PRIORITY_STYLES: Record<WbsPriority, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-muted-foreground',
}

const PRIORITY_LABELS: Record<WbsPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export default function WbsPage() {
  const { meetingId } = useParams()
  const [epics, setEpics] = useState<WbsEpic[]>(WBS_M1)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleEpic(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function updateTaskStatus(epicId: string, taskId: string, status: WbsStatus) {
    setEpics((prev) => prev.map((e) => e.id !== epicId ? e : {
      ...e,
      tasks: e.tasks.map((t) => t.id !== taskId ? t : { ...t, status }),
    }))
    // TODO: sync to JIRA
    console.log('TODO: update JIRA task status', { taskId, status })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">WBS · 태스크 리스트</h1>
          <p className="text-sm text-muted-foreground mt-0.5">회의 ID: {meetingId} · AI 자동 배정 완료</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => console.log('TODO: sync to JIRA')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
          >
            <ExternalLink size={13} /> JIRA 동기화
          </button>
          <button
            onClick={() => console.log('TODO: add epic')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus size={13} /> 에픽 추가
          </button>
        </div>
      </div>

      {/* AI generation banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-subtle border border-accent/20 mb-5">
        <Sparkles size={13} className="text-accent" />
        <p className="text-mini text-accent">AI가 회의 내용을 기반으로 에픽과 태스크를 자동 생성했습니다. 담당자·우선순위·기한이 자동 배정되었습니다.</p>
      </div>

      <div className="flex flex-col gap-4">
        {epics.map((epic) => (
          <div key={epic.id} className="rounded-lg border border-border overflow-hidden bg-card">
            {/* Epic header */}
            <button
              onClick={() => toggleEpic(epic.id)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              {collapsed[epic.id] ? <ChevronRight size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
              <span className="flex-1 text-sm font-semibold text-foreground">{epic.title}</span>
              <div className="flex items-center gap-3 text-mini text-muted-foreground">
                <span>{epic.tasks.length}개 태스크</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${epic.progress}%` }} />
                  </div>
                  <span>{epic.progress}%</span>
                </div>
              </div>
            </button>

            {/* Tasks */}
            {!collapsed[epic.id] && (
              <div>
                {/* Table header — desktop only */}
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2 border-b border-border bg-muted/20 text-micro font-medium text-muted-foreground uppercase tracking-wide">
                  <span>태스크</span>
                  <span>담당자</span>
                  <span>우선순위</span>
                  <span>상태</span>
                  <span>기한</span>
                </div>
                {epic.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onStatusChange={(s) => updateTaskStatus(epic.id, task.id, s)} />
                ))}
                <div className="px-4 py-2 border-t border-border">
                  <button
                    onClick={() => console.log('TODO: add task to epic', epic.id)}
                    className="flex items-center gap-1 text-mini text-muted-foreground hover:text-accent transition-colors"
                  >
                    <Plus size={12} /> 태스크 추가
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskRow({ task, onStatusChange }: { task: WbsTask; onStatusChange: (s: WbsStatus) => void }) {
  return (
    <div className="px-4 py-2.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      {/* Mobile: card layout */}
      <div className="flex flex-col gap-1.5 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-foreground">{task.title}</span>
              {task.jiraKey && (
                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-micro font-mono shrink-0">
                  {task.jiraKey}
                </span>
              )}
            </div>
          </div>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as WbsStatus)}
            className={clsx(
              'text-mini font-medium px-1.5 py-0.5 rounded border-0 outline-none cursor-pointer shrink-0',
              STATUS_STYLES[task.status],
            )}
          >
            {(Object.entries(STATUS_LABELS) as [WbsStatus, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-micro text-muted-foreground">{task.progress}%</span>
          </div>
          {task.assigneeName && <span className="text-mini text-muted-foreground">{task.assigneeName}</span>}
          <span className={clsx('text-mini font-medium', PRIORITY_STYLES[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.dueDate && (
            <span className="text-mini text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground truncate">{task.title}</span>
            {task.jiraKey && (
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-micro font-mono shrink-0">
                {task.jiraKey}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-12 h-1 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-accent" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="text-micro text-muted-foreground">{task.progress}%</span>
          </div>
        </div>
        <span className="text-mini text-muted-foreground whitespace-nowrap">{task.assigneeName ?? '-'}</span>
        <span className={clsx('text-mini font-medium', PRIORITY_STYLES[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </span>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as WbsStatus)}
          className={clsx(
            'text-mini font-medium px-1.5 py-0.5 rounded border-0 outline-none cursor-pointer',
            STATUS_STYLES[task.status],
          )}
        >
          {(Object.entries(STATUS_LABELS) as [WbsStatus, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <span className="text-mini text-muted-foreground whitespace-nowrap">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '-'}
        </span>
      </div>
    </div>
  )
}
