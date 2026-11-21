'use client'

import { useState } from 'react'

import { useDataSettings } from '../hooks/use-data-settings'
import { formatResourceSize } from '../lib/data-resource-utils'
import { DataStorageChart } from './data-storage-chart'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function DataSettings() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    summary,
    unusedSummary,
    chartData,
    unusedChartData,
    isLoading,
    isFetching,
    isError,
    isCleaning,
    refetch,
    cleanupUnused,
  } = useDataSettings()

  return (
    <div className="pt-2">
      <DataStorageChart
        summary={summary}
        unusedSummary={unusedSummary}
        chartData={chartData}
        unusedChartData={unusedChartData}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        isCleaning={isCleaning}
        onRefresh={() => void refetch()}
        onRequestCleanup={() => setConfirmOpen(true)}
      />

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!isCleaning) {
            setConfirmOpen(open)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清理未使用静态资源</AlertDialogTitle>
            <AlertDialogDescription>
              将永久删除 {unusedSummary.totalCount} 个未被数据库及配置引用的本地文件（共{' '}
              {formatResourceSize(unusedSummary.totalSize)}），此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCleaning}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCleaning}
              onClick={(e) => {
                e.preventDefault()
                cleanupUnused(() => setConfirmOpen(false))
              }}
            >
              {isCleaning ? '清理中...' : '确认清理'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
