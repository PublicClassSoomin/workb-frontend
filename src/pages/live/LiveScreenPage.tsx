import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Monitor, Sparkles, FileText, BarChart2 } from 'lucide-react'

const MOCK_ANALYSIS = [
  {
    id: 's1',
    type: 'slide' as const,
    timestamp: '00:05:20',
    title: '슬라이드 3: Q1 KPI 달성 현황',
    extracted: 'DAU 목표: 50,000 / 달성: 56,000 (+12%)\n전환율 목표: 8% / 달성: 5% (-3%p)',
    linked: 'Q1 회고 안건과 연결됨',
  },
  {
    id: 's2',
    type: 'chart' as const,
    timestamp: '00:12:45',
    title: '차트: 주간 활성 사용자 추이',
    extracted: '3월 4주 피크, 이후 완만한 하락. 신규 가입자 유입 감소 추정.',
    linked: 'Q2 목표 설정 안건과 연결됨',
  },
  {
    id: 's3',
    type: 'slide' as const,
    timestamp: '00:25:10',
    title: '슬라이드 7: Q2 OKR 초안',
    extracted: '목표 1: 온보딩 전환율 15% 개선\n목표 2: STT 연동 완료\n목표 3: WBS 자동화',
    linked: '결정사항으로 마킹됨',
  },
]

export default function LiveScreenPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(`/live/${meetingId}`)} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="뒤로">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">화면 공유 해석</h1>
          <p className="text-sm text-muted-foreground">슬라이드·차트를 분석하고 발언과 자동 결합합니다.</p>
        </div>
      </div>

      {/* Screen share preview */}
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 aspect-video flex flex-col items-center justify-center mb-5 gap-2">
        <Monitor size={36} className="text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">화면 공유 미리보기</p>
        <button
          onClick={() => console.log('TODO: start screen share capture')}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          화면 공유 시작
        </button>
      </div>

      {/* Analysis results */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-accent" />
        <span className="text-sm font-medium text-foreground">AI 분석 결과</span>
        <span className="text-mini text-muted-foreground">슬라이드 {MOCK_ANALYSIS.length}개 감지됨</span>
      </div>

      <div className="flex flex-col gap-3">
        {MOCK_ANALYSIS.map((item) => (
          <div key={item.id} className="p-3.5 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                {item.type === 'chart' ? <BarChart2 size={14} className="text-accent" /> : <FileText size={14} className="text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className="text-mini text-muted-foreground shrink-0">{item.timestamp}</span>
                </div>
                <p className="text-mini text-muted-foreground mt-1 whitespace-pre-line">{item.extracted}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
              <Sparkles size={11} className="text-accent" />
              <span className="text-mini text-accent">{item.linked}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
