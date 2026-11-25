import { defineConfig } from 'vitepress'

import { guideModules } from './guide-modules'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'vnweb',
  description: 'Open-source, local-first, agent-native infrastructure for digital culture.',
  lang: 'en-US',
  lastUpdated: true,
  cleanUrls: true,
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/vnweb-icon.png' }],
    ['meta', { property: 'og:title', content: 'vnweb — Open Infrastructure for Digital Culture' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Open-source, local-first, agent-native infrastructure for visual novels and local single-player games.',
      },
    ],
    ['meta', { property: 'og:type', content: 'website' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
      },
    ],
  ],

  markdown: {
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark',
    },
  },

  themeConfig: {
    logo: { src: '/vnweb-icon.png', alt: 'vnweb' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Halory-Ito/vnweb' }],
    editLink: {
      pattern: 'https://github.com/Halory-Ito/vnweb/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/intro/what-is-vnweb', activeMatch: '/guide/' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'About', link: '/about' },
          {
            text: 'v0.2.2',
            items: [
              { text: 'Releases', link: 'https://github.com/Halory-Ito/vnweb/releases' },
              { text: 'Changelog', link: '/guide/advanced/changelog' },
              { text: 'Contributing', link: '/guide/advanced/contributing' },
            ],
          },
        ],

        sidebar: {
          '/guide/': [
            {
              text: 'Introduction',
              items: [
                { text: 'What Is vnweb', link: '/guide/intro/what-is-vnweb' },
                {
                  text: 'Installation & Configuration',
                  link: '/guide/intro/installation-and-configuration',
                },
                { text: 'Quick Start', link: '/guide/intro/quick-start' },
              ],
            },
            ...guideModules('en-US'),
            {
              text: 'Deep Dive',
              items: [
                { text: 'Architecture Overview', link: '/guide/advanced/architecture' },
                { text: 'API & Data Layer', link: '/guide/advanced/api-and-data' },
                {
                  text: 'Platform Integrations & WebMCP',
                  link: '/guide/advanced/platform-integrations',
                },
                { text: 'Contributing Guide', link: '/guide/advanced/contributing' },
                { text: 'FAQ', link: '/guide/advanced/faq' },
                { text: 'Glossary', link: '/guide/advanced/glossary' },
                { text: 'Changelog', link: '/guide/advanced/changelog' },
              ],
            },
          ],
        },

        editLink: {
          pattern: 'https://github.com/Halory-Ito/vnweb/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },

        footer: {
          message:
            'Released under the AGPL-3.0 License. Open-source, local-first, agent-native infrastructure for digital culture.',
          copyright: 'Copyright © 2026 vnweb',
        },

        outline: {
          level: [2, 3],
          label: 'On this page',
        },

        docFooter: {
          prev: 'Previous',
          next: 'Next',
        },

        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'short',
            timeStyle: 'medium',
          },
        },

        langMenuLabel: 'Languages',
        returnToTopLabel: 'Back to top',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light theme',
        darkModeSwitchTitle: 'Switch to dark theme',
      },
    },

    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      description: '面向数字文化的开源、本地优先、Agent 原生基础设施',
      themeConfig: {
        nav: [
          { text: '使用指南', link: '/zh/guide/intro/what-is-vnweb', activeMatch: '/zh/guide/' },
          { text: '路线图', link: '/zh/roadmap' },
          { text: '关于', link: '/zh/about' },
          {
            text: 'v0.2.2',
            items: [
              { text: '发布版本', link: 'https://github.com/Halory-Ito/vnweb/releases' },
              { text: '更新日志', link: '/zh/guide/advanced/changelog' },
              { text: '贡献指南', link: '/zh/guide/advanced/contributing' },
            ],
          },
        ],

        sidebar: {
          '/zh/guide/': [
            {
              text: '简介',
              items: [
                { text: '什么是 vnweb', link: '/zh/guide/intro/what-is-vnweb' },
                {
                  text: '安装与配置',
                  link: '/zh/guide/intro/installation-and-configuration',
                },
                { text: '快速开始', link: '/zh/guide/intro/quick-start' },
              ],
            },
            ...guideModules('zh-CN'),
            {
              text: '深入探索',
              items: [
                { text: '架构总览', link: '/zh/guide/advanced/architecture' },
                { text: 'API 与数据层', link: '/zh/guide/advanced/api-and-data' },
                {
                  text: '平台接入与 WebMCP',
                  link: '/zh/guide/advanced/platform-integrations',
                },
                { text: '贡献指南', link: '/zh/guide/advanced/contributing' },
                { text: '常见问题', link: '/zh/guide/advanced/faq' },
                { text: '术语表', link: '/zh/guide/advanced/glossary' },
                { text: '更新日志', link: '/zh/guide/advanced/changelog' },
              ],
            },
          ],
        },

        editLink: {
          pattern: 'https://github.com/Halory-Ito/vnweb/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页',
        },

        footer: {
          message: '基于 AGPL-3.0 协议开源 · 面向数字文化的开源、本地优先、Agent 原生基础设施',
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
    },
  },
})
