export type Lang = 'en-US' | 'zh-CN'

type GuideModule = {
  text: string
  icon: string
  items: { text: string; link: string }[]
}

export function guideModules(lang: string): GuideModule[] {
  const isZh = lang.startsWith('zh')
  const prefix = isZh ? '/zh' : ''
  const link = (path: string) => `${prefix}${path}`

  return [
    {
      text: isZh ? '游戏管理' : 'Game Management',
      icon: 'gamepad',
      items: [
        {
          text: isZh ? '扫描与游戏库' : 'Scanning & Game Library',
          link: link('/guide/feats/game-library'),
        },
        {
          text: isZh ? '平台接入与资料更新' : 'Platform Integration & Metadata',
          link: link('/guide/feats/platforms'),
        },
        {
          text: isZh ? '启动与游玩记录' : 'Launching & Play History',
          link: link('/guide/feats/play-records'),
        },
      ],
    },
    {
      text: isZh ? '媒体与内容' : 'Media & Content',
      icon: 'media',
      items: [
        { text: 'PV & OST', link: link('/guide/feats/media') },
        {
          text: isZh ? '角色、摘录与回忆' : 'Characters, Quotes & Memories',
          link: link('/guide/feats/game-notes'),
        },
        {
          text: isZh ? '攻略与路线进度' : 'Walkthroughs & Route Progress',
          link: link('/guide/feats/walkthroughs'),
        },
      ],
    },
    {
      text: isZh ? '设置与数据' : 'Settings & Data',
      icon: 'settings',
      items: [
        {
          text: isZh ? '外观与主题' : 'Appearance & Themes',
          link: link('/guide/feats/custom-theme'),
        },
        {
          text: isZh ? '备份、恢复与同步' : 'Backup, Restore & Sync',
          link: link('/guide/feats/save-backup'),
        },
      ],
    },
    {
      text: isZh ? '快捷工具' : 'Quick Tools',
      icon: 'terminal',
      items: [
        {
          text: isZh ? 'AI 助手与 WebMCP' : 'AI Assistant & WebMCP',
          link: link('/guide/feats/ai-assistant'),
        },
        {
          text: isZh ? '命令行工具' : 'Command-Line Tools',
          link: link('/guide/feats/other'),
        },
      ],
    },
  ]
}
