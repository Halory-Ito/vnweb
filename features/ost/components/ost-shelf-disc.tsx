'use client'

import { Disc3Icon } from 'lucide-react'
import { memo, useState } from 'react'

import { cn } from '@/lib/utils'

import type { OstItem } from '../types'

type OstShelfDiscProps = {
  item: OstItem
  isSelected: boolean
  onSelect: (item: OstItem) => void
}

export const OstShelfDisc = memo(function OstShelfDisc({
  item,
  isSelected,
  onSelect,
}: OstShelfDiscProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      title={item.name}
      aria-pressed={isSelected}
      className={cn(
        'group relative h-44 w-40 shrink-0 cursor-pointer text-left [transform-style:preserve-3d] transition-transform duration-500 ease-out sm:h-52 sm:w-48',
        isSelected
          ? 'z-40 [transform:perspective(950px)_translate3d(0,-28px,42px)_rotateY(14deg)]'
          : '[transform:perspective(950px)_rotateY(52deg)_rotateX(4deg)] hover:z-30 hover:[transform:perspective(950px)_translate3d(0,-16px,22px)_rotateY(28deg)]',
      )}
    >
      {/* 3D 左侧唱片脊背厚度面 */}
      <div
        aria-hidden="true"
        className={cn(
          'bg-muted/95 pointer-events-none absolute top-0 left-0 flex h-full w-4 origin-left items-center justify-center overflow-hidden rounded-l-sm border-y border-l [transform:rotateY(-90deg)] sm:w-5',
          isSelected ? 'border-primary/70' : 'border-border',
        )}
      >
        <span className="text-muted-foreground line-clamp-1 px-0.5 text-[10px] font-medium tracking-wider [writing-mode:vertical-rl]">
          {item.name}
        </span>
      </div>

      {/* 唱片正面封套（仅展示纯净封面） */}
      <div
        className={cn(
          'bg-background relative flex h-full w-full flex-col overflow-hidden rounded-r-xl rounded-l-xs border-2 transition-all duration-300 [backface-visibility:hidden]',
          isSelected
            ? 'border-primary shadow-2xl ring-2 ring-primary/25'
            : 'group-hover:border-primary/60 shadow-lg',
        )}
      >
        {item.cover && !imgError ? (
          <img
            src={item.cover}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="bg-muted/40 flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
            <Disc3Icon className="text-muted-foreground/45 size-10" />
            <span className="text-muted-foreground line-clamp-2 text-xs">{item.name}</span>
          </div>
        )}

        {/* 柔和表面微光泽 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/15 via-transparent to-white/20"
        />
      </div>
    </button>
  )
})
