// Agent 对话 UI 内部类型（仅模块内使用）

import type { AgentChatAttachment } from './chat-attachments'
import type { AgentToolCall } from '@/types/agent'

export type AgentToolRunStatus = 'running' | 'success' | 'error'

/** 一次工具调用的 UI 状态 */
export type AgentToolRun = {
  id: string
  name: string
  arguments: string
  status: AgentToolRunStatus
  result?: string
}

/** 对话面板中展示的一条消息 */
export type AgentChatUiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  reasoning: string
  toolRuns: AgentToolRun[]
  /** 用户消息携带的附件 */
  attachments?: AgentChatAttachment[]
  error?: string
  stopped?: boolean
}

/** 将 OpenAI 兼容的工具调用转换为 UI 记录 */
export function toToolRun(toolCall: AgentToolCall): AgentToolRun {
  return {
    id: toolCall.id,
    name: toolCall.function.name,
    arguments: toolCall.function.arguments,
    status: 'running',
  }
}
