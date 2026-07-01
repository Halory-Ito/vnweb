import { bilibiliPlugin } from './builtin/bilibili-plugin'
import { youtubePlugin } from './builtin/youtube-plugin'
import { initializePlugins, registerPlugin } from './registry'
import { bangumiProvider } from '@/lib/providers/bangumi-provider'
import { steamProvider } from '@/lib/providers/steam-provider'
import { steamgriddbProvider } from '@/lib/providers/steamgriddb-provider'
import { vndbProvider } from '@/lib/providers/vndb-provider'
import { ymgalProvider } from '@/lib/providers/ymgal-provider'

// ── 同步注册所有内置插件（模块加载时立即执行） ──────────
registerPlugin(bangumiProvider)
registerPlugin(steamProvider)
registerPlugin(steamgriddbProvider)
registerPlugin(vndbProvider)
registerPlugin(ymgalProvider)

registerPlugin(bilibiliPlugin)
registerPlugin(youtubePlugin)

/**
 * 初始化插件系统：
 * 1. 内置插件已在模块加载时同步注册（见上方）
 * 2. 加载外部插件（仅服务端）
 * 3. 同步启用状态到 Hook 执行器
 */
export async function bootstrapPlugins() {
  // 加载外部插件（仅在服务端环境中执行）
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
