'use client'

import { useAtomValue } from 'jotai'
import { CheckIcon, ImageOffIcon, PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useGameCardLaunch } from '../hooks/use-game-card-launch'
import { useGameCardTitleColor } from '../hooks/use-game-card-title-color'
import GameCardPlayInfo from './game-card-play-info'
import GameExePathDialog from './game-exe-path-dialog'
import { Button } from '@/components/ui/button'
import { gameCardRadiusAtom, gameCardTitleHiddenAtom } from '@/lib/settings/game-card-appearance'

export default function GameCard(props: GameCardProps) {
  const { gameHref, launch, isLaunching, exePathDialog } = useGameCardLaunch(props.id, props.href)
  const titleColor = useGameCardTitleColor(props.status)
  const titleHidden = useAtomValue(gameCardTitleHiddenAtom)
  const radius = useAtomValue(gameCardRadiusAtom)
  const [imageError, setImageError] = useState(false)
  const showSelection = Boolean(props.showSelection)
  const isSelected = Boolean(props.isSelected)
  const selectionMode = Boolean(props.selectionMode)
  const modifierSelectEnabled = Boolean(props.modifierSelectEnabled)
  const showPlayInfo = props.showPlayInfo !== false
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
        aria-label={titleHidden ? props.title : undefined}
        className="group relative flex w-full flex-col items-center p-1"
        onClick={handleCardClick}
      >
        {showSelection ? (
          <button
            type="button"
            className={`bg-background/60 absolute top-4 left-4 z-20 flex size-7 items-center justify-center rounded-full border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground scale-100 opacity-100'
                : '[@media(hover:hover)_and_(pointer:fine)]:[.group:not(:hover)_&:not(:focus-visible)]:opacity-0'
            }`}
            onClick={handleToggleSelect}
            aria-label={isSelected ? '取消选择' : '选择'}
          >
            {isSelected ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}

        <div className="relative w-full">
          <div
            className="relative aspect-3/4 w-full overflow-hidden shadow-lg transition-all duration-300 md:group-hover:shadow-2xl"
            style={{ borderRadius: radius }}
          >
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

            {showPlayInfo ? (
              <GameCardPlayInfo playTime={props.playTime} lastRunAt={props.lastRunAt} mobile />
            ) : null}

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

                {showPlayInfo ? (
                  <GameCardPlayInfo playTime={props.playTime} lastRunAt={props.lastRunAt} />
                ) : null}
              </div>
            )}
          </div>
        </div>

        {titleHidden ? null : (
          <div className="mt-2.5 w-full px-1">
            <h3
              className="line-clamp-2 text-center text-sm leading-5 font-medium wrap-anywhere"
              style={{ color: titleColor }}
              title={props.title}
            >
              {props.title}
            </h3>
          </div>
        )}
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
