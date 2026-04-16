import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Users, AlertCircle } from 'lucide-react'
import { DEPARTMENTS as INITIAL_DEPARTMENTS, PARTICIPANTS } from '../../data/mockData'
import type { Department } from '../../types/meeting'

export default function DepartmentsSettingsPage() {
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS)
  const [newDeptName, setNewDeptName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [addError, setAddError] = useState('')

  function getMemberCount(deptName: string) {
    return PARTICIPANTS.filter((p) => p.department === deptName).length
  }

  function handleAddDept() {
    const name = newDeptName.trim()
    if (!name) {
      setAddError('부서명을 입력해 주세요.')
      return
    }
    if (departments.some((d) => d.name === name)) {
      setAddError('이미 존재하는 부서명입니다.')
      return
    }
    const newId = `d${Date.now()}`
    setDepartments((prev) => [...prev, { id: newId, name }])
    setNewDeptName('')
    setAddError('')
    console.log('TODO: create department', { name })
  }

  function startEdit(dept: Department) {
    setEditingId(dept.id)
    setEditingName(dept.name)
    setDeleteConfirmId(null)
  }

  function confirmEdit(id: string) {
    const name = editingName.trim()
    if (!name) return
    if (departments.some((d) => d.name === name && d.id !== id)) return
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)))
    setEditingId(null)
    console.log('TODO: update department', { id, name })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  function requestDelete(id: string) {
    setDeleteConfirmId(id)
    setEditingId(null)
  }

  function confirmDelete(id: string) {
    setDepartments((prev) => prev.filter((d) => d.id !== id))
    setDeleteConfirmId(null)
    console.log('TODO: delete department', { id })
  }

  function cancelDelete() {
    setDeleteConfirmId(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">부서 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          조직 내 부서를 추가·수정·삭제하세요. 부서는 회의 생성 시 직원 일괄 추가에 활용됩니다.
        </p>
      </div>

      {/* 부서 추가 */}
      <div className="p-4 rounded-lg border border-border bg-card mb-5">
        <p className="text-sm font-medium text-foreground mb-3">새 부서 추가</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDeptName}
            onChange={(e) => {
              setNewDeptName(e.target.value)
              if (addError) setAddError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddDept()
              }
            }}
            placeholder="예: 영업팀, 기획팀"
            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            aria-label="새 부서명 입력"
          />
          <button
            type="button"
            onClick={handleAddDept}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
        {addError && (
          <p className="flex items-center gap-1 text-mini text-red-500 mt-1.5">
            <AlertCircle size={12} /> {addError}
          </p>
        )}
      </div>

      {/* 부서 목록 */}
      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">등록된 부서가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card divide-y divide-border">
          {/* 헤더 */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted/40 text-micro font-medium text-muted-foreground uppercase tracking-wide">
            <span>부서명</span>
            <span className="text-right">소속 직원</span>
            <span></span>
          </div>

          {departments.map((dept) => {
            const memberCount = getMemberCount(dept.name)
            const isEditing = editingId === dept.id
            const isDeleteConfirm = deleteConfirmId === dept.id

            return (
              <div key={dept.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                {isDeleteConfirm ? (
                  /* 삭제 확인 UI */
                  <div className="flex items-center gap-3 flex-wrap">
                    <AlertCircle size={15} className="text-red-500 shrink-0" />
                    <span className="text-sm text-foreground flex-1">
                      <strong>{dept.name}</strong>을(를) 삭제하시겠습니까?
                      {memberCount > 0 && (
                        <span className="text-muted-foreground"> (소속 직원 {memberCount}명의 부서 정보가 초기화됩니다)</span>
                      )}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => confirmDelete(dept.id)}
                        className="flex items-center gap-1 h-7 px-3 rounded border border-red-400 text-red-500 text-mini hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        aria-label="삭제 확인"
                      >
                        <Trash2 size={12} /> 삭제
                      </button>
                      <button
                        type="button"
                        onClick={cancelDelete}
                        className="flex items-center gap-1 h-7 px-3 rounded border border-border text-muted-foreground text-mini hover:bg-muted transition-colors"
                        aria-label="취소"
                      >
                        <X size={12} /> 취소
                      </button>
                    </div>
                  </div>
                ) : isEditing ? (
                  /* 수정 UI */
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmEdit(dept.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      autoFocus
                      className="flex-1 h-8 px-2.5 rounded border border-accent bg-background text-sm outline-none focus:ring-2 focus:ring-accent/30"
                      aria-label="부서명 수정"
                    />
                    <button
                      type="button"
                      onClick={() => confirmEdit(dept.id)}
                      className="flex items-center justify-center w-8 h-8 rounded border border-border text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                      aria-label="수정 확인"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center justify-center w-8 h-8 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                      aria-label="수정 취소"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  /* 일반 표시 UI */
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{dept.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-mini text-muted-foreground shrink-0">
                      <Users size={12} />
                      <span>{memberCount}명</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(dept)}
                        className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label={`${dept.name} 수정`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(dept.id)}
                        className="flex items-center justify-center w-7 h-7 rounded text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors"
                        aria-label={`${dept.name} 삭제`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
