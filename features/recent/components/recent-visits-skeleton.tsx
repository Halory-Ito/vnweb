import { Skeleton } from '@/components/ui/skeleton'

export default function RecentVisitsSkeleton() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-[58px] w-full rounded-xl" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2.5 sm:gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="w-full space-y-1.5">
            <Skeleton className="aspect-3/4 w-full rounded-lg" />
            <Skeleton className="mx-auto h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
