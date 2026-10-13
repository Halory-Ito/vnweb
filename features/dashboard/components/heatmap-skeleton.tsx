import { Skeleton } from '@/components/ui/skeleton'

export default function HeatmapSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {Array.from({ length: 35 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
  )
}
