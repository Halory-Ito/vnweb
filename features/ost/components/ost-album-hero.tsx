'use client'

import { ArrowLeftIcon, Disc3Icon, Music2Icon, PlayIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { OstManageItem } from '@/types'

type OstAlbumHeroProps = {
  ostId: number
  ostItem: OstManageItem | null
  songCount: number
  isPlaying: boolean
  onPlayAll: () => void
}

export function OstAlbumHero({
  ostId,
  ostItem,
  songCount,
  isPlaying,
  onPlayAll,
}: OstAlbumHeroProps) {
  const router = useRouter()
  const [failedCover, setFailedCover] = useState<string | null>(null)

  const gameTitle = ostItem?.gameNameCn || ostItem?.gameName
  const imgError = ostItem?.cover ? failedCover === ostItem.cover : true

  return (
    <div className="bg-muted/20 flex flex-col gap-5 rounded-2xl border-2 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          onClick={() => router.back()}
          aria-label="返回唱片架"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>

        {/* 专辑封面 + 右侧露出的旋转黑胶 */}
        <div className="relative shrink-0 pr-8">
          <motion.div
            layoutId={`ost-vinyl-${ostId}`}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1.5 right-0 size-24 rounded-full border border-zinc-700/80 bg-zinc-900 shadow-md sm:size-28',
              isPlaying && 'animate-[spin_8s_linear_infinite]',
            )}
            style={{
              backgroundImage:
                'repeating-radial-gradient(circle at center, #18181b 0px, #18181b 2.5px, #27272a 3.5px, #18181b 4.5px)',
            }}
          >
            <div className="bg-background absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-3 border-rose-400/70" />
          </motion.div>

          <motion.div
            layoutId={`ost-cover-${ostId}`}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="bg-background relative z-1 size-28 overflow-hidden rounded-xl border-2 shadow-md sm:size-32"
          >
            {ostItem?.cover && !imgError ? (
              <img
                src={ostItem.cover}
                alt={ostItem.name}
                onError={() => setFailedCover(ostItem.cover)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                <Disc3Icon className="text-muted-foreground/40 size-10" />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* 专辑元信息 */}
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {gameTitle ? (
            <Badge
              variant="outline"
              className="max-w-full truncate rounded-full px-2.5 py-0.5 text-xs"
            >
              {gameTitle}
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
            <Music2Icon className="size-3" />
            {songCount} 首曲目
          </Badge>
        </div>

        <motion.h1
          layoutId={`ost-title-${ostId}`}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="line-clamp-2 text-lg font-semibold tracking-tight sm:text-xl"
        >
          {ostItem?.name || '正在打开专辑...'}
        </motion.h1>

        {songCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={onPlayAll}
          >
            <PlayIcon className="size-3.5" />
            从第一首播放
          </Button>
        ) : null}
      </div>
    </div>
  )
}
