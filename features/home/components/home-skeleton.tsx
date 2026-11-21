import GameHomeGrid from './game-home-grid'
import { Skeleton } from '@/components/ui/skeleton'

export default function GameHomeSkeleton() {
  return (
    <div className="@container/library max-h-[100cqh] w-full min-w-0 space-y-6 overflow-hidden p-3 sm:space-y-8 sm:p-4">
      {[2, 2, 8].map((count, section) => (
        <div key={section} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
            <Skeleton className="h-6 w-24" />
            {section === 2 ? <Skeleton className="h-9 w-36" /> : null}
          </div>
          <GameHomeGrid>
            {Array.from({ length: count }, (_, index) => (
              <div key={index} className="space-y-2 p-1">
                <Skeleton className="aspect-3/4 w-full rounded-lg" />
                <Skeleton className="mx-auto h-4 w-3/4" />
              </div>
            ))}
          </GameHomeGrid>
        </div>
      ))}
    </div>
  )
}
