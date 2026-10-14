'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { createRouteApi, getGuideListApi } from '@/features/guide/guide-api'

// 「新增路线」弹窗的状态与提交逻辑
export function useAddRouteDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [selectedGuideId, setSelectedGuideId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 路线必须挂在某篇攻略下，这里复用列表页的查询缓存
  const { data: guides = [] } = useQuery({
    queryKey: ['guide-list'],
    queryFn: getGuideListApi,
    enabled: open,
  })

  const reset = useCallback(() => {
    setName('')
    setSelectedGuideId('')
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
    if (!selectedGuideId) {
      toast.error('请选择所属攻略')
      return
    }
    if (!name.trim()) {
      toast.error('请输入路线名称')
      return
    }

    setIsSubmitting(true)
    try {
      await createRouteApi({ guideId: Number(selectedGuideId), name: name.trim() })
      toast.success('路线添加成功')
      await queryClient.invalidateQueries({ queryKey: ['guide'] })
      await queryClient.invalidateQueries({ queryKey: ['guide-routes'] })
      setOpen(false)
      reset()
    } catch (error) {
      console.error('添加路线失败:', error)
      toast.error('添加路线失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [name, queryClient, reset, selectedGuideId])

  return {
    open,
    handleOpenChange,
    guides,
    name,
    setName,
    selectedGuideId,
    setSelectedGuideId,
    canSubmit: Boolean(name.trim() && selectedGuideId),
    isSubmitting,
    submit,
  }
}
