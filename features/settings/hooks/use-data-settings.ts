'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

import {
  formatResourceSize,
  RESOURCE_CATEGORY_META,
  RESOURCE_CATEGORY_ORDER,
} from '../lib/data-resource-utils'
import {
  cleanupUnusedResourcesApi,
  getLocalResourcesApi,
  type LocalResourceSummary,
  type ResourceCategory,
} from '../settings-api'

const EMPTY_SUMMARY: LocalResourceSummary = {
  totalCount: 0,
  totalSize: 0,
  imagesByUsage: {},
  categories: {
    image: { count: 0, size: 0 },
    video: { count: 0, size: 0 },
    audio: { count: 0, size: 0 },
    font: { count: 0, size: 0 },
  },
}

export type ResourceChartDatum = {
  category: ResourceCategory
  label: string
  count: number
  size: number
  sizeMB: number
  percent: number
}

function buildChartData(summary: LocalResourceSummary): ResourceChartDatum[] {
  return RESOURCE_CATEGORY_ORDER.map((category) => {
    const stats = summary.categories[category]
    const percent =
      summary.totalSize > 0 ? Number(((stats.size / summary.totalSize) * 100).toFixed(1)) : 0
    return {
      category,
      label: RESOURCE_CATEGORY_META[category].label,
      count: stats.count,
      size: stats.size,
      sizeMB: Number((stats.size / (1024 * 1024)).toFixed(2)),
      percent,
    }
  })
}

export function useDataSettings() {
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['settings-local-resources'],
    queryFn: getLocalResourcesApi,
  })

  const cleanupMutation = useMutation({
    mutationFn: cleanupUnusedResourcesApi,
    onSuccess: (result) => {
      if (result.deleted.length > 0) {
        const freed = formatResourceSize(result.freedBytes ?? 0)
        toast.success(`已清理 ${result.deleted.length} 个未使用资源，释放 ${freed}`)
      } else {
        toast.info('没有可清理的未使用资源')
      }
      if (result.failed.length > 0) {
        toast.error(`${result.failed.length} 个文件清理失败`)
      }
      void queryClient.invalidateQueries({ queryKey: ['settings-local-resources'] })
    },
    onError: (error) => {
      toast.error((error as Error).message || '清理未使用资源失败')
    },
  })

  const summary = data?.summary ?? EMPTY_SUMMARY
  const unusedSummary = data?.unusedSummary ?? EMPTY_SUMMARY

  const chartData = useMemo<ResourceChartDatum[]>(() => buildChartData(summary), [summary])
  const unusedChartData = useMemo<ResourceChartDatum[]>(
    () => buildChartData(unusedSummary),
    [unusedSummary],
  )

  return {
    summary,
    unusedSummary,
    chartData,
    unusedChartData,
    isLoading,
    isFetching,
    isError,
    isCleaning: cleanupMutation.isPending,
    refetch,
    cleanupUnused: (onDone?: () => void) => {
      cleanupMutation.mutate(undefined, {
        onSettled: () => onDone?.(),
      })
    },
  }
}
