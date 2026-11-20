'use client'

import { Disc3Icon, Loader2Icon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Skeleton } from '@/components/ui/skeleton'
import { OstShelfDisc } from '@/features/ost/components/ost-shelf-disc'
import { OstShelfShowcase } from '@/features/ost/components/ost-shelf-showcase'

import type { OstItem } from '../types'
import type { CSSProperties, ReactNode } from 'react'

const shelfRecordClass = 'aspect-[12/13] w-(--ost-disc-width) max-w-48 justify-self-center'

function OstShelfTier({ count, children }: { count: number; children: ReactNode }) {
  const density = Math.min(1, Math.max(0, (count - 10) / 15))
  const style = {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    columnGap: `${Math.max(0, 10 - count)}px`,
    maxWidth: `min(100rem, ${count * 10 + 3}rem)`,
    '--ost-disc-angle': `${count < 10 ? 32 + count * 2 : 52 + density * 20}deg`,
    '--ost-disc-width': `${135 + density * 105}%`,
  } satisfies CSSProperties & Record<`--${string}`, string>
  return (
    <div data-slot="ost-shelf-tier">
      <div className="grid items-end px-3 pt-8 pb-2 sm:px-5 sm:pt-12 sm:pb-3" style={style}>
        {children ?? <div aria-hidden="true" className={`invisible ${shelfRecordClass}`} />}
      </div>
      <div
        aria-hidden="true"
        className="bg-border/70 h-3 [transform:perspective(800px)_rotateX(42deg)] rounded-full border shadow-sm"
      />
    </div>
  )
}

type OstManageContentProps = {
  items: OstItem[]
  page: number
  pageDirection: number
  recordsPerTier: number
  tierCount: number
  selectedItem: OstItem | null
  batchSelection?: ReadonlySet<number>
  isLoading: boolean
  isRefetching: boolean
  onSelect: (item: OstItem) => void
  onEdit: (item: OstItem) => void
  onDelete: (item: OstItem) => void
}

export function OstManageContent({
  items,
  page,
  pageDirection,
  recordsPerTier,
  tierCount,
  selectedItem,
  batchSelection,
  isLoading,
  isRefetching,
  onSelect,
  onEdit,
  onDelete,
}: OstManageContentProps) {
  const reduceMotion = useReducedMotion()
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="rounded-2xl border-2 p-2 sm:p-5">
          <OstShelfTier count={recordsPerTier}>
            {Array.from({ length: recordsPerTier }, (_, index) => (
              <Skeleton
                key={index}
                className={`${shelfRecordClass} [transform:perspective(950px)_rotateY(var(--ost-disc-angle))] rounded-xl`}
              />
            ))}
          </OstShelfTier>
        </div>
      </div>
    )
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20">
        <Disc3Icon className="size-6" />
      </div>
      <p className="text-sm font-medium">(´・ω・`) 唱片架上还是空的</p>
      <p className="text-muted-foreground mt-1 text-xs">
        点击上方“新增 OST”，把喜欢的原声带放进唱片架吧
      </p>
    </div>
  )

  return (
    <div className="relative space-y-5">
      {isRefetching ? (
        <div className="bg-background/85 absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </div>
      ) : null}

      {/* 上方 3D 展示台 */}
      {items.length === 0 && emptyState}
      {items.length > 0 && !batchSelection && (
        <OstShelfShowcase item={selectedItem} onEdit={onEdit} onDelete={onDelete} />
      )}

      {/* 下方 3D 侧摆唱片架 */}
      <div className="rounded-2xl border-2 p-2 sm:p-5">
        <AnimatePresence initial={false}>
          <motion.div
            key={page}
            initial={
              reduceMotion || !pageDirection ? false : { opacity: 0.55, x: pageDirection * 14 }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {Array.from({ length: tierCount }, (_, index) => {
              const start = index * recordsPerTier
              const tierItems = items.slice(start, start + recordsPerTier)
              return (
                <OstShelfTier key={index} count={recordsPerTier}>
                  {tierItems.length > 0
                    ? tierItems.map((item) => (
                        <OstShelfDisc
                          key={item.id}
                          item={item}
                          isSelected={batchSelection?.has(item.id) ?? selectedItem?.id === item.id}
                          isBatchSelecting={!!batchSelection}
                          onSelect={onSelect}
                          className={shelfRecordClass}
                        />
                      ))
                    : null}
                </OstShelfTier>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
