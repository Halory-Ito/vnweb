'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { createEndingApi, getRouteOptionsApi } from '@/features/guide/guide-api'

// 「新增结局」弹窗的状态与提交逻辑
export function useAddEndingDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('normal')
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取全部路线（带攻略名，便于跨攻略时区分）
  const { data: routes = [] } = useQuery({
    queryKey: ['guide-routes'],
    queryFn: () => getRouteOptionsApi(),
    enabled: open,
  })

  const reset = useCallback(() => {
    setName('')
    setType('normal')
    setSelectedRouteId('')
  }, [])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        reset()
      }
    },
    [reset],
  )

  const submit = useCallback(async () => {
    if (!selectedRouteId) {
      toast.error('请选择路线')
      return
    }
    if (!name.trim()) {
      toast.error('请输入结局名称')
      return
    }

    setIsSubmitting(true)
    try {
      await createEndingApi({
        routeId: Number(selectedRouteId),
        name: name.trim(),
        type,
      })
      toast.success('结局添加成功')
      await queryClient.invalidateQueries({ queryKey: ['guide'] })
      await queryClient.invalidateQueries({ queryKey: ['guide-endings'] })
      setOpen(false)
      reset()
    } catch (error) {
      console.error('添加结局失败:', error)
      toast.error('添加结局失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [name, queryClient, reset, selectedRouteId, type])

  return {
    open,
    handleOpenChange,
    routes,
    name,
    setName,
    type,
    setType,
    selectedRouteId,
    setSelectedRouteId,
    canSubmit: Boolean(name.trim() && selectedRouteId),
    isSubmitting,
    submit,
  }
}
