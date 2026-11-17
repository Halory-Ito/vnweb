import { formatPlayDuration } from '../lib/format-utils'
import { Skeleton } from '@/components/ui/skeleton'

type HeatmapStatsProps = {
  yearSeconds?: number
  monthSeconds?: number
  isYearError: boolean
  isMonthError: boolean
}

function HeatmapStat({
  label,
  seconds,
  isError,
}: {
  label: string
  seconds?: number
  isError: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className="mt-1 text-base font-medium tabular-nums sm:text-lg"
        aria-busy={seconds === undefined && !isError}
      >
        {seconds !== undefined ? (
          formatPlayDuration(seconds)
        ) : isError ? (
          <span className="text-muted-foreground text-sm">加载失败</span>
        ) : (
          <Skeleton className="h-6 w-20" />
        )}
      </dd>
    </div>
  )
}

export default function HeatmapStats({
  yearSeconds,
  monthSeconds,
  isYearError,
  isMonthError,
}: HeatmapStatsProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 border-b pb-3 sm:gap-4" aria-live="polite">
      <HeatmapStat label="全年游玩时长" seconds={yearSeconds} isError={isYearError} />
      <HeatmapStat label="当月游玩时长" seconds={monthSeconds} isError={isMonthError} />
    </dl>
  )
}
