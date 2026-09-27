import { Skeleton } from '@/components/ui/skeleton'

export default function RecentHomeSkeleton() {
  return (
    <div className="max-h-[calc(100vh-80px)] w-full space-y-4 overflow-hidden p-3 sm:p-4">
      <Skeleton className="h-[58px] w-full rounded-xl" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2.5 sm:gap-3">
        {Array.from({ length: 18 }).map((_, index) => (
          <div key={index} className="w-full space-y-1.5">
            <Skeleton className="aspect-3/4 w-full rounded-lg" />
            <Skeleton className="mx-auto h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
