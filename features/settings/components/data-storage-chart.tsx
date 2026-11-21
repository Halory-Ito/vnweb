'use client'

import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Cell, Label, Pie, PieChart } from 'recharts'

import { formatResourceSize } from '../lib/data-resource-utils'
import { DataStorageLegend } from './data-storage-legend'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'

import type { ResourceChartDatum } from '../hooks/use-data-settings'
import type { LocalResourceSummary, ResourceCategory } from '../settings-api'

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

const PIE_COLORS: Record<ResourceCategory, string> = {
  image: 'var(--chart-1)',
  video: 'var(--chart-2)',
  audio: 'var(--chart-3)',
  font: 'var(--chart-4)',
}

const pieChartConfig = {
  size: { label: '占用空间' },
  image: { label: '图片', color: PIE_COLORS.image },
  video: { label: '视频', color: PIE_COLORS.video },
  audio: { label: '音频', color: PIE_COLORS.audio },
  font: { label: '字体', color: PIE_COLORS.font },
} satisfies ChartConfig

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
  const activeSummary = viewMode === 'all' ? summary : unusedSummary
  const activeChartData = viewMode === 'all' ? chartData : unusedChartData
  const pieData = activeChartData.filter((item) => item.size > 0)
  const totalSizeLabel = formatResourceSize(activeSummary.totalSize)

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

      <CardContent>
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
          <div className="flex flex-col gap-4">
            {pieData.length > 0 ? (
              <ChartContainer config={pieChartConfig} className="mx-auto h-56 w-full max-w-xs">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(_value, _name, item) => {
                          const payload = item.payload as ResourceChartDatum
                          return `${payload.label}：${formatResourceSize(payload.size)}（${payload.percent}%）`
                        }}
                      />
                    }
                  />
                  <Pie
                    data={pieData}
                    dataKey="size"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.category} fill={PIE_COLORS[entry.category]} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-base font-semibold"
                            >
                              {totalSizeLabel}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 18}
                              className="fill-muted-foreground text-xs"
                            >
                              {activeSummary.totalCount} 个文件
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
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
        )}
      </CardContent>
    </Card>
  )
}
