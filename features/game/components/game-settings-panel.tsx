'use client'

import { useQuery } from '@tanstack/react-query'

import { GameBasicInfoForm } from './game-basic-info-form'
import { GameSettingsExecution } from './game-settings-execution'
import { GameSettingsMedia } from './game-settings-media'
import { getGameById } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type GameSettingsPanelProps = {
  gameId: number
  gameTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GameSettingsPanel({
  gameId,
  gameTitle,
  open,
  onOpenChange,
}: GameSettingsPanelProps) {
  const {
    data: game,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: open,
  })

  const title = game?.nameCn || game?.name || gameTitle

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-hidden sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>属性设置</SheetTitle>
          <SheetDescription>{title}</SheetDescription>
        </SheetHeader>
        {open && game && (
          <Tabs key={gameId} defaultValue="basic" className="min-h-0 flex-1 gap-4 px-4 pb-4">
            <TabsList aria-label="游戏设置" className="w-full shrink-0">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="media">媒体</TabsTrigger>
              <TabsTrigger value="execution">执行</TabsTrigger>
            </TabsList>
            <TabsContent
              forceMount
              value="basic"
              className="min-h-0 overflow-y-auto p-1 data-[state=inactive]:hidden"
            >
              <GameBasicInfoForm game={game} />
            </TabsContent>
            <TabsContent
              forceMount
              value="media"
              className="min-h-0 overflow-y-auto p-1 data-[state=inactive]:hidden"
            >
              <GameSettingsMedia game={game} gameTitle={title} />
            </TabsContent>
            <TabsContent
              forceMount
              value="execution"
              className="min-h-0 overflow-y-auto p-1 data-[state=inactive]:hidden"
            >
              <GameSettingsExecution game={game} />
            </TabsContent>
          </Tabs>
        )}
        {open && !game && (
          <div className="flex items-center gap-3 px-4 pb-4" role="status">
            {isFetching ? '加载中…' : '无法加载游戏设置'}
            {isError && !isFetching && (
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                重试
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
