import { Skeleton } from '@/components/ui/skeleton'

export default function GameInfoSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 md:p-6">
      <div className="w-full rounded-lg">
        <div className="flex flex-col items-center justify-center rounded-md p-4 md:flex-row md:justify-between">
          <div className="w-full max-w-xl space-y-3">
            <Skeleton className="h-14 w-40 md:h-20 md:w-56" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <Skeleton className="h-56 w-40 shrink-0 rounded-md border" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-16" />
        </div>
        <div className="rounded-md border p-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
