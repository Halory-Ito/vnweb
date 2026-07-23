'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { updateGuideProgressApi, type GuideData } from '@/features/guide/guide-api'

interface Step {
  id: string
  type: string
  content: string
  group?: string
  prefix?: string
  subfix?: string
  finished?: boolean
}

interface Ending {
  id: string
  name: string
  type: string
  steps: Step[]
  finished?: boolean
}

interface Route {
  id: string
  name: string
  endings: Ending[]
  finished?: boolean
}

export function useGuide(guideData: GuideData | null, gameId: number) {
  const queryClient = useQueryClient()
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  // 乐观更新并同步到服务器，自动联动 ending/route 状态
  const toggleStep = useCallback(
    async (stepId: string) => {
      if (!guideData) return

      // 找到当前步骤及其父级
      let parentEnding: Ending | undefined
      let parentRoute: Route | undefined
      for (const route of guideData.routes) {
        for (const ending of route.endings) {
          if (ending.steps.some((s) => s.id === stepId)) {
            parentEnding = ending
            parentRoute = route
            break
          }
        }
        if (parentEnding) break
      }

      const step = parentEnding?.steps.find((s) => s.id === stepId)
      if (!step || !parentEnding || !parentRoute) return

      const newStepFinished = !step.finished

      // 计算 ending 和 route 联动后的 finished 状态
      const updatedSteps = parentEnding.steps.map((s) =>
        s.id === stepId ? { ...s, finished: newStepFinished } : s,
      )
      const newEndingFinished = updatedSteps.every((s) => s.finished)

      const updatedEndings = parentRoute.endings.map((e) =>
        e.id === parentEnding!.id
          ? { ...e, finished: newEndingFinished, steps: updatedSteps }
          : e,
      )
      const newRouteFinished = updatedEndings.every((e) => e.finished)

      // 收集需要更新的项
      const updates: Array<{ type: 'step' | 'ending' | 'route'; id: number; finished: boolean }> = [
        { type: 'step', id: Number(stepId), finished: newStepFinished },
      ]
      if (newEndingFinished !== !!parentEnding.finished) {
        updates.push({ type: 'ending', id: Number(parentEnding.id), finished: newEndingFinished })
      }
      if (newRouteFinished !== !!parentRoute.finished) {
        updates.push({ type: 'route', id: Number(parentRoute.id), finished: newRouteFinished })
      }

      // 乐观更新
      setUpdatingIds((prev) => new Set(prev).add(stepId))
      queryClient.setQueryData(['guide', gameId], (old: GuideData | null) => {
        if (!old) return old
        return {
          ...old,
          routes: old.routes.map((route) => {
            if (route.id !== parentRoute!.id) return route
            return {
              ...route,
              finished: newRouteFinished,
              endings: route.endings.map((ending) => {
                if (ending.id !== parentEnding!.id) return ending
                return {
                  ...ending,
                  finished: newEndingFinished,
                  steps: ending.steps.map((s) =>
                    s.id === stepId ? { ...s, finished: newStepFinished } : s,
                  ),
                }
              }),
            }
          }),
        }
      })

      try {
        await Promise.all(
          updates.map((u) => updateGuideProgressApi(gameId, u)),
        )
      } catch {
        queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev)
          next.delete(stepId)
          return next
        })
      }
    },
    [guideData, gameId, queryClient],
  )

  // 计算结局完成进度
  const getEndingProgress = useCallback(
    (ending: Ending) => {
      const total = ending.steps.length
      const completed = ending.steps.filter((s) => s.finished).length
      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    [],
  )

  // 计算路线完成进度
  const getRouteProgress = useCallback(
    (route: Route) => {
      const totalSteps = route.endings.reduce(
        (sum, ending) => sum + ending.steps.length,
        0,
      )
      const completedStepsCount = route.endings.reduce((sum, ending) => {
        return sum + ending.steps.filter((s) => s.finished).length
      }, 0)
      return {
        total: totalSteps,
        completed: completedStepsCount,
        percentage:
          totalSteps > 0
            ? Math.round((completedStepsCount / totalSteps) * 100)
            : 0,
      }
    },
    [],
  )

  // 计算总体完成进度
  const getTotalProgress = useCallback(() => {
    if (!guideData) return { total: 0, completed: 0, percentage: 0 }

    const totalSteps = guideData.routes.reduce((sum, route) => {
      return (
        sum +
        route.endings.reduce(
          (endingSum, ending) => endingSum + ending.steps.length,
          0,
        )
      )
    }, 0)
    const completedStepsCount = guideData.routes.reduce((sum, route) => {
      return (
        sum +
        route.endings.reduce((endingSum, ending) => {
          return endingSum + ending.steps.filter((s) => s.finished).length
        }, 0)
      )
    }, 0)
    return {
      total: totalSteps,
      completed: completedStepsCount,
      percentage:
        totalSteps > 0
          ? Math.round((completedStepsCount / totalSteps) * 100)
          : 0,
    }
  }, [guideData])

  // 重置所有进度
  const resetProgress = useCallback(async () => {
    if (!guideData) return

    // 乐观更新
    queryClient.setQueryData(['guide', gameId], (old: GuideData | null) => {
      if (!old) return old
      return {
        ...old,
        finished: false,
        routes: old.routes.map((route) => ({
          ...route,
          finished: false,
          endings: route.endings.map((ending) => ({
            ...ending,
            finished: false,
            steps: ending.steps.map((s) => ({ ...s, finished: false })),
          })),
        })),
      }
    })

    try {
      await updateGuideProgressApi(gameId, {
        type: 'guide',
        id: guideData.id,
        finished: false,
      })
      // 重置所有子项需要逐个更新，或者直接刷新
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
    }
  }, [guideData, gameId, queryClient])

  // 标记全部完成
  const completeProgress = useCallback(async () => {
    if (!guideData) return

    // 乐观更新
    queryClient.setQueryData(['guide', gameId], (old: GuideData | null) => {
      if (!old) return old
      return {
        ...old,
        finished: true,
        routes: old.routes.map((route) => ({
          ...route,
          finished: true,
          endings: route.endings.map((ending) => ({
            ...ending,
            finished: true,
            steps: ending.steps.map((s) => ({ ...s, finished: true })),
          })),
        })),
      }
    })

    try {
      await updateGuideProgressApi(gameId, {
        type: 'guide',
        id: guideData.id,
        finished: true,
      })
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
    } catch {
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
    }
  }, [guideData, gameId, queryClient])
  const resetRouteProgress = useCallback(
    async (route: Route) => {
      if (!guideData) return

      // 乐观更新
      queryClient.setQueryData(['guide', gameId], (old: GuideData | null) => {
        if (!old) return old
        return {
          ...old,
          routes: old.routes.map((r) =>
            r.id === route.id
              ? {
                  ...r,
                  finished: false,
                  endings: r.endings.map((ending) => ({
                    ...ending,
                    finished: false,
                    steps: ending.steps.map((s) => ({ ...s, finished: false })),
                  })),
                }
              : r,
          ),
        }
      })

      try {
        await updateGuideProgressApi(gameId, {
          type: 'route',
          id: Number(route.id),
          finished: false,
        })
        // 重置所有子项需要刷新
        queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      } catch {
        queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      }
    },
    [guideData, gameId, queryClient],
  )

  return {
    updatingIds,
    toggleStep,
    getEndingProgress,
    getRouteProgress,
    getTotalProgress,
    resetProgress,
    completeProgress,
    resetRouteProgress,
  }
}
