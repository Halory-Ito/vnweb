'use client'

import { ensureWebMcpRuntime } from '@/lib/webmcp'

import type { AgentToolDefinition } from '@/types/agent'

/** 获取当前文档已注册的 WebMCP 工具 */
export async function listWebMcpTools(): Promise<WebMCP.RegisteredTool[]> {
  ensureWebMcpRuntime()

  const context = document.modelContext
  if (!context) {
    return []
  }

  return context.getTools()
}

/** 将 WebMCP 工具转换为 OpenAI 兼容的工具定义 */
export function toAgentToolDefinitions(tools: WebMCP.RegisteredTool[]): AgentToolDefinition[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema ?? { type: 'object', properties: {} },
    },
  }))
}

/** 解析模型给出的工具调用参数（JSON 字符串） */
export function parseToolCallArguments(raw: string): Record<string, unknown> {
  const text = raw.trim()
  if (!text) {
    return {}
  }

  const parsed = JSON.parse(text) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('工具参数必须是 JSON 对象')
  }

  return parsed as Record<string, unknown>
}

/** 调用 WebMCP 工具并返回结果字符串 */
export async function executeWebMcpTool(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  ensureWebMcpRuntime()

  const context = document.modelContext
  if (!context) {
    throw new Error('当前环境不支持 WebMCP')
  }

  const tools = await context.getTools()
  const tool = tools.find((item) => item.name === name)
  if (!tool) {
    throw new Error(`未找到工具「${name}」`)
  }

  return context.executeTool(tool, args)
}
