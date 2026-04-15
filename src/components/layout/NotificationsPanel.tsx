import { useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import clsx from 'clsx'

interface Notification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '회의 시작 알림',
    body: 'Q2 제품 로드맵 리뷰 회의가 10분 후 시작됩니다.',
    time: '10분 전',
    read: false,
  },
  {
    id: '2',
    title: '회의록 준비 완료',
    body: '어제 스탠드업 회의록이 생성되었습니다. 확인해보세요.',
    time: '1시간 전',
    read: false,
  },
  {
    id: '3',
    title: '액션 아이템 마감 임박',
    body: 'API 연동 테스트 완료 액션 아이템 마감이 내일입니다.',
    time: '3시간 전',
    read: true,
  },
]

interface NotificationsPanelProps {
  onClose: () => void
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  // ESC 키로 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-label="알림 목록"
      aria-modal="false"
      className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border border-border bg-card shadow-lg"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">알림</span>
          {MOCK_NOTIFICATIONS.filter((n) => !n.read).length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              {MOCK_NOTIFICATIONS.filter((n) => !n.read).length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="알림 닫기"
        >
          <X size={14} />
        </button>
      </div>

      {/* 알림 목록 */}
      {MOCK_NOTIFICATIONS.length > 0 ? (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto" role="list">
          {MOCK_NOTIFICATIONS.map((n) => (
            <li
              key={n.id}
              className={clsx(
                'flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors',
                n.read && 'opacity-60',
              )}
            >
              <span
                className={clsx(
                  'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0',
                  n.read ? 'bg-transparent' : 'bg-accent',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-10 text-center">
          <Bell size={28} className="text-muted-foreground mx-auto mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">새로운 알림이 없습니다.</p>
        </div>
      )}

      {/* 푸터 */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <button className="text-xs text-accent hover:underline transition-colors">
          모두 읽음으로 표시
        </button>
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          알림 설정
        </button>
      </div>
    </div>
  )
}
