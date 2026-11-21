import HeatmapSkeleton from './heatmap-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardSkeleton() {
  return (
    <div className="max-h-[100cqh] w-full overflow-hidden p-3 sm:p-4">
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
          <HeatmapSkeleton />
        </div>
      </div>
    </div>
  )
}
