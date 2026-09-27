'use client'

import { ImageOffIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { RECENT_VISIT_LABELS } from '@/features/recent/lib/visit-types'

import type { RecentVisitItem } from '@/types'

type RecentVisitCardProps = {
  item: RecentVisitItem
}

export default function RecentVisitCard({ item }: RecentVisitCardProps) {
  const [imageError, setImageError] = useState(false)
  const title = item.gameNameCn || item.gameName || '未命名游戏'
  const typeLabel = RECENT_VISIT_LABELS[item.type]
  const visitedTime = item.visitedAt ? new Date(item.visitedAt).toLocaleString('zh-CN') : ''

  return (
    <Link
      href={item.href}
      title={visitedTime ? `${title} · ${typeLabel} · ${visitedTime}` : `${title} · ${typeLabel}`}
      className="group relative flex w-full flex-col items-center transition-all duration-300 md:hover:-translate-y-1"
    >
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 md:group-hover:shadow-2xl">
        <div className="bg-primary/20 pointer-events-none absolute -inset-4 opacity-0 blur-3xl transition-opacity duration-500 md:group-hover:opacity-60" />

        {imageError || !item.gameCover ? (
          <div className="bg-muted flex h-full w-full flex-col items-center justify-center gap-2">
            <ImageOffIcon className="text-muted-foreground size-8" />
            <span className="text-muted-foreground text-xs">暂无封面</span>
          </div>
        ) : (
          <Image
            src={item.gameCover}
            alt={title}
            fill
            sizes="(min-width: 640px) 148px, 45vw"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 md:group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        )}

        {/* 入口类型（右上角） */}
        <Badge
          variant="outline"
          className="pointer-events-none absolute top-1.5 right-1.5 z-10 border-white/20 bg-black/60 px-1.5 py-0 text-[11px] leading-5 text-white shadow-sm backdrop-blur-sm"
        >
          {typeLabel}
        </Badge>
      </div>

      <div className="mt-1.5 w-full">
        <h3 className="md:group-hover:text-primary truncate text-center text-xs leading-4.5 font-medium tracking-wide transition-colors sm:text-sm sm:leading-5">
          {title}
        </h3>
      </div>
    </Link>
  )
}
