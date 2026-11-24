'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  updateRouteSortApi,
  type GuideData,
  type GuideRouteWithProgress,
} from '@/features/guide/guide-api'

export function useRouteSort(gameId: number, initialRoutes: GuideRouteWithProgress[] | undefined) {
  const queryClient = useQueryClient()
  const [routes, setRoutes] = useState<GuideRouteWithProgress[]>(initialRoutes ?? [])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (initialRoutes) {
      setRoutes(initialRoutes)
    }
  }, [initialRoutes])

  const updateSortMutation = useMutation({
    mutationFn: updateRouteSortApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      void queryClient.invalidateQueries({ queryKey: ['guide-routes'] })
    },
    onError: () => {
      setRoutes(initialRoutes ?? [])
      void queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
      toast.error('路线排序保存失败')
    },
  })

  const clearDragState = useCallback(() => {
    dragIndexRef.current = null
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
    dragIndexRef.current = index
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverIndex((prev) => (prev === index ? prev : index))
  }, [])

  const handleDragEnter = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault()
    setDragOverIndex((prev) => (prev === index ? prev : index))
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent, targetIndex: number) => {
      event.preventDefault()
      event.stopPropagation()

      let fromIndex = dragIndexRef.current
      if (fromIndex === null) {
        const raw = event.dataTransfer.getData('text/plain')
        if (raw !== '') {
          const parsed = Number(raw)
          if (Number.isInteger(parsed)) {
            fromIndex = parsed
          }
        }
      }

      if (
        fromIndex !== null &&
        fromIndex >= 0 &&
        fromIndex < routes.length &&
        fromIndex !== targetIndex
      ) {
        const newRoutes = [...routes]
        const [draggedItem] = newRoutes.splice(fromIndex, 1)
        newRoutes.splice(targetIndex, 0, draggedItem)

        setRoutes(newRoutes)
        queryClient.setQueryData<GuideData | null>(['guide', gameId], (old) =>
          old ? { ...old, routes: newRoutes } : old,
        )

        updateSortMutation.mutate(
          newRoutes.map((route, idx) => ({
            id: Number(route.id),
            sortOrder: idx,
          })),
        )
      }

      clearDragState()
    },
    [clearDragState, gameId, queryClient, routes, updateSortMutation],
  )

  return {
    routes,
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleDragEnd: clearDragState,
  }
}
