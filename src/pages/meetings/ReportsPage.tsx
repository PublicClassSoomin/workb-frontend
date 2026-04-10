import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, FileSpreadsheet, Presentation, Code, Download, Edit2 } from 'lucide-react'
import clsx from 'clsx'
import { MEETINGS } from '../../data/mockData'

type Format = 'excel' | 'ppt' | 'html'

const FORMAT_OPTIONS: { id: Format; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'excel', label: 'Excel', icon: <FileSpreadsheet size={20} />, desc: '표·데이터 중심 보고서' },
  { id: 'ppt', label: 'PowerPoint', icon: <Presentation size={20} />, desc: '슬라이드 발표 자료' },
  { id: 'html', label: 'HTML', icon: <Code size={20} />, desc: '웹 공유용 인터랙티브 리포트' },
]

const MOCK_REPORT = `# UI/UX 디자인 검토 회의 보고서

## 회의 개요
- **일시**: 2026년 4월 7일 오전 10:00
- **참석자**: 김수민, 이지현, 최은영 (3명)
- **소요 시간**: 60분

## 결정사항 요약
1. 홈 대시보드 와이어프레임 최종 승인
2. 사이드바 컬러 시스템 확정 (#5668F3 기반)
3. 다음 스프린트 컴포넌트 구현 착수 결정

## 액션 아이템 현황
| 담당자 | 항목 | 기한 | 상태 |
|--------|------|------|------|
| 박준혁 | API 설계 문서 | 4/11 | 진행중 |
| 김수민 | 대시보드 구현 | 4/12 | 진행중 |
| 이지현 | 디자인 토큰 확정 | 완료 | ✅ |

## 다음 단계
- 컴포넌트 구현 스프린트 착수
- 모바일 반응형 레이아웃 별도 검토 예정`

export default function ReportsPage() {
  const { meetingId } = useParams()
  const meeting = MEETINGS.find((m) => m.id === meetingId) ?? MEETINGS[4]
  const [format, setFormat] = useState<Format>('html')
  const [reportContent, setReportContent] = useState(MOCK_REPORT)
  const [generated, setGenerated] = useState(true)
  const [editing, setEditing] = useState(false)

  function handleGenerate() {
    // TODO: AI generate report
    console.log('TODO: generate report', { format, meetingId })
    setGenerated(true)
  }

  function handleDownload() {
    // TODO: download report
    console.log('TODO: download report as', format)
    alert(`TODO: ${format.toUpperCase()} 형식으로 보고서 다운로드`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-accent" />
            <span className="text-mini text-accent font-medium">AI 보고서 생성</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">보고서 생성</h1>
          <p className="text-sm text-muted-foreground">{meeting.title}</p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
            >
              <Edit2 size={13} /> {editing ? '미리보기' : '편집'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Download size={13} /> 다운로드
            </button>
          </div>
        )}
      </div>

      {/* Format selector */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFormat(opt.id)}
            className={clsx(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-colors',
              format === opt.id ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-muted-foreground hover:border-foreground',
            )}
          >
            {opt.icon}
            <span className="font-medium">{opt.label}</span>
            <span className="text-micro">{opt.desc}</span>
          </button>
        ))}
      </div>

      {!generated ? (
        <button
          onClick={handleGenerate}
          className="w-full h-11 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={15} /> AI로 보고서 초안 생성
        </button>
      ) : editing ? (
        <div>
          <p className="text-mini text-muted-foreground mb-2">보고서 내용을 직접 편집하세요.</p>
          <textarea
            value={reportContent}
            onChange={(e) => setReportContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-mono outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
          />
          <button
            onClick={() => {
              console.log('TODO: save report', reportContent)
              setEditing(false)
            }}
            className="mt-2 h-9 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            저장
          </button>
        </div>
      ) : (
        <div className="p-5 rounded-xl border border-border bg-card prose prose-sm max-w-none dark:prose-invert">
          <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
            {reportContent}
          </pre>
        </div>
      )}
    </div>
  )
}
