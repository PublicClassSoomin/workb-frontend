import { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import clsx from 'clsx'
import WorkbAssistantAvatar from './WorkbAssistantAvatar'
import { GLOBAL_CHAT_MESSAGES } from '../../data/mockChatMessages'
import type { ChatMessage } from '../../types/chat'

export default function ChatFAB() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(GLOBAL_CHAT_MESSAGES)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on Escape
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

  function handleSend() {
    const text = input.trim()
    if (!text) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    // TODO: API call to AI assistant
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: '네, 확인했습니다. 해당 내용은 회의 기록에 반영하겠습니다.',
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, reply])
    }, 800)
    console.log('TODO: send message to AI assistant', text)
  }

  const CHIPS = ['현재 회의 요약', '액션 아이템 조회', '다음 회의 일정', '자료 검색']

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
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 px-3 py-2.5 border-t border-border"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="무엇이든 물어보세요..."
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
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
