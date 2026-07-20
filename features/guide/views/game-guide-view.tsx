'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, List, Lock, RotateCcw, Star, Skull, CircleDot, Users } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { getGuideApi, type GuideEndingWithProgress } from '@/features/guide'
import { GuideCharacterCard } from '@/features/guide/components/guide-character-card'
import { GuideRoute } from '@/features/guide/components/guide-route'
import { GuideStep } from '@/features/guide/components/guide-step'
import { useGuide } from '@/features/guide/hooks/use-guide'
import { cn } from '@/lib/utils'

const endingTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  true: {
    label: '真结局',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  bad: {
    label: '坏结局',
    icon: <Skull className="h-3 w-3" />,
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
  normal: {
    label: '普通结局',
    icon: <CircleDot className="h-3 w-3" />,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
}

export default function GameGuideView({ gameId }: { gameId: number }) {
  const [characterMode, setCharacterMode] = useState(false)
  const [selectedEnding, setSelectedEnding] = useState<GuideEndingWithProgress | null>(null)

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
  })

  const {
    toggleStep,
    getEndingProgress,
    getRouteProgress,
    getTotalProgress,
    resetProgress,
    resetRouteProgress,
  } = useGuide(guide ?? null, gameId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">暂无攻略数据</p>
        <p className="text-muted-foreground text-xs">请先导入攻略</p>
      </div>
    )
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-auto p-4">
      {/* 颜色提示 */}
      <Card variant="outline">
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">颜色说明</CardTitle>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-primary h-2.5 w-2.5 rounded-full" />
              <span className="text-foreground">选项</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              <span className="text-foreground">保存</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              <span className="text-foreground">读取</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-muted-foreground h-2.5 w-2.5 rounded-full" />
              <span className="text-foreground">备注</span>
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* 总体进度 */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>攻略进度</CardTitle>
              <CardDescription>
                {totalProgress.completed}/{totalProgress.total} 步骤完成
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetProgress}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重置全部
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={totalProgress.percentage} className="h-3 flex-1" />
            <span className="text-muted-foreground min-w-12 text-right text-sm font-medium tabular-nums">
              {totalProgress.percentage}%
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* 提示信息 */}
      {guide.tips.length > 0 && (
        <Card variant="outline" className="border-yellow-200 dark:border-yellow-800">
          <CardHeader className="py-3">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              {guide.tips.map((tip, index) => (
                <p key={index}>💡 {tip}</p>
              ))}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* 视图模式切换 */}
      <div className="flex items-center gap-2">
        <List className="text-muted-foreground h-4 w-4" />
        <Switch
          checked={characterMode}
          onCheckedChange={(checked) => {
            setCharacterMode(checked)
            if (!checked) setSelectedEnding(null)
          }}
        />
        <Users className="text-muted-foreground h-4 w-4" />
        <Label className="text-muted-foreground text-sm">
          {characterMode ? '角色卡片模式' : '路线列表模式'}
        </Label>
      </div>

      {/* 内容区域 */}
      {characterMode ? (
        selectedEnding ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEnding(null)}>
              ← 返回角色列表
            </Button>
            <Card variant="default">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{selectedEnding.name}</CardTitle>
                  {(() => {
                    const config = endingTypeConfig[selectedEnding.type] || endingTypeConfig.normal
                    return (
                      <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    )
                  })()}
                </div>
                <CardDescription>
                  {getEndingProgress(selectedEnding).completed}/
                  {getEndingProgress(selectedEnding).total} 步骤完成
                </CardDescription>
              </CardHeader>
            </Card>
            {selectedEnding.requirements && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-medium">开启条件：</span>
                <span>{selectedEnding.requirements}</span>
              </div>
            )}
            <div className="space-y-2">
              {selectedEnding.steps.map((step) => (
                <GuideStep
                  key={step.id}
                  step={step}
                  isCompleted={!!step.finished}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guide.routes
              .flatMap((route) => route.endings)
              .map((ending) => (
                <GuideCharacterCard
                  key={ending.id}
                  ending={ending}
                  progress={getEndingProgress(ending)}
                  onClick={() => setSelectedEnding(ending)}
                />
              ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {guide.routes.map((route) => (
            <GuideRoute
              key={route.id}
              route={route}
              progress={getRouteProgress(route)}
              onToggleStep={toggleStep}
              onResetRoute={() => resetRouteProgress(route)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
