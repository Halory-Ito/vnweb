import { bangumiProvider } from '@/lib/providers/bangumi-provider'
import { steamProvider } from '@/lib/providers/steam-provider'
import { steamgriddbProvider } from '@/lib/providers/steamgriddb-provider'
import { vndbProvider } from '@/lib/providers/vndb-provider'
import { ymgalProvider } from '@/lib/providers/ymgal-provider'

import { bilibiliPlugin } from './builtin/bilibili-plugin'
import { youtubePlugin } from './builtin/youtube-plugin'
import { initializePlugins, registerPlugin } from './registry'

/**
 * 初始化插件系统：
 * 1. 注册所有内置插件
 * 2. 加载外部插件（仅服务端）
 * 3. 同步启用状态到 Hook 执行器
 */
export async function bootstrapPlugins() {
  // 注册内置数据源插件
  registerPlugin(bangumiProvider)
  registerPlugin(steamProvider)
  registerPlugin(steamgriddbProvider)
  registerPlugin(vndbProvider)
  registerPlugin(ymgalProvider)

  // 注册内置功能增强插件
  registerPlugin(bilibiliPlugin)
  registerPlugin(youtubePlugin)

  // 加载外部插件（仅在服务端环境中执行，动态 import 避免 node:fs 进入客户端 bundle）
  if (typeof window === 'undefined') {
    try {
      const { loadExternalPlugins } = await import('./loader')
      const external = await loadExternalPlugins()
      if (external.length > 0) {
        console.log(
          `Loaded ${external.length} external plugin(s): ${external.join(', ')}`,
        )
      }
    } catch {
      // 外部插件加载失败不阻塞启动
    }
  }

  // 同步启用状态
  initializePlugins()
}
