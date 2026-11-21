import { Skeleton } from '@/components/ui/skeleton'

export default function HeatmapSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1" aria-hidden="true">
      {Array.from({ length: 35 }, (_, index) => (
        <Skeleton key={index} className="h-9 rounded-md sm:h-10" />
      ))}
    </div>
  )
}
