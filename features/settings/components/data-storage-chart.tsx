'use client'

import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { DataImageUsage } from './data-image-usage'
import { DataStorageLegend } from './data-storage-legend'
import { DataStorageOverview, PIE_COLORS } from './data-storage-overview'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import type { ResourceChartDatum } from '../hooks/use-data-settings'
import type { LocalResourceSummary } from '../settings-api'

type ResourceViewMode = 'all' | 'unused'

interface DataStorageChartProps {
  summary: LocalResourceSummary
  unusedSummary: LocalResourceSummary
  chartData: ResourceChartDatum[]
  unusedChartData: ResourceChartDatum[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isCleaning: boolean
  onRefresh: () => void
  onRequestCleanup: () => void
}

export function DataStorageChart({
  summary,
  unusedSummary,
  chartData,
  unusedChartData,
  isLoading,
  isFetching,
  isError,
  isCleaning,
  onRefresh,
  onRequestCleanup,
}: DataStorageChartProps) {
  const [viewMode, setViewMode] = useState<ResourceViewMode>('all')
  const [imageUsageOpen, setImageUsageOpen] = useState(false)
  const activeSummary = viewMode === 'all' ? summary : unusedSummary
  const activeChartData = viewMode === 'all' ? chartData : unusedChartData
  const pieData = activeChartData.filter((item) => item.size > 0)
  const showImageUsage = imageUsageOpen && activeSummary.categories.image.count > 0

  return (
    <Card variant="outline">
      <CardHeader>
        <CardTitle className="text-base">空间占比分布</CardTitle>
        <CardAction className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            全部
          </Button>
          <Button
            variant={viewMode === 'unused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('unused')}
          >
            未使用 ({unusedSummary.totalCount})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isLoading || isCleaning || unusedSummary.totalCount === 0}
            onClick={onRequestCleanup}
          >
            <Trash2 className="mr-1.5 size-4" />
            {isCleaning ? '清理中...' : '清理未使用'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching || isCleaning}
            title="重新扫描本地资源"
          >
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="@container">
        {isError ? (
          <div className="flex flex-col items-start gap-3 py-4 text-sm">
            <span className="text-destructive">加载本地静态资源统计失败</span>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isFetching}>
              {isFetching ? '重试中...' : '重试'}
            </Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div
            className={cn(
              'grid grid-cols-[minmax(0,1fr)] @min-[36rem]:grid-rows-[auto] motion-safe:transition-[grid-template-columns,grid-template-rows,gap] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.25,0.8,0.25,1)]',
              showImageUsage
                ? 'grid-rows-[auto_minmax(0,1fr)] gap-5 @min-[36rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'
                : 'grid-rows-[auto_minmax(0,0fr)] gap-0 @min-[36rem]:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]',
            )}
          >
            <div className="flex min-w-0 flex-col gap-4">
              {pieData.length > 0 ? (
                <DataStorageOverview
                  pieData={pieData}
                  totalSize={activeSummary.totalSize}
                  totalCount={activeSummary.totalCount}
                  imageUsageOpen={showImageUsage}
                  onToggleImageUsage={() => setImageUsageOpen((open) => !open)}
                />
              ) : (
                <div className="text-muted-foreground flex h-56 items-center justify-center text-sm">
                  {viewMode === 'unused' ? '暂无未使用的静态资源' : '暂无本地静态资源'}
                </div>
              )}

              <DataStorageLegend
                items={activeChartData}
                unusedSummary={unusedSummary}
                showUnusedRow={viewMode === 'all'}
                colors={PIE_COLORS}
                onSelectUnused={() => setViewMode('unused')}
              />
            </div>
            <div
              inert={!showImageUsage}
              className={cn(
                'min-h-0 min-w-0 overflow-clip motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)]',
                showImageUsage ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div className="@min-[36rem]:min-w-64">
                <DataImageUsage summary={activeSummary} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
