import { cn } from '@/lib/utils'

type GoalProgressRingProps = {
  title: string
  currentText: string
  targetText: string
  percent: number
  progressColor: string
}

export default function GoalProgressRing({
  title,
  currentText,
  targetText,
  percent,
  progressColor,
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
        className={cn('absolute inset-0 size-full -rotate-90', progressColor)}
        aria-hidden="true"
      >
        <circle cx={50} cy={50} r={44} strokeWidth={6} className="fill-none stroke-current/20" />
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
          className="fill-none stroke-current"
        />
      </svg>
      <div className="w-[78%] space-y-0.5 text-center whitespace-normal tabular-nums">
        <div className="text-lg leading-tight font-semibold">{currentText}</div>
        <div className="text-muted-foreground text-xs leading-tight">/ {targetText}</div>
      </div>
    </div>
  )
}
