'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { Pagination } from '@/components/custom-pagination'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import GuideCard from '@/features/guide/components/guide-card'
import { GuideGridRowsSelect } from '@/features/guide/components/guide-grid-rows-select'
import GuideSelectionToolbar from '@/features/guide/components/guide-selection-toolbar'
import { fastContainerVariants, cardVariants } from '@/features/guide/data/motion'
import { getGuideListApi } from '@/features/guide/guide-api'
import {
  GUIDE_GRID_COLUMN_OPTIONS,
  useGuideGridLayout,
} from '@/features/guide/hooks/use-guide-grid-layout'
import { useGuideSelection } from '@/features/guide/hooks/use-guide-selection'

export default function GuideCardList() {
  const router = useRouter()
  const { data: guides, isLoading } = useQuery({
    queryKey: ['guide-list'],
    queryFn: () => getGuideListApi(),
  })

  const {
    containerRef,
    rowCount,
    columnCount,
    pageSize,
    page,
    setPage,
    setRowCount,
    setColumnCount,
  } = useGuideGridLayout()

  const {
    selectedIds,
    isDeleting,
    isSelectionMode,
    toggleSelect,
    clearSelection,
    selectAll,
    deleteSelected,
  } = useGuideSelection()

  const allItems = guides ?? []
  const total = allItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = useMemo(
    () => allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allItems, currentPage, pageSize],
  )

  return (
    <div ref={containerRef} className="w-full">
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : !guides || guides.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-4">
          <EmptyArtwork />
          <p className="text-muted-foreground text-sm">暂无攻略数据</p>
          <p className="text-muted-foreground text-xs">请先导入攻略</p>
        </div>
      ) : (
        <div className="space-y-4">
          <motion.div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
            variants={fastContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {items.map((guide) => (
              <motion.div key={guide.id} variants={cardVariants}>
                <GuideCard
                  guide={guide}
                  selectionMode={isSelectionMode}
                  isSelected={selectedIds.includes(guide.id)}
                  onToggleSelect={toggleSelect}
                  onClick={() => router.push('/guide/' + guide.gameId)}
                />
              </motion.div>
            ))}
          </motion.div>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            itemUnit="篇"
            itemName="攻略"
            extraControls={<GuideGridRowsSelect value={rowCount} onChange={setRowCount} />}
            onPageChange={setPage}
            sizeSelection={{ label: '每行', value: columnCount, unit: '列' }}
            pageSizeOptions={[...GUIDE_GRID_COLUMN_OPTIONS]}
            onPageSizeChange={setColumnCount}
          />

          {isSelectionMode ? (
            <GuideSelectionToolbar
              selectedCount={selectedIds.length}
              totalCount={total}
              isDeleting={isDeleting}
              onSelectAll={() => selectAll(allItems.map((item) => item.id))}
              onClear={clearSelection}
              onConfirmDelete={deleteSelected}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
