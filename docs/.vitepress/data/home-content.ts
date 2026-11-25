export type HomeAction = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
  icon?: string
}

export type HomeFoundationItem = {
  icon: string
  title: string
  summary: string
  meta: string
  href: string
}

export type HomeRoadmapTrack = {
  index: string
  status: string
  title: string
  summary: string
  href: string
}

export type HomeDirectoryGroup = {
  title: string
  items: { label: string; href: string }[]
}

export type HomeContent = {
  hero: {
    eyebrow: string
    headlinePrefix: string
    headlineAccent: string
    subtitle: string
    actions: HomeAction[]
    specs: { label: string; value: string }[]
    previewWindowTitle: string
    previewStatus: string
    previewAlt: string
  }
  foundation: {
    eyebrow: string
    title: string
    description: string
    items: HomeFoundationItem[]
  }
  roadmap: {
    eyebrow: string
    title: string
    description: string
    tracks: HomeRoadmapTrack[]
    plannedLabel: string
    plannedItems: string[]
    securityLabel: string
    securityItems: string[]
    ctaLabel: string
    ctaHref: string
  }
  directory: {
    eyebrow: string
    title: string
    groups: HomeDirectoryGroup[]
    quickStartTitle: string
    quickStartCommand: string
    copyLabel: string
    copiedLabel: string
    desktopLabel: string
    desktopHref: string
    installGuideLabel: string
    installGuideHref: string
  }
}

const enContent: HomeContent = {
  hero: {
    eyebrow: 'AGPL-3.0 · v0.2.2 · LOCAL-FIRST · AGENT-NATIVE',
    headlinePrefix: 'Open infrastructure for',
    headlineAccent: 'digital culture.',
    subtitle:
      'Starting with visual novels and local single-player games, vnweb unifies multi-source metadata, narrative archives, play analytics, and human-controlled AI agents in a self-hosted library you own.',
    actions: [
      {
        label: 'Get Started',
        href: '/guide/intro/what-is-vnweb',
        variant: 'primary',
        icon: 'arrow-right',
      },
      { label: 'Public Roadmap', href: '/roadmap', variant: 'secondary', icon: 'sparkles' },
      {
        label: 'Install & Desktop',
        href: '/guide/intro/installation-and-configuration',
        variant: 'secondary',
        icon: 'download',
      },
    ],
    specs: [
      { label: 'Storage', value: 'Local SQLite · Your Disk' },
      { label: 'Agent Layer', value: 'WebMCP · GenUI Cards' },
      { label: 'Runtimes', value: 'Web · Tauri v2 · CLI' },
    ],
    previewWindowTitle: 'vnweb · local-first cultural archive',
    previewStatus: 'v0.2.2',
    previewAlt:
      'vnweb game detail interface displaying cover art, playtime metrics, metadata dossier, and tabs for characters, PV, OST, records, memories, quotes, and walkthroughs',
  },
  foundation: {
    eyebrow: '01 / FOUNDATION · SHIPPED IN v0.2.2',
    title: 'A complete local-first core, ready for daily use.',
    description:
      'Every core workflow—from disk scanning and five-source scraping to lossless backups and WebMCP tool calls—already runs offline-first on your machine.',
    items: [
      {
        icon: 'gamepad',
        title: 'Library & Multi-Mode Scanner',
        summary:
          'Recursive, hierarchical, and executable scanning with exclude rules; four layouts, collections, and automated session tracking.',
        meta: '4 layouts · SQLite',
        href: '/guide/feats/game-library',
      },
      {
        icon: 'globe',
        title: '5-Source Metadata & Sync',
        summary:
          'Enrich entries from Steam, VNDB, Bangumi, YMGal, and SteamGridDB, with Steam playtime import and Bangumi / VNDB status push.',
        meta: '5 providers · atomic config',
        href: '/guide/feats/platforms',
      },
      {
        icon: 'media',
        title: 'Narrative Dossier & Media',
        summary:
          'Characters, HLS/YouTube/Bilibili PVs, NetEase & Meting OSTs, MDX frontmatter memories, XLSX quotes, and four-level walkthroughs.',
        meta: 'MDX · OST · Guides',
        href: '/guide/feats/media',
      },
      {
        icon: 'chart',
        title: 'Analytics, Themes & Backups',
        summary:
          'Heatmaps, session duration distributions, yearly PNG posters, custom local fonts, frosted glass, and WebDAV / S3 ZIP sync.',
        meta: 'Reports · WebDAV / S3',
        href: '/guide/feats/play-records',
      },
      {
        icon: 'sparkles',
        title: 'AI Assistant & WebMCP',
        summary:
          'OpenAI-compatible streaming chat with collapsible reasoning, multimodal attachments, 7 WebMCP tools, and Generative UI confirmation.',
        meta: '7 tools · GenUI gates',
        href: '/guide/feats/ai-assistant',
      },
      {
        icon: 'terminal',
        title: 'Web, Tauri Desktop & CLI',
        summary:
          'Run the Next.js server, launch games and track time via the Rust/Node CLI, or install the Windows x64 Tauri v2 desktop app.',
        meta: 'Win x64 · Portable · CLI',
        href: '/guide/feats/other',
      },
    ],
  },
  roadmap: {
    eyebrow: '02 / RESEARCH & ROADMAP',
    title: 'Where vnweb goes next: narrative graphs & spoiler-safe agents.',
    description:
      'Guided by ROADMAP.md, the next phase builds open-source components for narrative understanding, knowledge representation, and verifiable agent safety—alongside near-term library additions.',
    tracks: [
      {
        index: 'R1',
        status: 'PROPOSED RESEARCH',
        title: 'Multimodal Narrative Understanding',
        summary:
          'Extract characters, events, and route relationships from user-selected text and screenshots, evaluated on source provenance.',
        href: '/roadmap#_1-multimodal-narrative-understanding',
      },
      {
        index: 'R2',
        status: 'PROPOSED RESEARCH',
        title: 'Semantic Knowledge Graphs',
        summary:
          'Define reusable schemas for works, characters, routes, and events that preserve source attribution and export cleanly.',
        href: '/roadmap#_2-semantic-knowledge-graphs',
      },
      {
        index: 'R3',
        status: 'PROPOSED RESEARCH',
        title: 'Spoiler-Aware GraphRAG',
        summary:
          'Retrieve graph context conditioned on the player’s current route and progress, benchmarking spoiler leakage and grounding.',
        href: '/roadmap#_3-spoiler-aware-graphrag',
      },
      {
        index: 'R4',
        status: 'PROPOSED RESEARCH',
        title: 'Agent Workflows & Guardrails',
        summary:
          'Extend WebMCP with structured previews, separated read/write permissions, explicit confirmations, and prompt-injection evaluation.',
        href: '/roadmap#_4-agent-workflows-generative-ui',
      },
    ],
    plannedLabel: 'Planned Library Features',
    plannedItems: ['CG Gallery Module', 'Per-Launch Patch Manager'],
    securityLabel: 'Privacy & Security Commitments',
    securityItems: [
      'Outbound request scope visibility',
      'Read / write tool separation',
      'Prompt-injection benchmarks',
    ],
    ctaLabel: 'Read the full roadmap',
    ctaHref: '/roadmap',
  },
  directory: {
    eyebrow: '03 / DOCUMENTATION',
    title: 'Explore the manual by topic',
    groups: [
      {
        title: 'Start Here',
        items: [
          { label: 'What Is vnweb', href: '/guide/intro/what-is-vnweb' },
          {
            label: 'Installation & Configuration',
            href: '/guide/intro/installation-and-configuration',
          },
          { label: 'Quick Start (5 min)', href: '/guide/intro/quick-start' },
          { label: 'About & Origins', href: '/about' },
        ],
      },
      {
        title: 'Library & Platforms',
        items: [
          { label: 'Scanning & Game Library', href: '/guide/feats/game-library' },
          { label: 'Platform Integrations', href: '/guide/feats/platforms' },
          { label: 'Launching & Play History', href: '/guide/feats/play-records' },
          { label: 'Backup, Restore & Sync', href: '/guide/feats/save-backup' },
        ],
      },
      {
        title: 'Media, Notes & AI',
        items: [
          { label: 'PV & OST', href: '/guide/feats/media' },
          { label: 'Characters, Quotes & Memories', href: '/guide/feats/game-notes' },
          { label: 'Walkthroughs & Route Progress', href: '/guide/feats/walkthroughs' },
          { label: 'AI Assistant & WebMCP', href: '/guide/feats/ai-assistant' },
        ],
      },
      {
        title: 'Architecture & Ops',
        items: [
          { label: 'Architecture Overview', href: '/guide/advanced/architecture' },
          { label: 'API & Data Layer', href: '/guide/advanced/api-and-data' },
          { label: 'Providers & WebMCP Spec', href: '/guide/advanced/platform-integrations' },
          { label: 'Appearance, CLI & FAQ', href: '/guide/advanced/faq' },
        ],
      },
    ],
    quickStartTitle: 'Quick Start from Source (Node.js ≥ 20.9)',
    quickStartCommand:
      'git clone https://github.com/Halory-Ito/vnweb.git && cd vnweb && npm install && npm run db:push && npm run dev',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
    desktopLabel: 'Windows x64 Installer',
    desktopHref: 'https://github.com/Halory-Ito/vnweb/releases/latest',
    installGuideLabel: 'All Install Options',
    installGuideHref: '/guide/intro/installation-and-configuration',
  },
}

const zhContent: HomeContent = {
  hero: {
    eyebrow: 'AGPL-3.0 · v0.2.2 · 本地优先 · AGENT 原生',
    headlinePrefix: '面向数字文化的',
    headlineAccent: '本地优先、Agent 原生基础设施。',
    subtitle:
      '从视觉小说与本地单机游戏出发，vnweb 将多源社区元数据、叙事档案、游玩统计与用户可控的 AI Agent 收束进完全属于你的自托管资料库。',
    actions: [
      {
        label: '快速开始',
        href: '/zh/guide/intro/what-is-vnweb',
        variant: 'primary',
        icon: 'arrow-right',
      },
      { label: '公开路线图', href: '/zh/roadmap', variant: 'secondary', icon: 'sparkles' },
      {
        label: '安装与桌面端',
        href: '/zh/guide/intro/installation-and-configuration',
        variant: 'secondary',
        icon: 'download',
      },
    ],
    specs: [
      { label: '数据主权', value: '本地 SQLite · 自由迁移' },
      { label: 'Agent 协同', value: 'WebMCP · 生成式确认卡片' },
      { label: '运行形态', value: 'Web · Tauri v2 · CLI' },
    ],
    previewWindowTitle: 'vnweb · 本地优先数字文化档案库',
    previewStatus: 'v0.2.2',
    previewAlt:
      'vnweb 游戏详情界面，展示封面、游玩时长、基础元数据以及角色、PV、OST、记录、回忆、摘录和攻略标签页',
  },
  foundation: {
    eyebrow: '01 / FOUNDATION · v0.2.2 已交付底座',
    title: '开箱即用的本地优先核心，专为高密度作品库打磨。',
    description:
      '从磁盘扫描、五源资料刮削，到无损压缩备份与 WebMCP 工具调用，全部核心能力均已落地，默认在你的本机离线优先运行。',
    items: [
      {
        icon: 'gamepad',
        title: '游戏库与多模式扫描',
        summary: '多目录层级与可执行文件扫描、排除规则、四种布局视图、收藏夹与自动进程计时。',
        meta: '4 种布局 · SQLite',
        href: '/zh/guide/feats/game-library',
      },
      {
        icon: 'globe',
        title: '五源刮削与状态联动',
        summary: '接入 Steam、VNDB、Bangumi、YMGal 与 SteamGridDB，支持 Steam 时长同步与状态推送。',
        meta: '5 大数据源 · 原子配置',
        href: '/zh/guide/feats/platforms',
      },
      {
        icon: 'media',
        title: '叙事档案与全媒体管理',
        summary:
          '角色立绘、HLS/B站/YouTube PV、网易云/Meting OST、MDX 回忆、台词导出与四级攻略树。',
        meta: 'MDX · OST · 攻略树',
        href: '/zh/guide/feats/media',
      },
      {
        icon: 'chart',
        title: '统计、外观与远端备份',
        summary:
          '热力图、单次时长分布、年报海报导出、本地字体与毛玻璃主题，支持 WebDAV / S3 同步。',
        meta: '统计海报 · WebDAV / S3',
        href: '/zh/guide/feats/play-records',
      },
      {
        icon: 'sparkles',
        title: 'AI 助手与 WebMCP',
        summary:
          'OpenAI 兼容流式对话（思维链折叠、多模态附件）、7 项内置工具与生成式 UI 确认卡片。',
        meta: '7 项工具 · 显式确认',
        href: '/zh/guide/feats/ai-assistant',
      },
      {
        icon: 'terminal',
        title: 'Web、桌面端与命令行',
        summary:
          '可自托管 Next.js 服务，支持 Rust/Node 命令行快启动计时，提供 Windows x64 桌面安装包。',
        meta: 'Win x64 · 便携版 · CLI',
        href: '/zh/guide/feats/other',
      },
    ],
  },
  roadmap: {
    eyebrow: '02 / RESEARCH & ROADMAP · 公开路线图',
    title: '下一阶段演进：叙事知识图谱与防剧透 Agent 研究。',
    description:
      '依托 ROADMAP.md 推进可复用开源组件与基准评估——围绕多模态叙事理解、语义图谱与按游玩进度防剧透的 GraphRAG 展开，并补齐游戏库高频扩展。',
    tracks: [
      {
        index: 'R1',
        status: '拟议研发',
        title: '多模态叙事理解',
        summary:
          '从用户主动选择的文本与游戏截图中抽取角色、事件与路线关系，并评估回答的原文溯源能力。',
        href: '/zh/roadmap#_1-多模态叙事理解',
      },
      {
        index: 'R2',
        status: '拟议研发',
        title: '语义知识图谱',
        summary: '为作品、角色、路线与事件定义可复用 Schema，保留来源出处并支持图谱查询与导出。',
        href: '/zh/roadmap#_2-语义知识图谱',
      },
      {
        index: 'R3',
        status: '拟议研发',
        title: '剧透感知 GraphRAG',
        summary: '依据玩家当前路线与游玩进度约束检索范围，定量衡量剧透泄漏率、相关性与事实落地度。',
        href: '/zh/roadmap#_3-剧透感知-graphrag',
      },
      {
        index: 'R4',
        status: '拟议研发',
        title: 'Agent 工作流与权限护栏',
        summary:
          '为 WebMCP 增加结构化结果与变更预览，推进读写权限分离、重要写入确认与提示词注入抗性评估。',
        href: '/zh/roadmap#_4-agent-工作流与生成式-ui',
      },
    ],
    plannedLabel: '近期规划中的游戏库功能',
    plannedItems: ['CG 画廊模块', '按次启动补丁管理'],
    securityLabel: '隐私与安全目标',
    securityItems: ['外发请求范围对用户可见', '读写工具权限分离', '第三方文本提示注入评估'],
    ctaLabel: '查看完整公开路线图',
    ctaHref: '/zh/roadmap',
  },
  directory: {
    eyebrow: '03 / DOCUMENTATION · 文档索引',
    title: '按主题快速查阅文档',
    groups: [
      {
        title: '快速入门',
        items: [
          { label: '什么是 vnweb', href: '/zh/guide/intro/what-is-vnweb' },
          { label: '安装与配置', href: '/zh/guide/intro/installation-and-configuration' },
          { label: '5 分钟快速开始', href: '/zh/guide/intro/quick-start' },
          { label: '关于项目与缘起', href: '/zh/about' },
        ],
      },
      {
        title: '游戏库与平台',
        items: [
          { label: '扫描与游戏库', href: '/zh/guide/feats/game-library' },
          { label: '平台接入与资料更新', href: '/zh/guide/feats/platforms' },
          { label: '启动与游玩记录', href: '/zh/guide/feats/play-records' },
          { label: '备份、恢复与同步', href: '/zh/guide/feats/save-backup' },
        ],
      },
      {
        title: '媒体、笔记与 AI',
        items: [
          { label: 'PV 与 OST', href: '/zh/guide/feats/media' },
          { label: '角色、摘录与回忆', href: '/zh/guide/feats/game-notes' },
          { label: '攻略与路线进度', href: '/zh/guide/feats/walkthroughs' },
          { label: 'AI 助手与 WebMCP', href: '/zh/guide/feats/ai-assistant' },
        ],
      },
      {
        title: '架构与参考',
        items: [
          { label: '架构总览', href: '/zh/guide/advanced/architecture' },
          { label: 'API 与数据层', href: '/zh/guide/advanced/api-and-data' },
          { label: 'Provider 与 WebMCP 规范', href: '/zh/guide/advanced/platform-integrations' },
          { label: '常见问题与更新日志', href: '/zh/guide/advanced/faq' },
        ],
      },
    ],
    quickStartTitle: '从源码快速启动（Node.js ≥ 20.9）',
    quickStartCommand:
      'git clone https://github.com/Halory-Ito/vnweb.git && cd vnweb && npm install && npm run db:push && npm run dev',
    copyLabel: '复制',
    copiedLabel: '已复制',
    desktopLabel: 'Windows x64 安装包',
    desktopHref: 'https://github.com/Halory-Ito/vnweb/releases/latest',
    installGuideLabel: '全部安装方式',
    installGuideHref: '/zh/guide/intro/installation-and-configuration',
  },
}

export function getHomeContent(lang: string): HomeContent {
  return lang.startsWith('zh') ? zhContent : enContent
}
