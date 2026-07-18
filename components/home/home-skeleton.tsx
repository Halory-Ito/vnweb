import { Skeleton } from '../ui/skeleton'

export default function GameHomeSkeleton() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="mb-4 flex items-center space-x-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-44" />
          <Skeleton className="size-9" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
        </div>
      </div>
    </div>
  )
}
