import { api } from '@/lib/request-utils'

import type {
  AgentChatMessage,
  AgentConfig,
  AgentStreamResult,
  AgentToolCall,
  AgentToolDefinition,
} from '@/types/agent'

/** 读取 Agent 配置（API Key 已脱敏） */
export const getAgentConfigApi = async () => {
  const response = await api.get<{ data: AgentConfig }>('/agent/config')
  return response.data.data
}

/** 保存 Agent 配置（API Key 传脱敏占位符时沿用已保存的值） */
export const saveAgentConfigApi = async (payload: AgentConfig) => {
  const response = await api.post<{ data: AgentConfig }>('/agent/config', payload)
  return response.data.data
}

/** 拉取上游模型列表（用于测试连接与模型选择） */
export const listAgentModelsApi = async (payload: {
  baseUrl: string
  apiKey?: string
  configId?: string
}) => {
  const response = await api.post<{ data: { models: string[] } }>('/agent/models', payload)
  return response.data.data.models
}

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: unknown
      reasoning_content?: unknown
      tool_calls?: Array<{
        index?: unknown
        id?: unknown
        function?: { name?: unknown; arguments?: unknown }
      }>
    }
    finish_reason?: unknown
  }>
}

export type StreamAgentChatOptions = {
  configId: string
  messages: AgentChatMessage[]
  tools: AgentToolDefinition[]
  signal?: AbortSignal
  onContentDelta?: (text: string) => void
  onReasoningDelta?: (text: string) => void
}

/**
 * 流式发起对话请求（SSE）。
 *
 * 说明：浏览器端 axios 无法逐块读取响应体，这里使用 fetch + ReadableStream，
 * 属于 API 层的请求实现，组件中不直接调用 fetch。
 */
export async function streamAgentChatApi(
  options: StreamAgentChatOptions,
): Promise<AgentStreamResult> {
  const { configId, messages, tools, signal, onContentDelta, onReasoningDelta } = options

  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ configId, messages, tools }),
    signal,
    cache: 'no-store',
  })

  if (!response.ok || !response.body) {
    let message = `对话请求失败 (${response.status})`
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // 非 JSON 响应，保留默认信息
    }
    throw new Error(message)
  }

  let content = ''
  let reasoning = ''
  let finishReason: string | null = null
  const toolCallParts = new Map<number, { id: string; name: string; arguments: string }>()

  const handleData = (data: string) => {
    if (!data || data === '[DONE]') {
      return
    }

    let chunk: StreamChunk
    try {
      chunk = JSON.parse(data) as StreamChunk
    } catch {
      return
    }

    // 部分上游会在末尾追加 usage 等没有 choices 的分片
    const choice = chunk.choices?.[0]
    if (!choice) {
      return
    }

    const delta = choice.delta ?? {}

    if (typeof delta.content === 'string' && delta.content) {
      content += delta.content
      onContentDelta?.(delta.content)
    }

    if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
      reasoning += delta.reasoning_content
      onReasoningDelta?.(delta.reasoning_content)
    }

    if (Array.isArray(delta.tool_calls)) {
      for (const part of delta.tool_calls) {
        const index = typeof part.index === 'number' ? part.index : 0
        const current = toolCallParts.get(index) ?? { id: '', name: '', arguments: '' }

        if (typeof part.id === 'string' && part.id) {
          current.id = part.id
        }
        if (typeof part.function?.name === 'string' && part.function.name) {
          current.name += part.function.name
        }
        if (typeof part.function?.arguments === 'string') {
          current.arguments += part.function.arguments
        }

        toolCallParts.set(index, current)
      }
    }

    if (typeof choice.finish_reason === 'string' && choice.finish_reason) {
      finishReason = choice.finish_reason
    }
  }

  const processBuffer = (text: string, flush = false) => {
    const lines = text.split('\n')
    const rest = flush ? '' : (lines.pop() ?? '')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) {
        continue
      }
      handleData(trimmed.slice(5).trim())
    }

    return rest
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    buffer += decoder.decode(value, { stream: true })
    buffer = processBuffer(buffer)
  }

  processBuffer(buffer, true)

  const toolCalls: AgentToolCall[] = [...toolCallParts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([index, part]) => ({
      id: part.id || `call_${index}`,
      type: 'function',
      function: {
        name: part.name,
        arguments: part.arguments || '{}',
      },
    }))

  return { content, reasoning, toolCalls, finishReason }
}
