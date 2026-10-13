// Agent 领域类型：模型配置与对话消息（OpenAI 兼容格式）

/** 单个模型配置条目 */
export type AgentModelConfig = {
  id: string
  /** 显示名称 */
  name: string
  /** OpenAI 兼容接口地址，如 https://api.openai.com/v1 */
  baseUrl: string
  /** API Key；GET 接口返回脱敏占位符，未设置时为空字符串 */
  apiKey: string
  /** 模型名称，如 gpt-4o-mini */
  model: string
  /** 可选的系统提示词 */
  systemPrompt?: string
}

/** Agent 全局配置 */
export type AgentConfig = {
  configs: AgentModelConfig[]
  activeConfigId: string
}

/** 对话消息角色（OpenAI 兼容） */
export type AgentChatRole = 'user' | 'assistant' | 'tool'

/** OpenAI 兼容的工具调用 */
export type AgentToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

/** OpenAI 兼容的多模态内容片段 */
export type AgentChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

/** OpenAI 兼容的对话消息 */
export type AgentChatMessage = {
  role: AgentChatRole
  content: string | AgentChatContentPart[] | null
  tool_calls?: AgentToolCall[]
  tool_call_id?: string
}

/** OpenAI 兼容的工具定义（由 WebMCP 工具转换而来） */
export type AgentToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: object
  }
}

/** SSE 流式对话结束后的汇总结果 */
export type AgentStreamResult = {
  content: string
  reasoning: string
  toolCalls: AgentToolCall[]
  finishReason: string | null
}
