import { Skeleton } from '@/components/ui/skeleton'
import { RecentVisitsSkeleton } from '@/features/recent'

export default function DashboardSkeleton() {
  return (
    <div className="max-h-[calc(100vh-80px)] w-full overflow-hidden p-3 sm:p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
          {/* 左栏：最近访问 + 随机摘录 */}
          <div className="order-2 space-y-4 xl:order-none xl:col-span-3">
            <RecentVisitsSkeleton />

            <div className="space-y-3">
              <Skeleton className="h-[58px] w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>

          {/* 右栏：游玩热力图 */}
          <div className="order-1 space-y-3 xl:order-none xl:col-span-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {Array.from({ length: 35 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-md" />
              ))}
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
