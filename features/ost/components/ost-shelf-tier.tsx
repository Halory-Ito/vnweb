'use client'

import { AnimatePresence, motion } from 'motion/react'

import { Skeleton } from '@/components/ui/skeleton'
import { OstShelfDisc } from '@/features/ost/components/ost-shelf-disc'
import {
  discRestingState,
  getDiscEnterInitial,
  getDiscEnterTransition,
  getShelfTierStyle,
  shelfRecordClass,
  tierRowVariants,
} from '@/features/ost/lib/ost-shelf-motion'
import { cn } from '@/lib/utils'

import type { OstItem } from '../types'
import type { TierMotionCustom } from '@/features/ost/lib/ost-shelf-motion'

const shelfPlank = (
  <div
    aria-hidden="true"
    className="bg-border/70 h-3 [transform:perspective(800px)_rotateX(42deg)] rounded-full border shadow-sm"
  />
)

export function OstShelfTierSkeleton({ count }: { count: number }) {
  return (
    <div data-slot="ost-shelf-tier">
      <div
        className="grid items-end px-3 pt-8 pb-2 sm:px-5 sm:pt-12 sm:pb-3"
        style={getShelfTierStyle(count)}
      >
        {Array.from({ length: count }, (_, index) => (
          <Skeleton
            key={index}
            className={`${shelfRecordClass} [transform:perspective(950px)_rotateY(var(--ost-disc-angle))] rounded-xl`}
          />
        ))}
      </div>
      {shelfPlank}
    </div>
  )
}

type OstShelfTierProps = {
  tierIndex: number
  count: number
  page: number
  pageDirection: number
  items: OstItem[]
  selectedId: number | null
  batchSelection?: ReadonlySet<number>
  reduceMotion: boolean
  onSelect: (item: OstItem) => void
}

export function OstShelfTier({
  tierIndex,
  count,
  page,
  pageDirection,
  items,
  selectedId,
  batchSelection,
  reduceMotion,
  onSelect,
}: OstShelfTierProps) {
  const style = getShelfTierStyle(count)
  const motionCustom: TierMotionCustom = { direction: pageDirection, tierIndex, reduceMotion }
  const shouldAnimateDisc = !reduceMotion && pageDirection !== 0
  const staggerStep = items.length > 1 ? Math.min(0.024, 0.16 / (items.length - 1)) : 0

  return (
    <div data-slot="ost-shelf-tier">
      <div className="grid">
        <AnimatePresence initial={false} custom={motionCustom}>
          <motion.div
            key={page}
            custom={motionCustom}
            variants={tierRowVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="col-start-1 row-start-1 grid items-end px-3 pt-8 pb-2 sm:px-5 sm:pt-12 sm:pb-3"
            style={style}
          >
            {items.length > 0 ? (
              items.map((item, index) => {
                const isSelected = batchSelection?.has(item.id) ?? selectedId === item.id
                const order = pageDirection < 0 ? items.length - 1 - index : index
                const discDelay = tierIndex * 0.035 + order * staggerStep
                return (
                  <motion.div
                    key={item.id}
                    initial={shouldAnimateDisc ? getDiscEnterInitial(pageDirection) : false}
                    animate={discRestingState}
                    transition={
                      shouldAnimateDisc ? getDiscEnterTransition(discDelay) : { duration: 0 }
                    }
                    className={cn(
                      shelfRecordClass,
                      'relative origin-bottom',
                      isSelected && !batchSelection ? 'z-40' : 'focus-within:z-30 hover:z-30',
                    )}
                  >
                    <OstShelfDisc
                      item={item}
                      isSelected={isSelected}
                      isBatchSelecting={!!batchSelection}
                      onSelect={onSelect}
                      className="h-full w-full"
                    />
                  </motion.div>
                )
              })
            ) : (
              <div aria-hidden="true" className={`invisible ${shelfRecordClass}`} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {shelfPlank}
    </div>
  )
}
