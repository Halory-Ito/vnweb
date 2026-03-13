'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CalendarDaysIcon, CheckIcon, Clock3Icon, PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { launchGameById } from '@/lib/game-utils'

export default function GameCard(props: GameCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLaunching, setIsLaunching] = useState(false)
  const [exePathDialogOpen, setExePathDialogOpen] = useState(false)
  const [exePathInput, setExePathInput] = useState('')
  const showSelection = Boolean(props.showSelection)
  const isSelected = Boolean(props.isSelected)
  const selectionMode = Boolean(props.selectionMode)

  const gameHref = props.href || `/game/info/${props.id}`

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

  const launchAndOpen = async (exePath?: string) => {
    if (selectionMode) {
      return
    }

    const gameId = Number(props.id)
    if (!Number.isInteger(gameId) || gameId <= 0) {
      router.push(gameHref)
      return
    }

    setIsLaunching(true)
    try {
      await launchGameById(gameId, exePath)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      router.push(gameHref)
      router.refresh()
      toast.success('游戏已启动')
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
            requireExePath?: boolean
          }
        }
        message?: string
      }

      const requireExePath = err.response?.data?.requireExePath
      if (requireExePath) {
        setExePathDialogOpen(true)
        return
      }

      toast.error(err.response?.data?.error || err.message || '启动失败')
    } finally {
      setIsLaunching(false)
    }
  }

  const handleLaunchAndOpen = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    await launchAndOpen()
  }

  const handleConfirmExePath = async () => {
    const nextExePath = exePathInput.trim()
    if (!nextExePath) {
      toast.error('请填写游戏可执行文件路径')
      return
    }

    setExePathDialogOpen(false)
    await launchAndOpen(nextExePath)
  }

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
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
        className="group relative flex w-36 flex-col items-center justify-center space-y-2 p-1"
        onClick={handleCardClick}
      >
        {showSelection ? (
          <button
            type="button"
            className={`border-border bg-background/90 absolute top-2 left-2 z-10 flex size-5 items-center justify-center rounded-full border transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={handleToggleSelect}
            aria-label={isSelected ? '取消选择' : '选择'}
          >
            {isSelected ? <CheckIcon className="size-3.5" /> : null}
          </button>
        ) : null}
        <div className="relative h-48 w-36">
          <Image
            className="h-48 w-36 cursor-pointer rounded-lg border border-transparent object-cover transition-all duration-300 hover:scale-102 hover:border-blue-500"
            src={props.cover}
            alt={props.title}
            width={144}
            height={192}
          />

          {!selectionMode ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-black/45 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-full flex-col justify-between p-2">
                <div className="flex flex-1 items-center justify-center">
                  <button
                    type="button"
                    className="bg-primary text-primary-foreground pointer-events-auto inline-flex size-10 items-center justify-center rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.45)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_18px_rgba(255,255,255,0.7)]"
                    onClick={(event) => void handleLaunchAndOpen(event)}
                    aria-label="启动并查看"
                    disabled={isLaunching}
                  >
                    <PlayIcon className="size-5" />
                  </button>
                </div>
                <div className="space-y-1 text-xs text-white">
                  <div className="flex items-center gap-1.5">
                    <Clock3Icon className="size-3.5" />
                    <span>{formatPlayTime(props.playTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="size-3.5" />
                    <span>{formatLastRunDate(props.lastRunAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div
          className="w-full truncate text-center text-xs"
          title={props.title}
        >
          {props.title}
        </div>
      </Link>

      <Dialog open={exePathDialogOpen} onOpenChange={setExePathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写游戏可执行文件路径</DialogTitle>
            <DialogDescription>
              当前游戏缺少可执行文件路径，请补充后再启动。
            </DialogDescription>
          </DialogHeader>

          <Input
            value={exePathInput}
            onChange={(event) => setExePathInput(event.target.value)}
            placeholder="例如: C:\\Games\\MyGame\\game.exe"
            disabled={isLaunching}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleConfirmExePath()
              }
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExePathDialogOpen(false)}
              disabled={isLaunching}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirmExePath()}
              disabled={isLaunching}
            >
              {isLaunching ? '启动中...' : '确认并启动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
