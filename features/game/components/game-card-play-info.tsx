import { CalendarDaysIcon, Clock3Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

function formatLastRunDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function GameCardPlayInfo({
  playTime,
  lastRunAt,
  mobile,
}: {
  playTime: number
  lastRunAt: string
  mobile?: boolean
}) {
  const hours = Math.max(0, Number(playTime) || 0) / 3600
  const rowClass = cn('flex items-center gap-1.5 rounded-md px-2 py-1', mobile && 'bg-black/60')

  return (
    <div
      className={cn(
        'absolute',
        mobile ? 'inset-x-2 bottom-2 space-y-1 md:hidden' : 'inset-x-3 bottom-3 space-y-1.5',
      )}
    >
      <div className={rowClass}>
        <Clock3Icon className="size-3 text-white/80" />
        <span className="text-xs font-medium text-white">{hours.toFixed(1)}h</span>
      </div>
      <div className={rowClass}>
        <CalendarDaysIcon className={cn('size-3 text-white/80', mobile && 'shrink-0')} />
        <span className={cn('text-xs text-white/90', mobile && 'break-all')}>
          {formatLastRunDate(lastRunAt)}
        </span>
      </div>
    </div>
  )
}
