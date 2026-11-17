type GoalProgressRingProps = {
  title: string
  currentText: string
  targetText: string
  percent: number
}

export default function GoalProgressRing({
  title,
  currentText,
  targetText,
  percent,
}: GoalProgressRingProps) {
  return (
    <div
      role="progressbar"
      aria-label={title}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${currentText}，目标 ${targetText}，已完成 ${percent}%`}
      className="relative mx-auto flex aspect-square w-full max-w-28 items-center justify-center"
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <circle cx={50} cy={50} r={44} strokeWidth={6} className="stroke-primary/20 fill-none" />
        <circle
          cx={50}
          cy={50}
          r={44}
          pathLength={100}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={100}
          strokeDashoffset={100 - percent}
          visibility={percent === 0 ? 'hidden' : 'visible'}
          className="stroke-primary fill-none"
        />
      </svg>
      <div className="space-y-0.5 px-3 text-center tabular-nums">
        <div className="text-base leading-5 font-medium">{currentText}</div>
        <div className="text-muted-foreground text-xs">{percent}%</div>
      </div>
    </div>
  )
}
