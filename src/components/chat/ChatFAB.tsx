import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import WorkbAssistantAvatar from './WorkbAssistantAvatar'
import type { ChatMessage } from '../../types/chat'
import { useLocation } from 'react-router-dom'
import { getCurrentWorkspaceId } from '../../api/client'
import { sendChatMessage, getChatHistory } from '../../api/chatbot'

// sessionStorge 키 - workspace별로 세션 분리
// 탭 닫으면 자동 만료 -> 새 탭에서 새 대화 시작
const sessionKey = (workspaceId: number) => `chatbot_session_${workspaceId}`

// 초기 웰컴 메시지 - API 호출 없이 정적으로 표시
function getWelcomeMessage(meetingId: number | null): ChatMessage {
  const meetingSection = meetingId
  ? `**🎙 현재 회의**\n- 지금까지 논의 내용 요약\n- 결정 사항 / 액션 아이템 확인\n\n`
  : ''

  const content = [
    '안녕하세요! **Workb AI 도우미**입니다.',                                                                      
    '아래 내용을 도와드릴 수 있어요.',                                                                               
    meetingSection +                                                                                                 
    '**📁 자료 검색**\n- 업로드된 내부 문서 검색\n- 이전 회의 내용 조회',                                        
    '**🌐 외부 정보**\n- 웹 검색으로 최신 정보 조회',                                                              
    '**📅 회의 일정**\n- 특정 날짜 회의 일정 조회',                                                              
    '무엇이든 물어보세요!',                                                                                          
  ].join('\n\n')

  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
  }
}

export default function ChatFAB() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  // URL /meetings/live/{id} 에서 meeting_id 파싱
  // 회의 중일 때만 존재 -> 없으면 null (이전 회의 검색만 가능)
  const match = location.pathname.match(/\/live\/([^/]+)/)
  const meetingId = match ? Number(match[1]) : null

  const [messages, setMessages] = useState<ChatMessage[]>([getWelcomeMessage(meetingId)])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const workspaceId = getCurrentWorkspaceId()

  // 챗봇 첫 오픈 시 sessionStorage에 session_id 있으면 히스토리 복원
  useEffect(() => {
    if (!open) return
    const existingSessionId = sessionStorage.getItem(sessionKey(workspaceId))
    if (!existingSessionId) return
    
    getChatHistory(workspaceId, existingSessionId)
    .then(({ messages: history }) => {
      if (!history.length) return
      // 히스토리가 있으면 웰컴 메시지 대신 실제 대화로 교체
      setMessages(
        history.map((m, i) => ({
          id: `h-${i}`,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      )
    })
    .catch(() => {
      // 히스토리 조회 실패 시 웰컴 메시지 유지 (세션 만료 등)
      sessionStorage.removeItem(sessionKey(workspaceId))
    })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // ESC로 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Scroll to bottom when opened or new message
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }, [open, messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    
    // 사용자 메시지 즉시 표시
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    
    try {
      const sessionId = sessionStorage.getItem(sessionKey(workspaceId))
      const res = await sendChatMessage(workspaceId, text, meetingId, sessionId)

      // 서버 발급 session_id를 sessionStorage에 저장
      // 이미 있으면 덮어씀 (같은 값이므로 문제 없음)
      sessionStorage.setItem(sessionKey(workspaceId), res.session_id)

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        timestamp: res.timestamp,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      // 에러 시 인라인 메시지로 표시 - 토스트 없이 대화 흐름 안에서 처리
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date().toISOString(),
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 회의 중일 때만 "현재 회의 요약" 찹 표시
  const CHIPS = [                                                                                                      
    ...(meetingId ? ['지금까지 회의 요약', '담당 업무 조회'] : []),
    '자료 검색',                                                                                                                                                                                               
    '외부 정보 검색',                                                                                                  
    '오늘 일정 확인',                                                                                                
  ]

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 도우미 열기"
        className={clsx(
          'fixed right-4 sm:right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg',
          'bg-accent hover:bg-accent/90 transition-all duration-200',
          'hover:scale-105 hover:shadow-xl active:scale-95',
          open && 'scale-95 shadow-md',
        )}
        style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
      >
        {open
          ? <X size={22} className="text-accent-foreground" />
          : <WorkbAssistantAvatar size={34} />
        }
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className={clsx(
            'fixed right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl shadow-2xl border border-border',
            'bg-card flex flex-col overflow-hidden',
            'animate-in slide-in-from-bottom-4 duration-200',
          )}
          style={{
            bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))',
            maxHeight: '70vh',
          }}
          role="dialog"
          aria-label="Workb AI 도우미"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-accent/5">
            <WorkbAssistantAvatar size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Workb 도우미</p>
              <p className="text-mini text-muted-foreground">AI 어시스턴트 · 항상 대기 중</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chip hints */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border bg-muted/30">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setInput(chip)}
                className="px-2.5 py-1 rounded-full text-mini bg-accent-subtle text-accent border border-accent/20 hover:bg-accent/10 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'flex gap-2 items-end',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="shrink-0">
                    <WorkbAssistantAvatar size={22} />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm',
                  )}
                >
                  {msg.role === 'assistant'
                    ? (
                      // 어시스턴트 답변은 마크다운 렌더링
                      // 고지문, 근거 발화 blockquote, **볼드** 등 처리
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {/* 로딩 인디케이터 - 응답 대기 중 표시 */}
            {isLoading && (
              <div className='flex gap-2 items-end'>
                <div className='shrink-0'>
                  <WorkbAssistantAvatar size={22} />
                </div>
                <div className='bg-muted text-muted-foreground px-3 py-2 rounded-2xl rounded-bl-sm text-sm flex items-center gap-1.5'>
                  <Loader2 size={13} className='animate-spin' />
                  <span>답변 생성 중...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 px-3 py-2.5 border-t border-border"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSend()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="무엇이든 물어보세요..."
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors"
              aria-label="전송"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
