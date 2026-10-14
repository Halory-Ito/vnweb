'use client'

import { PlugZapIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

import type { AgentConfigDraft } from '@/features/agent/hooks/use-agent-config-dialog'

type AgentConfigDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: AgentConfigDraft
  models: string[]
  isTesting: boolean
  isSaving: boolean
  onFieldChange: (key: keyof AgentConfigDraft, value: string) => void
  onTestConnection: () => void
  onSubmit: () => void
}

/** 新增 / 编辑模型配置的对话框 */
export function AgentConfigDialog({
  open,
  onOpenChange,
  draft,
  models,
  isTesting,
  isSaving,
  onFieldChange,
  onTestConnection,
  onSubmit,
}: AgentConfigDialogProps) {
  const modelInList = models.includes(draft.model)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{draft.id ? '编辑模型配置' : '新增模型配置'}</DialogTitle>
          <DialogDescription className="sr-only">
            填写 OpenAI 兼容的接口地址、API Key 与模型名称，可先测试连接再保存
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="agent-config-name">显示名称</FieldLabel>
            <Input
              id="agent-config-name"
              value={draft.name}
              placeholder="例如 DeepSeek"
              onChange={(event) => onFieldChange('name', event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="agent-config-base-url">接口地址</FieldLabel>
            <Input
              id="agent-config-base-url"
              value={draft.baseUrl}
              placeholder="https://api.deepseek.com/v1"
              onChange={(event) => onFieldChange('baseUrl', event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="agent-config-api-key">API Key</FieldLabel>
            <Input
              id="agent-config-api-key"
              type="password"
              value={draft.apiKey}
              placeholder="sk-..."
              autoComplete="off"
              onChange={(event) => onFieldChange('apiKey', event.target.value)}
            />
            <FieldDescription>留空表示不携带鉴权头（例如本地 Ollama）</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="agent-config-model">模型名称</FieldLabel>
            <Input
              id="agent-config-model"
              value={draft.model}
              placeholder="例如 deepseek-chat"
              onChange={(event) => onFieldChange('model', event.target.value)}
            />
            {models.length > 0 ? (
              <Select
                key={modelInList ? draft.model : '__custom__'}
                value={modelInList ? draft.model : undefined}
                onValueChange={(value) => onFieldChange('model', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`接口返回 ${models.length} 个模型，点击选择`} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="agent-config-system-prompt">系统提示词</FieldLabel>
            <Textarea
              id="agent-config-system-prompt"
              value={draft.systemPrompt}
              rows={3}
              className="resize-none"
              placeholder="可选，用于设定助手的角色与行为"
              onChange={(event) => onFieldChange('systemPrompt', event.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onTestConnection} disabled={isTesting || isSaving}>
            {isTesting ? <Spinner /> : <PlugZapIcon />}
            测试连接
          </Button>
          <Button onClick={onSubmit} disabled={isSaving || isTesting}>
            {isSaving ? <Spinner /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
