import { useQueryClient } from '@tanstack/react-query'
import {
  ClockIcon,
  Gamepad2Icon,
  Play,
  Settings,
  Square,
  StarIcon,
  TimerResetIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
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
import GameBasicInfoDialog from './game-basic-info-dialog'
import GamePlayTimeDialog from './game-play-time-dialog'
import GameRatingDialog from './game-rating-dialog'
import GameSettingsPanel from './game-settings-panel'
import GameUpdateDataDialog from './game-update-data-dialog'
import {
  GameDetail,
  launchGameById,
  stopGameById,
  updateGamePlayStatusById,
} from '@/lib/game-utils'

type GameInfoProps = {
  game: GameDetail
}

// FIXME: 无法实现进程同步
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex gap-2 text-sm">
    <span className="w-24 shrink-0">{label}</span>
    <span className="break-all">{value || '-'}</span>
  </div>
)

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safe / 3600)
  const minute = Math.floor((safe % 3600) / 60)
  const second = safe % 60
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}

const formatHours = (seconds: number) => {
  const safe = Math.max(0, Number(seconds) || 0)
  const hours = safe / 3600
  return `${hours.toFixed(1)} 小时`
}

const formatDateOnly = (value: string) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('zh-CN')
}

const statusLabelMap: Record<number, string> = {
  0: '未开始',
  1: '游玩中',
  2: '部分完成',
  3: '已完成',
  4: '多周目',
  5: '搁置中',
}

const statusOptions = [0, 1, 2, 3, 4, 5] as const

const StatCard = ({
  title,
  icon,
  value,
  interactiveIcon = false,
}: {
  title: string
  icon: ReactNode
  value: ReactNode
  interactiveIcon?: boolean
}) => (
  <div className="rounded-md p-3">
    <div className="flex items-center justify-center gap-3">
      {interactiveIcon ? (
        icon
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="pointer-events-none"
          tabIndex={-1}
        >
          {icon}
        </Button>
      )}
      <div className="text-base font-medium">
        <div>
          <span>{title}</span>
        </div>
        <div>{value}</div>
      </div>
    </div>
  </div>
)

export default function GameInfo({ game }: GameInfoProps) {
  const title = game.nameCn || game.name
  const [basicInfoOpen, setBasicInfoOpen] = useState(false)
  const [updateDataOpen, setUpdateDataOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [playTimeOpen, setPlayTimeOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              title="游玩时间"
              interactiveIcon
              icon={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="编辑游玩时间"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setPlayTimeOpen(true)}
                >
                  <ClockIcon className="size-8" />
                </Button>
              }
              value={totalPlayTimeText}
            />
            <StatCard
              title="最后运行日期"
              icon={<TimerResetIcon className="size-8" />}
              value={formatDateOnly(game.lastLaunchedAt)}
            />
            <StatCard
              title="游玩状态"
              interactiveIcon
              icon={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      disabled={isUpdatingStatus}
                      aria-label="修改游玩状态"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Gamepad2Icon className="size-8" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => void updatePlayStatus(status)}
                      >
                        {statusLabelMap[status]}
                        {playStatus === status ? (
                          <DropdownMenuShortcut>✔</DropdownMenuShortcut>
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              }
              value={
                <div className="space-y-1">
                  <div>{statusLabelMap[playStatus] ?? '未开始'}</div>
                  {isRunning ? (
                    <div className="text-muted-foreground text-xs">
                      本次 {formatDuration(sessionSeconds)}
                    </div>
                  ) : null}
                </div>
              }
            />
            <StatCard
              title="我的评分"
              interactiveIcon
              icon={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="修改评分"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setRatingOpen(true)}
                >
                  <StarIcon className="size-8" />
                </Button>
              }
              value={String(rating ?? 0)}
            />
          </div>

          <div>
            <Tabs defaultValue="overview" className="mx-auto w-full">
              <TabsList className="mx-auto dark:bg-transparent">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="record">记录</TabsTrigger>
                <TabsTrigger value="memory">回忆</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-4 rounded-md border p-4">
                    <div>
                      <div className="mb-2 text-base font-semibold">
                        游戏简介
                      </div>
                      <div className="text-foreground/90 text-sm leading-6 whitespace-pre-wrap">
                        {game.summary || '-'}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-base font-semibold">
                        游戏标签
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {game.tags.length > 0 ? (
                          game.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-md border p-4">
                    <div>
                      <div className="mb-2 text-base font-semibold">
                        基本信息
                      </div>
                      <div className="space-y-1">
                        <InfoRow label="开发商" value={game.developer} />
                        <InfoRow label="发行商" value={game.publisher} />
                        <InfoRow label="发售日期" value={game.date} />
                        <InfoRow label="游戏类型" value={game.gameType} />
                        <InfoRow label="游戏引擎" value={game.gameEngine} />
                        <InfoRow
                          label="平台"
                          value={game.platforms.join(' / ')}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-base font-semibold">
                        附加信息
                      </div>
                      <div className="space-y-1">
                        <InfoRow label="音乐" value={game.music} />
                        <InfoRow label="剧本" value={game.script} />
                        <InfoRow label="美术" value={game.graphic} />
                        <InfoRow label="原画" value={game.originalPainter} />
                        <InfoRow
                          label="动画制作"
                          value={game.animationProduction}
                        />
                        <InfoRow label="程序" value={game.programmer} />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-base font-semibold">
                        相关网站
                      </div>
                      <div className="space-y-1 text-sm">
                        {game.websites.length > 0 ? (
                          game.websites.map((website) => (
                            <Link
                              key={website.id}
                              href={website.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary block break-all hover:underline"
                            >
                              {website.name}
                            </Link>
                          ))
                        ) : (
                          <span className=" ">-</span>
                        )}
                      </div>
                    </div>
                  </div>
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
      </ContextMenuContent>

      <GameBasicInfoDialog
        game={game}
        open={basicInfoOpen}
        onOpenChange={setBasicInfoOpen}
      />
      <GameUpdateDataDialog
        gameId={game.id}
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
    </ContextMenu>
  )
}
