interface Props {
  size?: number
}

export default function WorkbAssistantAvatar({ size = 36 }: Props) {
  return (
    <img
      src="/brand/workb-logo.png"
      alt="Workb 로고"
      width={size}
      height={size}
      className="rounded-md object-cover"
    />
  )
}
