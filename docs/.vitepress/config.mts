import { defineConfig } from 'vitepress'

import { guideModules } from './guide-modules'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'vnweb',
  description: '视觉小说与本地单机游戏管理面板',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  appearance: 'dark',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/vnweb-icon.png' }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/vnweb-icon.png', alt: '' },
    nav: [
      { text: '使用指南', link: '/guide/intro/what-is-vnweb' },
      { text: '关于', link: '/about' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '简介',
          items: [
            { text: '什么是 vnweb', link: '/guide/intro/what-is-vnweb' },
            {
              text: '安装与配置',
              link: '/guide/intro/installation-and-configuration',
            },
          ],
        },
        ...guideModules,
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/Halory-Ito/vnweb' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/Halory-Ito/vnweb/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    footer: {
      // message: '基于 Next.js + React 19 + Drizzle ORM 构建',
      copyright: 'Copyright © 2026 vnweb',
    },

    outline: {
      level: [2, 3],
      label: '页面导航',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
})
