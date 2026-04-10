interface Props {
  size?: number
}

export default function WorkbAssistantAvatar({ size = 36 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body — rounded square */}
      <rect x="4" y="8" width="28" height="22" rx="7" fill="#5668F3" />

      {/* Antenna base */}
      <rect x="17" y="2" width="2" height="7" rx="1" fill="#5668F3" />
      {/* Antenna tip — circle */}
      <circle cx="18" cy="2" r="2.5" fill="#A5AEFF" />

      {/* Face — visor strip */}
      <rect x="8" y="14" width="20" height="8" rx="3" fill="white" fillOpacity="0.15" />

      {/* Eyes */}
      <circle cx="13" cy="18" r="2.5" fill="white" />
      <circle cx="23" cy="18" r="2.5" fill="white" />
      {/* Eye pupils */}
      <circle cx="13.5" cy="18.5" r="1.2" fill="#5668F3" />
      <circle cx="23.5" cy="18.5" r="1.2" fill="#5668F3" />

      {/* Smile */}
      <path
        d="M13 25 Q18 28.5 23 25"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Ear nubs */}
      <rect x="1" y="16" width="3" height="5" rx="1.5" fill="#5668F3" />
      <rect x="32" y="16" width="3" height="5" rx="1.5" fill="#5668F3" />
    </svg>
  )
}
