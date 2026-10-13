'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { listAgentModelsApi } from '@/api'
import { getAgentErrorMessage } from '@/features/agent/lib/agent-error'

import type { AgentModelConfig } from '@/types/agent'

export type AgentConfigDraft = {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
}

const EMPTY_DRAFT: AgentConfigDraft = {
  id: '',
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
  systemPrompt: '',
}

type UseAgentConfigDialogOptions = {
  onSubmit: (config: AgentModelConfig) => Promise<void>
}

/** 模型配置对话框的状态：表单草稿、测试连接与提交 */
export function useAgentConfigDialog({ onSubmit }: UseAgentConfigDialogOptions) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<AgentConfigDraft>(EMPTY_DRAFT)
  const [models, setModels] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const openCreate = () => {
    setDraft(EMPTY_DRAFT)
    setModels([])
    setOpen(true)
  }

  const openEdit = (config: AgentModelConfig) => {
    setDraft({
      id: config.id,
      name: config.name,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      systemPrompt: config.systemPrompt ?? '',
    })
    setModels([])
    setOpen(true)
  }

  const updateField = (key: keyof AgentConfigDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const testConnection = async () => {
    const baseUrl = draft.baseUrl.trim()
    if (!baseUrl) {
      toast.error('请先填写接口地址')
      return
    }

    setIsTesting(true)
    try {
      const list = await listAgentModelsApi({
        baseUrl,
        apiKey: draft.apiKey,
        configId: draft.id || undefined,
      })
      setModels(list)

      if (list.length === 0) {
        toast.warning('连接成功，但未获取到模型列表')
      } else {
        toast.success(`连接成功，获取到 ${list.length} 个模型`)
      }
    } catch (error) {
      toast.error(getAgentErrorMessage(error))
    } finally {
      setIsTesting(false)
    }
  }

  const submit = async () => {
    const name = draft.name.trim()
    const baseUrl = draft.baseUrl.trim()
    const model = draft.model.trim()

    if (!name) {
      toast.error('请填写显示名称')
      return
    }
    if (!/^https?:\/\//i.test(baseUrl)) {
      toast.error('接口地址需要以 http:// 或 https:// 开头')
      return
    }
    if (!model) {
      toast.error('请填写模型名称')
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        id: draft.id,
        name,
        baseUrl,
        apiKey: draft.apiKey.trim(),
        model,
        systemPrompt: draft.systemPrompt.trim() || undefined,
      })
      setOpen(false)
    } catch (error) {
      toast.error(getAgentErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    open,
    setOpen,
    draft,
    models,
    isTesting,
    isSaving,
    openCreate,
    openEdit,
    updateField,
    testConnection,
    submit,
  }
}
