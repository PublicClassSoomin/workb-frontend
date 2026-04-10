import { useState } from 'react'
import { Mic, Camera, Monitor, Check, Volume2 } from 'lucide-react'

const MOCK_MICS = ['내장 마이크 (MacBook Air)', 'Blue Yeti USB Microphone', 'AirPods Pro']
const MOCK_CAMERAS = ['내장 카메라 (FaceTime HD)', 'Logitech C920']

export default function DeviceSettingsPage() {
  const [isMainDevice, setIsMainDevice] = useState(true)
  const [selectedMic, setSelectedMic] = useState(MOCK_MICS[0])
  const [selectedCamera, setSelectedCamera] = useState(MOCK_CAMERAS[0])
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [testing, setTesting] = useState(false)

  function handleMicTest() {
    setTesting(true)
    // TODO: test microphone
    console.log('TODO: test microphone', selectedMic)
    setTimeout(() => setTesting(false), 3000)
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-xl font-semibold text-foreground mb-1">장비 설정</h1>
      <p className="text-sm text-muted-foreground mb-6">AI 챗봇 및 STT를 실행할 장비와 입력 장치를 설정합니다.</p>

      {/* Main device designation */}
      <div className="p-4 rounded-xl border border-border bg-card mb-5">
        <div className="flex items-start gap-3 mb-3">
          <Monitor size={20} className="text-accent mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground mb-1">AI 메인 장비 지정</h2>
            <p className="text-mini text-muted-foreground">AI 챗봇 패널과 STT는 메인으로 지정된 장비 1대에서만 실행됩니다.</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${isMainDevice ? 'border-accent bg-accent-subtle' : 'border-border hover:border-accent/50'}`}
          onClick={() => setIsMainDevice((v) => !v)}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isMainDevice ? 'border-accent bg-accent' : 'border-border'}`}>
            {isMainDevice && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">이 장비를 메인으로 설정</p>
            <p className="text-mini text-muted-foreground">현재 기기: MacBook Air (김수민)</p>
          </div>
          {isMainDevice && <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-micro font-medium">메인</span>}
        </div>
      </div>

      {/* Microphone */}
      <div className="p-4 rounded-xl border border-border bg-card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Mic size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-foreground">마이크 설정</h2>
        </div>
        <div className="mb-3">
          <label className="block text-mini font-medium text-muted-foreground mb-1.5">마이크 장치 선택</label>
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none"
          >
            {MOCK_MICS.map((mic) => <option key={mic} value={mic}>{mic}</option>)}
          </select>
        </div>
        {/* Input level bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-mini text-muted-foreground">입력 레벨</span>
            <Volume2 size={12} className="text-muted-foreground" />
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full bg-green-500 transition-all duration-200 ${testing ? 'animate-pulse' : ''}`}
              style={{ width: testing ? '65%' : '10%' }}
            />
          </div>
        </div>
        <button
          onClick={handleMicTest}
          disabled={testing}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          <Mic size={13} className={testing ? 'text-red-500 animate-pulse' : ''} />
          {testing ? '테스트 중...' : '마이크 테스트'}
        </button>
      </div>

      {/* Camera */}
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-foreground">웹캠 설정</h2>
          </div>
          {/* Toggle */}
          <button
            onClick={() => setCameraEnabled((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${cameraEnabled ? 'bg-accent' : 'bg-border'}`}
            aria-label="웹캠 켜기/끄기"
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cameraEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {cameraEnabled && (
          <div className="mb-3">
            <label className="block text-mini font-medium text-muted-foreground mb-1.5">웹캠 장치 선택</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm outline-none"
            >
              {MOCK_CAMERAS.map((cam) => <option key={cam} value={cam}>{cam}</option>)}
            </select>
          </div>
        )}
        <p className="text-mini text-muted-foreground">
          웹캠은 선택 사항입니다. 회의 중 사진 촬영 후 회의록에 첨부할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
