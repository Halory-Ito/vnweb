import { Clock3Icon } from 'lucide-react'
import Link from 'next/link'

import { formatHeatmapDayLabel, formatPlayDuration } from '../lib/format-utils'
import { Skeleton } from '@/components/ui/skeleton'

import type { RecordDayGame } from '@/types'

type HeatmapDayRecordsProps = {
  date: string
  games?: RecordDayGame[]
  isError: boolean
}

export default function HeatmapDayRecords({ date, games, isError }: HeatmapDayRecordsProps) {
  const totalSeconds = games?.reduce((sum, game) => sum + game.seconds, 0) ?? 0

  return (
    <section className="min-w-0 space-y-3" aria-label="当天游玩记录" aria-busy={!games && !isError}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{formatHeatmapDayLabel(date)}</h3>
        {games?.length ? (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs tabular-nums">
            <Clock3Icon aria-hidden="true" className="size-3.5" />
            {formatPlayDuration(totalSeconds)}
          </p>
        ) : null}
      </div>
      {isError ? (
        <p role="status" className="text-muted-foreground py-3 text-sm">
          当天记录加载失败，请稍后重试。
        </p>
      ) : !games ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : games.length === 0 ? (
        <p role="status" className="text-muted-foreground py-3 text-sm">
          当天没有游玩记录。
        </p>
      ) : (
        <ul className="max-h-64 divide-y overflow-y-auto">
          {games.map((game) => (
            <li key={game.gameId}>
              <Link
                href={`/game/info/${game.gameId}`}
                className="hover:bg-accent/50 focus-visible:outline-ring flex min-w-0 items-start justify-between gap-3 rounded-md px-2 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2"
              >
                <span className="min-w-0 text-sm font-medium wrap-anywhere">{game.title}</span>
                <span className="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
                  <span className="text-foreground block">{formatPlayDuration(game.seconds)}</span>
                  {game.recordCount} 条记录
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
