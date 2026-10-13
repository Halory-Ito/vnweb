'use client'

import { PlusIcon, SettingsIcon } from 'lucide-react'

import { AgentConfigDialog } from './agent-config-dialog'
import { AgentConfigItem } from './agent-config-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { useAgentConfigDialog } from '@/features/agent/hooks/use-agent-config-dialog'

import type { AgentConfig, AgentModelConfig } from '@/types/agent'

type AgentConfigPanelProps = {
  config: AgentConfig
  isLoading: boolean
  isSaving: boolean
  save: (config: AgentConfig) => Promise<AgentConfig>
}

/** 配置面板：模型配置的增删改与当前模型选择 */
export function AgentConfigPanel({ config, isLoading, isSaving, save }: AgentConfigPanelProps) {
  const dialog = useAgentConfigDialog({
    onSubmit: async (item: AgentModelConfig) => {
      const exists = config.configs.some((saved) => saved.id === item.id)
      const configs = exists
        ? config.configs.map((saved) => (saved.id === item.id ? item : saved))
        : [...config.configs, item]

      await save({ configs, activeConfigId: config.activeConfigId || item.id })
    },
  })

  const handleSelect = async (id: string) => {
    if (id === config.activeConfigId) {
      return
    }
    await save({ ...config, activeConfigId: id })
  }

  const handleDelete = async (id: string) => {
    const configs = config.configs.filter((item) => item.id !== id)
    await save({
      configs,
      activeConfigId: config.activeConfigId === id ? (configs[0]?.id ?? '') : config.activeConfigId,
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">模型配置</span>
          <Badge variant="outline">{config.configs.length}</Badge>
        </div>

        <Button variant="outline" size="sm" disabled={isSaving} onClick={dialog.openCreate}>
          <PlusIcon />
          新增
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner />
            加载中…
          </div>
        ) : config.configs.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SettingsIcon />
              </EmptyMedia>
              <EmptyTitle>暂无模型配置</EmptyTitle>
              <EmptyDescription>添加 OpenAI 兼容的接口地址、API Key 与模型名称</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          config.configs.map((item) => (
            <AgentConfigItem
              key={item.id}
              config={item}
              active={item.id === config.activeConfigId}
              disabled={isSaving}
              onSelect={() => void handleSelect(item.id)}
              onEdit={() => dialog.openEdit(item)}
              onDelete={() => void handleDelete(item.id)}
            />
          ))
        )}
      </div>

      <AgentConfigDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        draft={dialog.draft}
        models={dialog.models}
        isTesting={dialog.isTesting}
        isSaving={dialog.isSaving}
        onFieldChange={dialog.updateField}
        onTestConnection={dialog.testConnection}
        onSubmit={dialog.submit}
      />
    </div>
  )
}
