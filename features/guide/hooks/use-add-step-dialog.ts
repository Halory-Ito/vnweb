'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { createStepApi, getEndingOptionsApi } from '@/features/guide/guide-api'

const EMPTY_FORM = {
  type: 'choice',
  content: '',
  group: '',
  prefix: '',
  subfix: '',
  endingId: '',
}

// 「新增步骤」弹窗的状态与提交逻辑
export function useAddStepDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取全部结局（带攻略名与路线名，便于区分）
  const { data: endings = [] } = useQuery({
    queryKey: ['guide-endings'],
    queryFn: () => getEndingOptionsApi(),
    enabled: open,
  })

  const setField = useCallback((key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setForm(EMPTY_FORM), [])

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
    if (!form.endingId) {
      toast.error('请选择结局')
      return
    }
    if (!form.content.trim()) {
      toast.error('请输入步骤内容')
      return
    }

    setIsSubmitting(true)
    try {
      await createStepApi({
        endingId: Number(form.endingId),
        type: form.type,
        content: form.content.trim(),
        group: form.group.trim() || undefined,
        prefix: form.prefix.trim() || undefined,
        subfix: form.subfix.trim() || undefined,
      })
      toast.success('步骤添加成功')
      await queryClient.invalidateQueries({ queryKey: ['guide'] })
      setOpen(false)
      reset()
    } catch (error) {
      console.error('添加步骤失败:', error)
      toast.error('添加步骤失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }, [form, queryClient, reset])

  return {
    open,
    handleOpenChange,
    endings,
    form,
    setField,
    canSubmit: Boolean(form.content.trim() && form.endingId),
    isSubmitting,
    submit,
  }
}
