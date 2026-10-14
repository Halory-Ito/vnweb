'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Pagination } from '@/components/custom-pagination'
import GuideCard from '@/features/guide/components/guide-card'
import GuideSelectionToolbar from '@/features/guide/components/guide-selection-toolbar'
import { fastContainerVariants, cardVariants } from '@/features/guide/data/motion'
import { getGuideListApi } from '@/features/guide/guide-api'
import { useGuideSelection } from '@/features/guide/hooks/use-guide-selection'

export default function GuideCardList() {
  const router = useRouter()
  const { data: guides, isLoading } = useQuery({
    queryKey: ['guide-list'],
    queryFn: () => getGuideListApi(),
  })

  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

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

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!guides || guides.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">暂无攻略数据</p>
        <p className="text-muted-foreground text-xs">请先导入攻略</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
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
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        pageSizeOptions={['10', '20', '40', '80']}
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
  )
}
