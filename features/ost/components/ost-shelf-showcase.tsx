'use client'

import { useQueryClient } from '@tanstack/react-query'
import { Disc3Icon, ExternalLinkIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { getOstSongs } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { OstItem } from '../types'
import type { MouseEvent } from 'react'

type OstShelfShowcaseProps = {
  item: OstItem | null
  onEdit: (item: OstItem) => void
  onDelete: (item: OstItem) => void
}

export function OstShelfShowcase({ item, onEdit, onDelete }: OstShelfShowcaseProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [failedCover, setFailedCover] = useState<string | null>(null)
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 })

  const itemId = item?.id
  const detailHref = itemId ? `/ost/${itemId}` : '/ost'

  // 选中唱片后自动预取详情页路由与歌曲列表缓存，点击打开实现零等待秒开
  const prefetchDetail = useCallback(() => {
    if (!itemId) return
    router.prefetch(`/ost/${itemId}`)
    void queryClient.prefetchQuery({
      queryKey: ['ost-songs', itemId],
      queryFn: () => getOstSongs(itemId),
      staleTime: 30_000,
    })
  }, [itemId, queryClient, router])

  useEffect(() => {
    prefetchDetail()
  }, [prefetchDetail])

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({
      rotateX: Number((-py * 16).toFixed(2)),
      rotateY: Number((px * 20).toFixed(2)),
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 })
  }, [])

  if (!item) {
    return null
  }

  const gameTitle = item.gameNameCn || item.gameName
  const imgError = failedCover === item.cover

  return (
    <div className="bg-muted/20 rounded-2xl border-2 p-4 sm:p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6 sm:flex-row sm:items-center"
        >
          {/* 3D 视差唱片封套 + 滑出旋转黑胶 */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={prefetchDetail}
            className="relative shrink-0 py-2 pr-14 [perspective:1000px] sm:pr-20"
          >
            <div
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
              }}
            >
              {/* 滑出的旋转黑胶 */}
              <motion.div
                layoutId={`ost-vinyl-${item.id}`}
                aria-hidden="true"
                initial={{ x: -36, rotate: 0 }}
                animate={{ x: 0, rotate: 200 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute top-2 -right-14 z-0 size-36 rounded-full border border-zinc-700/80 bg-zinc-900 shadow-xl sm:-right-18 sm:size-44"
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle at center, #18181b 0px, #18181b 3px, #27272a 4px, #18181b 5px)',
                }}
              >
                <div className="bg-background absolute top-1/2 left-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-rose-400/70" />
              </motion.div>

              {/* 唱片盒封面本体（与曲目列表页共享 layoutId） */}
              <Link href={detailHref} prefetch className="block">
                <motion.div
                  layoutId={`ost-cover-${item.id}`}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className="bg-background relative z-10 size-40 cursor-pointer overflow-hidden rounded-xl border-2 shadow-xl sm:size-48"
                >
                  {item.cover && !imgError ? (
                    <img
                      src={item.cover}
                      alt={item.name}
                      onError={() => setFailedCover(item.cover)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                      <Disc3Icon className="text-muted-foreground/40 size-14" />
                    </div>
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/0 via-white/10 to-white/25 opacity-70"
                  />
                </motion.div>
              </Link>
            </div>
          </div>

          {/* 唱片信息与快捷操作 */}
          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                已从唱片架抽出
              </Badge>
              {gameTitle ? (
                <Badge
                  variant="outline"
                  className="max-w-full truncate rounded-full px-2.5 py-0.5 text-xs"
                >
                  {gameTitle}
                </Badge>
              ) : null}
            </div>

            <motion.h2
              layoutId={`ost-title-${item.id}`}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="line-clamp-2 text-lg font-semibold tracking-tight sm:text-xl"
            >
              {item.name}
            </motion.h2>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                asChild
              >
                <Link href={detailHref} prefetch>
                  <ExternalLinkIcon className="size-3.5" />
                  打开曲目列表
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => onEdit(item)}
              >
                <PencilIcon className="size-3.5" />
                编辑
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive rounded-full"
                onClick={() => onDelete(item)}
              >
                <Trash2Icon className="size-3.5" />
                删除
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
