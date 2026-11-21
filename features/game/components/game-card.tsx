'use client'

import { CalendarDaysIcon, CheckIcon, Clock3Icon, ImageOffIcon, PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useGameCardLaunch } from '../hooks/use-game-card-launch'
import GameExePathDialog from './game-exe-path-dialog'
import GameStatusBadge from './game-status-badge'
import { Button } from '@/components/ui/button'

export default function GameCard(props: GameCardProps) {
  const { gameHref, launch, isLaunching, exePathDialog } = useGameCardLaunch(props.id, props.href)
  const [imageError, setImageError] = useState(false)
  const showSelection = Boolean(props.showSelection)
  const isSelected = Boolean(props.isSelected)
  const selectionMode = Boolean(props.selectionMode)
  const modifierSelectEnabled = Boolean(props.modifierSelectEnabled)
  const showPlayInfo = props.showPlayInfo !== false
  const formatPlayTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0)
    const hours = safeSeconds / 3600
    return `${hours.toFixed(1)}h`
  }

  const formatLastRunDate = (value: string) => {
    if (!value) {
      return '-'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleLaunchAndOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!selectionMode) launch()
  }

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (modifierSelectEnabled && props.onToggleSelect && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      props.onToggleSelect(props.id)
      return
    }

    if (!showSelection || !selectionMode || !props.onToggleSelect) {
      return
    }
    event.preventDefault()
    props.onToggleSelect(props.id)
  }

  const handleToggleSelect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    props.onToggleSelect?.(props.id)
  }

  return (
    <>
      <Link
        href={gameHref}
        className="group relative flex w-full flex-col items-center p-1"
        onClick={handleCardClick}
      >
        {showSelection ? (
          <button
            type="button"
            className={`bg-background/60 absolute top-4 left-4 z-20 flex size-7 items-center justify-center rounded-full border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground scale-100 opacity-100'
                : 'scale-90 opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100'
            }`}
            onClick={handleToggleSelect}
            aria-label={isSelected ? '取消选择' : '选择'}
          >
            {isSelected ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}

        <div className="relative w-full">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 md:group-hover:shadow-2xl">
            <div className="bg-primary/20 pointer-events-none absolute -inset-4 opacity-0 blur-3xl transition-opacity duration-500 md:group-hover:opacity-60" />

            {imageError ? (
              <div className="bg-muted flex h-full w-full flex-col items-center justify-center gap-2">
                <ImageOffIcon className="text-muted-foreground size-8" />
                <span className="text-muted-foreground text-xs">封面加载失败</span>
              </div>
            ) : (
              <Image
                className="h-full w-full cursor-pointer object-cover"
                src={props.cover}
                alt={props.title}
                loading="eager"
                fill
                sizes="176px"
                fetchPriority="high"
                onError={() => {
                  setImageError(true)
                  toast.error(`"${props.title}" 封面加载失败`, {
                    description: '外部图片链接可能已失效或网络不稳定',
                  })
                }}
              />
            )}

            <GameStatusBadge status={props.status} />

            {showPlayInfo && (
              <div className="absolute right-2 bottom-2 left-2 space-y-1 md:hidden">
                <div className="flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
                  <Clock3Icon className="size-3 text-white/80" />
                  <span className="text-xs font-medium text-white">
                    {formatPlayTime(props.playTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1">
                  <CalendarDaysIcon className="size-3 text-white/80" />
                  <span className="text-xs text-white/90">
                    {formatLastRunDate(props.lastRunAt)}
                  </span>
                </div>
              </div>
            )}

            {!selectionMode && (
              <div className="absolute inset-0 hidden flex-col items-center justify-center bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-300 md:flex md:group-hover:opacity-100">
                {!props.href && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-5 size-14 rounded-full bg-white/20 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/60 hover:shadow-xl dark:bg-black/20 dark:hover:bg-black/60"
                    onClick={handleLaunchAndOpen}
                    disabled={isLaunching}
                  >
                    <PlayIcon size={24} />
                  </Button>
                )}

                {showPlayInfo && (
                  <div className="absolute right-3 bottom-3 left-3 space-y-1.5">
                    {/* 游戏时长 */}
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                      <Clock3Icon className="size-3 text-white/80" />
                      <span className="text-xs font-medium text-white">
                        {formatPlayTime(props.playTime)}
                      </span>
                    </div>
                    {/* 上次游玩 */}
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                      <CalendarDaysIcon className="size-3 text-white/80" />
                      <span className="text-xs text-white/90">
                        {formatLastRunDate(props.lastRunAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2.5 w-full px-1">
          <h3
            className="md:group-hover:text-primary truncate text-center text-sm leading-5 font-medium tracking-wide transition-colors"
            title={props.title}
          >
            {props.title}
          </h3>
        </div>
      </Link>

      {exePathDialog.open ? (
        <GameExePathDialog
          {...exePathDialog}
          onConfirm={() => {
            if (!selectionMode) exePathDialog.onConfirm()
          }}
        />
      ) : null}
    </>
  )
}
