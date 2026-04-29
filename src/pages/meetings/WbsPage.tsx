import { useState, useEffect, Fragment } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import {
  Plus, ExternalLink, ChevronDown, ChevronRight,
  Sparkles, Loader2, Trash2,
  CheckCircle2, Clock3, Ban, Circle, Pencil,
} from 'lucide-react'
import clsx from 'clsx'
import { getCurrentWorkspaceId } from '../../api/client'
import {
  getWbs, generateWbs, createEpic, createTask,
  patchEpic, patchTask, deleteEpic, deleteTask,
  toStatus, fromStatus, toPriority,
  type WbsEpicApi,
} from '../../api/wbs'
import type { WbsEpic, WbsStatus, WbsPriority } from '../../types/wbs'

const PRIORITY_MAP: Record<WbsPriority, { label: string; cls: string }> = {
  urgent: { label: '긴급', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high:   { label: '높음', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { label: '보통', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low:    { label: '낮음', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

const STATUS_MAP: Record<WbsStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  todo:       { label: '할 일',   cls: 'bg-muted text-muted-foreground',                                icon: <Circle size={10} /> },
  inprogress: { label: '진행 중', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',   icon: <Clock3 size={10} /> },
  done:       { label: '완료',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle2 size={10} /> },
  blocked:    { label: '블록',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',    icon: <Ban size={10} /> },
}

function StatusSelect({ status, onChange }: { status: WbsStatus; onChange: (s: WbsStatus) => void }) {
  const { label, cls, icon } = STATUS_MAP[status] ?? STATUS_MAP.todo
  return (
    <div className="relative inline-flex items-center">
      <span className={clsx('inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-micro font-semibold whitespace-nowrap', cls)}>
        {icon}{label}
      </span>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as WbsStatus)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {Object.entries(STATUS_MAP).map(([val, { label: l }]) => (
          <option key={val} value={val}>{l}</option>
        ))}
      </select>
    </div>
  )
}

function Avatar({ name }: { name?: string }) {
  if (!name) return <span className="text-mini text-muted-foreground">—</span>
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 text-micro font-bold', color)}>
        {name.trim()[0]?.toUpperCase()}
      </span>
      <span className="text-mini text-foreground">{name}</span>
    </div>
  )
}

// 인라인 텍스트 편집 셀
function InlineText({
  value, onSave, className, placeholder = '—',
}: { value: string; onSave: (v: string) => void; className?: string; placeholder?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { onSave(draft); setEditing(false) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onSave(draft); setEditing(false) }
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={clsx('bg-transparent outline-none border-b border-accent w-full', className)}
      />
    )
  }
  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      className={clsx('cursor-pointer hover:text-accent transition-colors group/text', className)}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil size={10} className="inline ml-1 opacity-0 group-hover/text:opacity-40" />
    </span>
  )
}

function fromApi(epics: WbsEpicApi[]): WbsEpic[] {
  return epics.map((epic) => ({
    id: String(epic.id),
    title: epic.title,
    progress: epic.tasks.length > 0
      ? Math.round(epic.tasks.reduce((s, t) => s + t.progress, 0) / epic.tasks.length)
      : 0,
    tasks: epic.tasks.map((t) => ({
      id: String(t.id),
      epicId: String(epic.id),
      title: t.title,
      assigneeName: t.assignee_name ?? undefined,
      priority: toPriority(t.priority),
      status: toStatus(t.status),
      dueDate: t.due_date ?? undefined,
      progress: t.progress,
    })),
  }))
}

export default function WbsPage() {
  const { meetingId } = useParams()
  const workspaceId = getCurrentWorkspaceId()
  const { state } = useLocation()
  const meetingTitle = (state as any)?.meetingTitle as string | undefined

  const [epics, setEpics]           = useState<WbsEpic[]>([])
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({})
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [addingEpic, setAddingEpic] = useState(false)
  const [epicInput, setEpicInput]   = useState('')
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [taskInput, setTaskInput]   = useState('')

  useEffect(() => {
    getWbs(meetingId!, workspaceId)
      .then((d) => setEpics(fromApi(d.epics)))
      .catch(() => setEpics([]))
      .finally(() => setLoading(false))
  }, [meetingId])

  function toggleEpic(id: string) {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }))
  }

  // ── 에픽 수정 ──────────────────────────────────────────────────────────
  async function saveEpicTitle(epicId: string, title: string) {
    if (!title.trim()) return
    setEpics((p) => p.map((e) => e.id !== epicId ? e : { ...e, title }))
    await patchEpic(meetingId!, workspaceId, parseInt(epicId), { title }).catch(() => {})
  }

  // ── 태스크 수정 공통 ────────────────────────────────────────────────────
  function updateTask(epicId: string, taskId: string, patch: Partial<WbsEpic['tasks'][0]>) {
    setEpics((p) => p.map((e) => e.id !== epicId ? e : {
      ...e,
      tasks: e.tasks.map((t) => t.id !== taskId ? t : { ...t, ...patch }),
    }))
  }

  async function saveTaskField(epicId: string, taskId: string, body: Record<string, unknown>) {
    await patchTask(meetingId!, workspaceId, parseInt(taskId), body).catch(() => {})
  }

  async function handleGenerate() {
    if (epics.length > 0) {
      if (!confirm('기존 WBS가 모두 삭제되고 새로 생성됩니다. 계속하시겠습니까?')) return
    }
    setGenerating(true)
    try {
      const d = await generateWbs(meetingId!, workspaceId)
      setEpics(fromApi(d.epics))
    } finally { setGenerating(false) }
  }

  async function handleAddEpic() {
    if (!epicInput.trim()) { setAddingEpic(false); return }
    const d = await createEpic(meetingId!, workspaceId, epicInput.trim(), epics.length)
    setEpics((p) => [...p, { id: String(d.id), title: d.title, progress: 0, tasks: [] }])
    setEpicInput(''); setAddingEpic(false)
  }

  async function handleAddTask(epicId: string) {
    if (!taskInput.trim()) { setAddingTask(null); return }
    const d = await createTask(meetingId!, workspaceId, parseInt(epicId), taskInput.trim())
    setEpics((p) => p.map((e) => e.id !== epicId ? e : {
      ...e, tasks: [...e.tasks, {
        id: String(d.id), epicId, title: d.title,
        assigneeName: d.assignee_name ?? undefined,
        priority: toPriority(d.priority), status: toStatus(d.status),
        dueDate: d.due_date ?? undefined, progress: d.progress,
      }],
    }))
    setTaskInput(''); setAddingTask(null)
  }

  async function handleDeleteEpic(epicId: string) {
    await deleteEpic(meetingId!, workspaceId, parseInt(epicId))
    setEpics((p) => p.filter((e) => e.id !== epicId))
  }

  async function handleDeleteTask(epicId: string, taskId: string) {
    await deleteTask(meetingId!, workspaceId, parseInt(taskId))
    setEpics((p) => p.map((e) => e.id !== epicId ? e : {
      ...e, tasks: e.tasks.filter((t) => t.id !== taskId),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">WBS · 태스크 리스트</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{meetingTitle ?? `회의 #${meetingId}`}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors">
            <ExternalLink size={13} /> JIRA 동기화
          </button>
          <button
            onClick={() => { setAddingEpic(true); setEpicInput('') }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus size={13} /> 에픽 추가
          </button>
        </div>
      </div>

      {/* 빈 상태 */}
      {epics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-xl border border-dashed border-border">
          <Sparkles size={28} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">WBS가 아직 없습니다. AI로 자동 생성하세요.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {generating ? <><Loader2 size={13} className="animate-spin" /> 생성 중...</> : <><Sparkles size={13} /> AI WBS 생성</>}
          </button>
        </div>
      ) : (
        <>
          {/* AI 배너 */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20 mb-5">
            <Sparkles size={13} className="text-accent shrink-0" />
            <p className="text-mini text-accent flex-1">AI가 회의 내용을 기반으로 에픽과 태스크를 자동 생성했습니다. 셀을 클릭하면 바로 편집할 수 있습니다.</p>
            <button onClick={handleGenerate} disabled={generating} className="text-mini text-accent hover:underline disabled:opacity-60 shrink-0">
              {generating ? '생성 중...' : '재생성'}
            </button>
          </div>

          {/* 트리 테이블 */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-card border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide">작업명</th>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[120px]">담당자</th>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[80px]">우선순위</th>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[110px]">상태</th>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[90px]">기한</th>
                    <th className="text-left px-4 py-3 text-micro font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap min-w-[70px]">진행률</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>

                <tbody>
                  {epics.map((epic) => (
                    <Fragment key={epic.id}>
                      {/* ── Epic 행 ── */}
                      <tr className="bg-muted/30 border-b border-border group">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => toggleEpic(epic.id)}
                              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {collapsed[epic.id] ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <InlineText
                              value={epic.title}
                              onSave={(v) => saveEpicTitle(epic.id, v)}
                              className="font-semibold text-foreground"
                            />
                            <span className="shrink-0 text-micro text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
                              {epic.tasks.length}개
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5" colSpan={4}>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${epic.progress}%` }} />
                            </div>
                            <span className="text-micro text-muted-foreground">{epic.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteEpic(epic.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>

                      {/* ── Task 행들 ── */}
                      {!collapsed[epic.id] && epic.tasks.map((task) => (
                        <tr key={task.id} className="border-b border-border hover:bg-accent/5 transition-colors group">

                          {/* 작업명 */}
                          <td className="px-4 py-2.5 pl-10">
                            <InlineText
                              value={task.title}
                              onSave={(v) => {
                                if (!v.trim()) return
                                updateTask(epic.id, task.id, { title: v })
                                saveTaskField(epic.id, task.id, { title: v })
                              }}
                              className="text-sm text-foreground"
                            />
                          </td>

                          {/* 담당자 */}
                          <td className="px-4 py-2.5">
                            <InlineText
                              value={task.assigneeName ?? ''}
                              onSave={(v) => {
                                updateTask(epic.id, task.id, { assigneeName: v || undefined })
                                saveTaskField(epic.id, task.id, { assignee_name: v || null })
                              }}
                              className="text-mini text-foreground"
                              placeholder="담당자 없음"
                            />
                          </td>

                          {/* 우선순위 */}
                          <td className="px-4 py-2.5">
                            <div className="relative inline-flex items-center">
                              <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-micro font-semibold whitespace-nowrap', PRIORITY_MAP[task.priority]?.cls)}>
                                {PRIORITY_MAP[task.priority]?.label}
                              </span>
                              <select
                                value={task.priority}
                                onChange={(e) => {
                                  const p = e.target.value as WbsPriority
                                  updateTask(epic.id, task.id, { priority: p })
                                  saveTaskField(epic.id, task.id, { priority: p === 'urgent' ? 'high' : p })
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                              >
                                {Object.entries(PRIORITY_MAP).map(([val, { label }]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* 상태 */}
                          <td className="px-4 py-2.5">
                            <StatusSelect
                              status={task.status}
                              onChange={(s) => {
                                updateTask(epic.id, task.id, { status: s })
                                saveTaskField(epic.id, task.id, { status: fromStatus(s) })
                              }}
                            />
                          </td>

                          {/* 기한 */}
                          <td className="px-4 py-2.5">
                            <input
                              type="date"
                              value={task.dueDate ?? ''}
                              onChange={(e) => {
                                const v = e.target.value || undefined
                                updateTask(epic.id, task.id, { dueDate: v })
                                saveTaskField(epic.id, task.id, { due_date: v ?? null })
                              }}
                              className={clsx(
                                'text-mini bg-transparent outline-none cursor-pointer w-24',
                                task.dueDate && new Date(task.dueDate) < new Date()
                                  ? 'text-red-500 font-medium'
                                  : 'text-muted-foreground',
                              )}
                            />
                          </td>

                          {/* 진행률 */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0} max={100}
                                value={task.progress}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                                  updateTask(epic.id, task.id, { progress: v })
                                  saveTaskField(epic.id, task.id, { progress: v })
                                }}
                                className="w-10 text-mini text-center bg-transparent outline-none border-b border-transparent hover:border-border focus:border-accent text-muted-foreground"
                              />
                              <span className="text-micro text-muted-foreground">%</span>
                            </div>
                          </td>

                          {/* 삭제 */}
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteTask(epic.id, task.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* ── 태스크 추가 행 ── */}
                      {!collapsed[epic.id] && (
                        <tr className="border-b border-border bg-muted/10">
                          <td colSpan={7} className="px-4 py-2 pl-10">
                            {addingTask === epic.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  value={taskInput}
                                  onChange={(e) => setTaskInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddTask(epic.id)
                                    if (e.key === 'Escape') setAddingTask(null)
                                  }}
                                  placeholder="태스크 제목 입력 후 Enter"
                                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                                />
                                <button onClick={() => handleAddTask(epic.id)} className="text-mini text-accent">추가</button>
                                <button onClick={() => setAddingTask(null)} className="text-mini text-muted-foreground">취소</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setAddingTask(epic.id); setTaskInput('') }}
                                className="flex items-center gap-1 text-mini text-muted-foreground hover:text-accent transition-colors"
                              >
                                <Plus size={12} /> 태스크 추가
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 에픽 추가 인풋 */}
      {addingEpic && (
        <div className="mt-3 rounded-lg border border-dashed border-accent/40 px-4 py-3 flex items-center gap-2">
          <input
            autoFocus
            value={epicInput}
            onChange={(e) => setEpicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddEpic()
              if (e.key === 'Escape') setAddingEpic(false)
            }}
            placeholder="에픽 제목 입력 후 Enter"
            className="flex-1 text-sm font-semibold bg-transparent outline-none placeholder:text-muted-foreground"
          />
          <button onClick={handleAddEpic} className="text-mini text-accent">추가</button>
          <button onClick={() => setAddingEpic(false)} className="text-mini text-muted-foreground">취소</button>
        </div>
      )}
    </div>
  )
}
