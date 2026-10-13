import { AGENT_API_KEY_MASK, readAgentConfig } from '@/lib/server/agent-config'

import type { AgentModelConfig } from '@/types/agent'

/** 归一化 OpenAI 兼容接口地址（去掉尾部斜杠） */
export function normalizeBaseUrl(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\/+$/, '')
}

/** 从上游错误响应文本中提取可读信息 */
export function extractUpstreamError(text: string): string {
  if (!text) {
    return '未知错误'
  }

  try {
    const parsed = JSON.parse(text) as {
      error?: string | { message?: unknown }
      message?: unknown
    }

    if (typeof parsed.error === 'string' && parsed.error) {
      return parsed.error
    }

    if (typeof parsed.message === 'string' && parsed.message) {
      return parsed.message
    }

    if (parsed.error && typeof parsed.error === 'object') {
      const message = parsed.error.message
      if (typeof message === 'string' && message) {
        return message
      }
    }
  } catch {
    // 非 JSON 响应，回退为截断文本
  }

  return text.slice(0, 300)
}

/** 将 fetch 抛出的网络错误转换为可读信息 */
export function toUpstreamFetchError(error: unknown): string {
  if (error instanceof TypeError) {
    return '无法连接到接口地址，请检查 Base URL 与网络'
  }

  return (error as Error)?.message || '未知错误'
}

/** 按 id 查找模型配置；id 无效时回退到当前激活配置或首个配置 */
export async function resolveAgentModelConfig(configId: unknown): Promise<AgentModelConfig | null> {
  const config = await readAgentConfig()
  const id = String(configId ?? '').trim()

  return (
    config.configs.find((item) => item.id === id) ??
    config.configs.find((item) => item.id === config.activeConfigId) ??
    config.configs[0] ??
    null
  )
}

/** 解析请求使用的 API Key：为空或为脱敏占位符时读取已保存配置的真实值 */
export async function resolveAgentApiKey(apiKey: unknown, configId: unknown): Promise<string> {
  const key = String(apiKey ?? '').trim()
  if (key && key !== AGENT_API_KEY_MASK) {
    return key
  }

  const config = await readAgentConfig()
  const id = String(configId ?? '').trim()
  return config.configs.find((item) => item.id === id)?.apiKey ?? ''
}
