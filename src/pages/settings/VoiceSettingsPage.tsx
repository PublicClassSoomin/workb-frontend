import { useState } from 'react'
import { Mic, Square, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { PARTICIPANTS } from '../../data/mockData'

type DiarizationMethod = 'stereo' | 'ai'

export default function VoiceSettingsPage() {
  const [recording, setRecording] = useState(false)
  const [diarizationMethod, setDiarizationMethod] = useState<DiarizationMethod>('ai')
  const [registered, setRegistered] = useState(true)
  const [recordedSec, setRecordedSec] = useState(0)

  function toggleRecording() {
    if (recording) {
      // TODO: stop recording and save voice sample
      console.log('TODO: stop recording, save voice profile')
      setRecording(false)
      setRegistered(true)
    } else {
      setRecording(true)
      setRecordedSec(0)
      // TODO: start microphone recording
      console.log('TODO: start microphone recording for voice profile')
    }
  }

  const profiles = PARTICIPANTS.map((p, i) => ({
    ...p,
    profileStatus: i < 3 ? 'registered' : 'unregistered',
  }))

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} className="text-accent" />
        <span className="text-mini text-accent font-medium">AI 기능</span>
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-1">성문(음성) 수집 · 화자 등록</h1>
      <p className="text-sm text-muted-foreground mb-6">마이크로 음성 샘플을 녹음하여 화자 프로필을 등록합니다.</p>

      {/* Voice recording */}
      <div className="p-5 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">내 음성 프로필</h2>

        <div className="flex flex-col items-center gap-4">
          {/* Recording indicator */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${recording ? 'bg-red-100 dark:bg-red-950/30' : 'bg-muted'}`}>
            {recording ? (
              <Mic size={32} className="text-red-500 animate-pulse" />
            ) : (
              <Mic size={32} className="text-muted-foreground" />
            )}
          </div>

          {recording && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-500 font-medium">녹음 중... {recordedSec}초</span>
            </div>
          )}

          {registered && !recording && (
            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <CheckCircle size={15} /> 음성 프로필 등록됨
            </div>
          )}

          <p className="text-mini text-muted-foreground text-center max-w-xs">
            "안녕하세요. 제 이름은 [이름]입니다. 지금부터 음성 프로필을 등록하겠습니다." 와 같이 5초 이상 말씀해 주세요.
          </p>

          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium transition-colors ${recording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`}
          >
            {recording ? <><Square size={14} fill="currentColor" /> 녹음 중지 및 저장</> : <><Mic size={14} /> 음성 녹음 시작</>}
          </button>
        </div>
      </div>

      {/* Diarization method */}
      <div className="p-4 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">화자 분리 방식</h2>
        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="diarization"
              value="stereo"
              checked={diarizationMethod === 'stereo'}
              onChange={() => setDiarizationMethod('stereo')}
              className="mt-0.5 accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-foreground">스테레오 마이크 방식 (대안 A)</p>
              <p className="text-mini text-muted-foreground">발화 방향(채널)으로 화자 구분. 전용 마이크 장비 필요.</p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="radio"
              name="diarization"
              value="ai"
              checked={diarizationMethod === 'ai'}
              onChange={() => setDiarizationMethod('ai')}
              className="mt-0.5 accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-foreground">AI 음성 분석 방식 (대안 B)</p>
              <p className="text-mini text-muted-foreground">Speaker Diarization 모델로 자동 화자 분리. 일반 마이크 사용 가능.</p>
            </div>
          </label>
        </div>
      </div>

      {/* Speaker profiles */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">팀원 화자 프로필</h2>
        <div className="flex flex-col gap-2">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.color }}>
                {p.avatarInitials[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
              </div>
              {p.profileStatus === 'registered' ? (
                <span className="flex items-center gap-1 text-mini text-green-600 dark:text-green-400">
                  <CheckCircle size={12} /> 등록됨
                </span>
              ) : (
                <span className="flex items-center gap-1 text-mini text-muted-foreground">
                  <AlertCircle size={12} /> 미등록
                </span>
              )}
              <button
                onClick={() => console.log('TODO: re-register voice', p.id)}
                className="px-2.5 py-1 rounded border border-border text-mini hover:bg-muted transition-colors"
              >
                {p.profileStatus === 'registered' ? '재등록' : '등록'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
