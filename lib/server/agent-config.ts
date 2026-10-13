import { readConfig, updateConfigSection } from './config-rw'

import type { AgentConfig, AgentModelConfig } from '@/types/agent'

/** API Key 在接口层回显时的脱敏占位符 */
export const AGENT_API_KEY_MASK = '********'

const cleanString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** 规范化外部输入，补齐缺失的 id / activeConfigId，并过滤不完整条目 */
export function normalizeAgentConfig(input: unknown): AgentConfig {
  const source = (input ?? {}) as Record<string, unknown>
  const rawConfigs = Array.isArray(source.configs) ? source.configs : []

  const configs: AgentModelConfig[] = rawConfigs
    .map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>
      const config: AgentModelConfig = {
        id: cleanString(item.id) || crypto.randomUUID(),
        name: cleanString(item.name),
        baseUrl: cleanString(item.baseUrl),
        apiKey: typeof item.apiKey === 'string' ? item.apiKey.trim() : '',
        model: cleanString(item.model),
      }

      const systemPrompt = cleanString(item.systemPrompt)
      if (systemPrompt) {
        config.systemPrompt = systemPrompt
      }

      return config
    })
    .filter((item) => item.baseUrl && item.model)

  const activeConfigId = cleanString(source.activeConfigId)

  return {
    configs,
    activeConfigId: configs.some((item) => item.id === activeConfigId)
      ? activeConfigId
      : (configs[0]?.id ?? ''),
  }
}

/** 读取 app/config.json 中的 settings.agent（含真实 API Key，仅服务端使用） */
export async function readAgentConfig(): Promise<AgentConfig> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] ?? {}) as Record<string, unknown>
  return normalizeAgentConfig(settings['agent'])
}

/** 写入 app/config.json 的 settings.agent */
export async function writeAgentConfig(config: AgentConfig): Promise<void> {
  await updateConfigSection(['settings', 'agent'], config)
}

/** 回显给客户端前脱敏 API Key */
export function maskAgentConfig(config: AgentConfig): AgentConfig {
  return {
    ...config,
    configs: config.configs.map((item) => ({
      ...item,
      apiKey: item.apiKey ? AGENT_API_KEY_MASK : '',
    })),
  }
}

/** 合并客户端提交的配置：API Key 为脱敏占位符时沿用已保存的真实值 */
export function mergeAgentApiKeys(incoming: AgentConfig, stored: AgentConfig): AgentConfig {
  return {
    ...incoming,
    configs: incoming.configs.map((item) => {
      if (item.apiKey !== AGENT_API_KEY_MASK) {
        return item
      }

      // 优先按 id 匹配；id 对不上（如删除后重建）时退化为按「接口地址 + 模型」匹配，
      // 避免脱敏占位符把真实 Key 覆盖成空值
      const previous =
        stored.configs.find((saved) => saved.id === item.id) ??
        stored.configs.find((saved) => saved.baseUrl === item.baseUrl && saved.model === item.model)

      return { ...item, apiKey: previous?.apiKey ?? '' }
    }),
  }
}
