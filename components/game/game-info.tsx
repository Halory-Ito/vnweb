import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { Play, Settings, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '../ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import GameBasicInfoDialog from './dialog/game-basic-info-dialog'
import GamePlayTimeDialog from './dialog/game-play-time-dialog'
import GameRatingDialog from './dialog/game-rating-dialog'
import GameUpdateDataDialog from './dialog/game-update-data-dialog'
import GameSettingsPanel from './game-settings-panel'
import GameOverview from './info/game-overview'
import GameStats from './info/game-stats'
import { gameFilterAtom } from '@/atom/global'
import GameOSTDialog from '@/components/game/dialog/game-ost-dialog'
import GamePVDialog from '@/components/game/dialog/game-pv-dialog'
import GameOST from '@/components/game/info/game-ost'
import GamePV from '@/components/game/info/game-pv'
import {
  GameDetail,
  launchGameById,
  stopGameById,
  updateGamePlayStatusById,
} from '@/lib/game-utils'

import type { GameFilterState } from '@/types/game-types'

type GameInfoProps = {
  game: GameDetail
}

const formatHours = (seconds: number) => {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = safe / 3600
  return `${hours.toFixed(1)} 小时`
}

export default function GameInfo({ game }: GameInfoProps) {
  const title = game.nameCn || game.name
  const [basicInfoOpen, setBasicInfoOpen] = useState(false)
  const [updateDataOpen, setUpdateDataOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [playTimeOpen, setPlayTimeOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [pvDialogOpen, setPvDialogOpen] = useState(false)
  const [ostDialogOpen, setOstDialogOpen] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isRunning, setIsRunning] = useState(game.isRunning)
  const [playStatus, setPlayStatus] = useState(game.playStatus)
  const [rating, setRating] = useState(game.rating ?? 0)
  const [sessionSeconds, setSessionSeconds] = useState(
    game.currentSessionSeconds,
  )
  const queryClient = useQueryClient()
  const router = useRouter()
  const [, setGameFilter] = useAtom(gameFilterAtom)

  const applyTagFilter = (
    field: keyof GameFilterState,
    value: string,
    fieldLabel: string,
  ) => {
    if (!value || value === '-') {
      return
    }

    setGameFilter((prev) => ({
      ...prev,
      [field]: value,
    }))
    router.push('/game/home')
    toast.success(`已按${fieldLabel}筛选：${value}`)
  }

  useEffect(() => {
    setIsRunning(game.isRunning)
    setPlayStatus(game.playStatus)
    setRating(game.rating ?? 0)
    setSessionSeconds(game.currentSessionSeconds)
  }, [
    game.id,
    game.isRunning,
    game.playStatus,
    game.rating,
    game.currentSessionSeconds,
  ])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const timer = window.setInterval(() => {
      setSessionSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isRunning])

  const totalPlayTimeText = formatHours(
    game.totalPlayTime + (isRunning ? sessionSeconds : 0),
  )

  const launchGame = async (exePath?: string) => {
    setIsLaunching(true)
    try {
      await launchGameById(game.id, exePath)
      setIsRunning(true)
      setSessionSeconds(0)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(game.id)],
      })
      router.refresh()
      toast.success('游戏已启动')
    } catch (error) {
      const err = error as {
        response?: {
          status?: number
          data?: {
            error?: string
            requireExePath?: boolean
          }
        }
        message?: string
      }

      const requireExePath = err.response?.data?.requireExePath
      if (requireExePath) {
        const input = window.prompt(
          '请填写游戏可执行文件路径',
          game.exePath || '',
        )
        const nextExePath = input?.trim()
        if (nextExePath) {
          setIsLaunching(false)
          await launchGame(nextExePath)
          return
        }
      }

      toast.error(err.response?.data?.error || err.message || '启动失败')
    } finally {
      setIsLaunching(false)
    }
  }

  const stopGame = async () => {
    setIsStopping(true)
    try {
      await stopGameById(game.id)
      setIsRunning(false)
      setSessionSeconds(0)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(game.id)],
      })
      router.refresh()
      toast.success('游戏已结束')
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '结束失败')
    } finally {
      setIsStopping(false)
    }
  }

  const updatePlayStatus = async (nextStatus: number) => {
    if (nextStatus === playStatus) {
      return
    }

    setIsUpdatingStatus(true)
    try {
      await updateGamePlayStatusById(game.id, nextStatus)
      setPlayStatus(nextStatus)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(game.id)],
      })
      router.refresh()
      toast.success('游玩状态已更新')
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '状态更新失败')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEditGamePV = () => {
    setPvDialogOpen(true)
  }

  const handleEditGameOST = () => {
    setOstDialogOpen(true)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full space-y-6 p-4 md:p-6">
          <div className="w-full rounded-lg">
            <div className="flex flex-col items-center justify-center rounded-md p-4 md:flex-row md:justify-between">
              <div className="space-y-3">
                <div>
                  {game.logo ? (
                    <img
                      src={game.logo}
                      alt={`${title} 徽标`}
                      className="max-h-24 w-auto object-contain md:max-h-32"
                    />
                  ) : null}
                </div>
                <div className="text-2xl font-bold">{title || '-'}</div>
                <div className="text-sm">{game.name || '-'}</div>
                <div className="flex gap-2">
                  {isRunning ? (
                    <Button
                      variant="destructive"
                      disabled={isStopping}
                      onClick={() => void stopGame()}
                    >
                      <Square className="size-4" />
                      {isStopping ? '结束中...' : '结束游戏'}
                    </Button>
                  ) : (
                    <Button
                      disabled={isLaunching}
                      variant={'outline'}
                      onClick={() => void launchGame()}
                    >
                      <Play className="size-4" />
                      {isLaunching ? '启动中...' : '开始游戏'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="size-4" />
                    设置
                  </Button>
                </div>
              </div>

              <div className="w-fit shrink-0">
                {game.cover ? (
                  <img
                    src={game.cover}
                    alt={title}
                    className="h-auto w-40 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-56 w-40 items-center justify-center rounded-md border text-sm">
                    游戏封面
                  </div>
                )}
              </div>
            </div>
          </div>

          <GameStats
            totalPlayTimeText={totalPlayTimeText}
            lastLaunchedAt={game.lastLaunchedAt}
            playStatus={playStatus}
            isRunning={isRunning}
            sessionSeconds={sessionSeconds}
            rating={rating}
            isUpdatingStatus={isUpdatingStatus}
            onOpenPlayTime={() => setPlayTimeOpen(true)}
            onOpenRating={() => setRatingOpen(true)}
            onUpdatePlayStatus={(status) => {
              void updatePlayStatus(status)
            }}
          />

          <div>
            <Tabs defaultValue="overview" className="mx-auto w-full">
              <TabsList className="mx-auto dark:bg-transparent">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="pv">PV</TabsTrigger>
                <TabsTrigger value="ost">OST</TabsTrigger>
                <TabsTrigger value="record">记录</TabsTrigger>
                <TabsTrigger value="memory">回忆</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <GameOverview game={game} onApplyTagFilter={applyTagFilter} />
              </TabsContent>

              <TabsContent value="pv">
                <div className="rounded-md border p-4 text-sm">
                  <GamePV gameId={game.id} />
                </div>
              </TabsContent>

              <TabsContent value="ost">
                <div className="rounded-md border p-4 text-sm">
                  <GameOST gameId={game.id} cover={game.cover} title={title} />
                </div>
              </TabsContent>

              <TabsContent value="record">
                <div className="rounded-md border p-4 text-sm">暂无记录</div>
              </TabsContent>

              <TabsContent value="memory">
                <div className="rounded-md border p-4 text-sm">暂无回忆</div>
              </TabsContent>
            </Tabs>
          </div>

          <GameSettingsPanel
            gameId={game.id}
            gameTitle={title}
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
          />
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => setBasicInfoOpen(true)}>
          修改基本信息
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setUpdateDataOpen(true)}>
          更新资料数据
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEditGamePV}>修改游戏PV</ContextMenuItem>
        <ContextMenuItem onClick={handleEditGameOST}>
          修改游戏OST
        </ContextMenuItem>
      </ContextMenuContent>

      <GameBasicInfoDialog
        game={game}
        open={basicInfoOpen}
        onOpenChange={setBasicInfoOpen}
      />
      <GameUpdateDataDialog
        gameId={game.id}
        initialKeyword={title}
        open={updateDataOpen}
        onOpenChange={setUpdateDataOpen}
      />
      <GamePlayTimeDialog
        gameId={game.id}
        open={playTimeOpen}
        onOpenChange={setPlayTimeOpen}
      />
      <GameRatingDialog
        gameId={game.id}
        rating={rating}
        open={ratingOpen}
        onOpenChange={setRatingOpen}
      />
      <GamePVDialog
        gameId={game.id}
        open={pvDialogOpen}
        onOpenChange={setPvDialogOpen}
      />
      <GameOSTDialog
        gameId={game.id}
        open={ostDialogOpen}
        onOpenChange={setOstDialogOpen}
      />
    </ContextMenu>
  )
}
