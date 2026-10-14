'use client'

import { BotIcon, EraserIcon, PlugIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { AgentChatComposer } from './agent-chat-composer'
import { AgentChatMessage } from './agent-chat-message'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { useAgentChat } from '@/features/agent/hooks/use-agent-chat'
import type { AgentModelConfig } from '@/types/agent'

type AgentChatPanelProps = {
  chat: ReturnType<typeof useAgentChat>
  toolCount: number
  configs: AgentModelConfig[]
  activeConfigId: string
  onActiveConfigChange: (configId: string) => void
  onOpenConfig: () => void
}

/** 对话面板：模型切换 + 流式消息 + 输入区 */
export function AgentChatPanel({
  chat,
  toolCount,
  configs,
  activeConfigId,
  onActiveConfigChange,
  onOpenConfig,
}: AgentChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [chat.messages])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Select
          value={activeConfigId}
          onValueChange={onActiveConfigChange}
          disabled={chat.isStreaming || configs.length === 0}
        >
          <SelectTrigger size="sm" className="min-w-0 flex-1">
            <SelectValue placeholder="选择模型" />
          </SelectTrigger>
          <SelectContent>
            {configs.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} · {item.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={chat.enableTools ? 'outline' : 'ghost'}
              size="icon-sm"
              aria-label="工具调用开关"
              onClick={() => chat.setEnableTools(!chat.enableTools)}
            >
              <PlugIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{chat.enableTools ? '已开启工具调用' : '已关闭工具调用'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="清空对话"
              disabled={chat.messages.length === 0}
              onClick={chat.clear}
            >
              <EraserIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>清空对话</TooltipContent>
        </Tooltip>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {configs.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>尚未配置模型</EmptyTitle>
              <EmptyDescription>先在「配置」中添加 OpenAI 兼容的模型信息</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={onOpenConfig}>
                前往配置
              </Button>
            </EmptyContent>
          </Empty>
        ) : chat.messages.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>开始对话</EmptyTitle>
              <EmptyDescription>
                可以试试「帮我添加游戏」或「导出摘录为 XLSX」，也可以附带图片或文本文件提问
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          chat.messages.map((message) => (
            <AgentChatMessage
              key={message.id}
              message={message}
              isStreaming={chat.isStreaming}
              onFollowUp={(text) => void chat.send(text)}
            />
          ))
        )}
      </div>

      <AgentChatComposer
        isStreaming={chat.isStreaming}
        disabled={configs.length === 0 || !activeConfigId}
        toolHint={chat.enableTools ? `工具调用已开启 · ${toolCount} 个工具` : '工具调用已关闭'}
        onSend={(text, attachments) => void chat.send(text, attachments)}
        onStop={chat.stop}
      />
    </div>
  )
}
