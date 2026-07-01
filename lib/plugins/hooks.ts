import type { FeaturePlugin, HookId, HookTypeMap } from './types'

// ── 内部状态：已注册的功能插件列表 ────────────────────────
let activeFeaturePlugins: FeaturePlugin[] = []

/** 设置当前活跃的功能插件列表（由 registry 调用） */
export function setActiveFeaturePlugins(plugins: FeaturePlugin[]) {
  activeFeaturePlugins = plugins
}

// ═══════════════════════════════════════════════════════════
//  Hook 调用接口
// ═══════════════════════════════════════════════════════════

/**
 * 调用指定 Hook，返回第一个非 null 的结果。
 * 适用于"第一个匹配者胜出"的场景（如 URL 解析）。
 */
export async function callHook<K extends HookId>(
  hookId: K,
  input: HookTypeMap[K]['input'],
): Promise<HookTypeMap[K]['output'] | null> {
  for (const plugin of activeFeaturePlugins) {
    if (!plugin.hooks.includes(hookId)) continue
    const handler = plugin.handlers[hookId]
    if (!handler) continue

    try {
      const result = await handler(input)
      if (result !== null && result !== undefined) {
        return result as HookTypeMap[K]['output']
      }
    } catch (error) {
      console.error(`Plugin "${plugin.id}" hook "${hookId}" error:`, error)
    }
  }
  return null
}

/**
 * 调用指定 Hook 的所有处理器，返回所有非 null 结果。
 * 适用于"聚合所有结果"的场景（如元数据增强）。
 */
export async function callAllHooks<K extends HookId>(
  hookId: K,
  input: HookTypeMap[K]['input'],
): Promise<Array<HookTypeMap[K]['output']>> {
  const results: Array<HookTypeMap[K]['output']> = []

  for (const plugin of activeFeaturePlugins) {
    if (!plugin.hooks.includes(hookId)) continue
    const handler = plugin.handlers[hookId]
    if (!handler) continue

    try {
      const result = await handler(input)
      if (result !== null && result !== undefined) {
        results.push(result as HookTypeMap[K]['output'])
      }
    } catch (error) {
      console.error(`Plugin "${plugin.id}" hook "${hookId}" error:`, error)
    }
  }
  return results
}

/**
 * 通知式调用，不关心返回值。
 * 适用于"广播事件"的场景。
 */
export async function notifyHook<K extends HookId>(
  hookId: K,
  input: HookTypeMap[K]['input'],
): Promise<void> {
  for (const plugin of activeFeaturePlugins) {
    if (!plugin.hooks.includes(hookId)) continue
    const handler = plugin.handlers[hookId]
    if (!handler) continue

    try {
      await handler(input)
    } catch (error) {
      console.error(`Plugin "${plugin.id}" hook "${hookId}" error:`, error)
    }
  }
}
