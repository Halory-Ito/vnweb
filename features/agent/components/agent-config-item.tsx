'use client'

import { CircleCheckIcon, CircleIcon, PencilIcon, TrashIcon } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { AgentModelConfig } from '@/types/agent'

type AgentConfigItemProps = {
  config: AgentModelConfig
  active: boolean
  disabled: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

/** 单条模型配置：设为当前 / 编辑 / 删除 */
export function AgentConfigItem({
  config,
  active,
  disabled,
  onSelect,
  onEdit,
  onDelete,
}: AgentConfigItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border p-2.5',
        active && 'border-primary/60 bg-primary/5',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="设为当前模型"
            disabled={disabled}
            onClick={onSelect}
          >
            {active ? <CircleCheckIcon className="text-primary" /> : <CircleIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{active ? '当前使用的模型' : '设为当前模型'}</TooltipContent>
      </Tooltip>

      <div className="min-w-0 flex-1 pl-1">
        <div className="truncate text-sm font-medium">{config.name}</div>
        <div className="text-muted-foreground truncate text-xs">
          {config.model} · {config.baseUrl}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="编辑配置"
        disabled={disabled}
        onClick={onEdit}
      >
        <PencilIcon />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="删除配置" disabled={disabled}>
            <TrashIcon />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除「{config.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后需要重新填写接口地址、API Key 与模型名称。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
