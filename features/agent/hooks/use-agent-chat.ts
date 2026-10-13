'use client'

import { useCallback, useRef, useState } from 'react'

import { streamAgentChatApi } from '@/api'
import { toToolRun } from '@/features/agent/lib/chat-types'
import {
  executeWebMcpTool,
  listWebMcpTools,
  parseToolCallArguments,
  toAgentToolDefinitions,
} from '@/features/agent/lib/webmcp-client'

import type { AgentChatUiMessage } from '@/features/agent/lib/chat-types'
import type { AgentChatMessage } from '@/types/agent'

/** 单次提问允许的最大工具调用轮数 */
const MAX_TOOL_ROUNDS = 6

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

type UseAgentChatOptions = {
  configId: string
}

/** 对话状态机：流式输出 + WebMCP 工具调用循环；状态在抽屉关闭后仍然保留 */
export function useAgentChat({ configId }: UseAgentChatOptions) {
  const [messages, setMessages] = useState<AgentChatUiMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [enableTools, setEnableTools] = useState(true)
  const historyRef = useRef<AgentChatMessage[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const patchMessage = useCallback(
    (id: string, patch: (message: AgentChatUiMessage) => AgentChatUiMessage) => {
      setMessages((prev) => prev.map((item) => (item.id === id ? patch(item) : item)))
    },
    [],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    historyRef.current = []
    setMessages([])
    setIsStreaming(false)
  }, [])

  const send = useCallback(
    async (text: string) => {
      const input = text.trim()
      if (!input || isStreaming || !configId) {
        return
      }

      setIsStreaming(true)

      const abortController = new AbortController()
      abortRef.current = abortController

      // 仅在整体成功结束时提交到历史，中断的轮次不会进入后续上下文
      const working: AgentChatMessage[] = [...historyRef.current, { role: 'user', content: input }]
      const assistantIds: string[] = []

      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: 'user', content: input, reasoning: '', toolRuns: [] },
      ])

      try {
        const tools = enableTools ? toAgentToolDefinitions(await listWebMcpTools()) : []

        for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
          const assistantId = createMessageId()
          assistantIds.push(assistantId)

          setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: '', reasoning: '', toolRuns: [] },
          ])

          const result = await streamAgentChatApi({
            configId,
            messages: working,
            tools,
            signal: abortController.signal,
            onContentDelta: (delta) =>
              patchMessage(assistantId, (message) => ({
                ...message,
                content: message.content + delta,
              })),
            onReasoningDelta: (delta) =>
              patchMessage(assistantId, (message) => ({
                ...message,
                reasoning: message.reasoning + delta,
              })),
          })

          if (result.toolCalls.length > 0) {
            if (round === MAX_TOOL_ROUNDS - 1) {
              throw new Error(`工具调用轮数超过上限（${MAX_TOOL_ROUNDS} 轮）`)
            }

            working.push({
              role: 'assistant',
              content: result.content || null,
              tool_calls: result.toolCalls,
            })
            patchMessage(assistantId, (message) => ({
              ...message,
              toolRuns: result.toolCalls.map(toToolRun),
            }))

            for (const toolCall of result.toolCalls) {
              let toolContent: string

              try {
                const args = parseToolCallArguments(toolCall.function.arguments)
                toolContent = await executeWebMcpTool(toolCall.function.name, args)
                patchMessage(assistantId, (message) => ({
                  ...message,
                  toolRuns: message.toolRuns.map((run) =>
                    run.id === toolCall.id
                      ? { ...run, status: 'success', result: toolContent }
                      : run,
                  ),
                }))
              } catch (toolError) {
                const errorMessage = (toolError as Error).message || '工具执行失败'
                toolContent = `Error: ${errorMessage}`
                patchMessage(assistantId, (message) => ({
                  ...message,
                  toolRuns: message.toolRuns.map((run) =>
                    run.id === toolCall.id ? { ...run, status: 'error', result: toolContent } : run,
                  ),
                }))
              }

              working.push({ role: 'tool', tool_call_id: toolCall.id, content: toolContent })
            }

            continue
          }

          if (!result.content.trim()) {
            throw new Error('模型未返回内容，请检查模型配置或稍后重试')
          }

          working.push({ role: 'assistant', content: result.content })
          break
        }

        historyRef.current = working
      } catch (error) {
        const aborted = abortController.signal.aborted
        const message = (error as Error).message || '对话失败'
        const lastAssistantId = assistantIds[assistantIds.length - 1]

        setMessages((prev) => {
          if (!lastAssistantId) {
            return [
              ...prev,
              {
                id: createMessageId(),
                role: 'assistant',
                content: '',
                reasoning: '',
                toolRuns: [],
                stopped: aborted || undefined,
                error: aborted ? undefined : message,
              },
            ]
          }

          return prev.map((item) =>
            item.id === lastAssistantId
              ? { ...item, stopped: aborted || undefined, error: aborted ? undefined : message }
              : item,
          )
        })
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [configId, enableTools, isStreaming, patchMessage],
  )

  return { messages, isStreaming, enableTools, setEnableTools, send, stop, clear }
}
