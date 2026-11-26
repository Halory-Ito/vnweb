import dayjs from 'dayjs'
import { Metadata } from 'next'

import '@/app/globals.css'
import { ThemeProvider } from 'next-themes'

import { GlobalSongPlayer } from '@/features/ost/components/global-song-player'
import 'dayjs/locale/zh-cn' // 导入本地化语言

dayjs.locale('zh-cn') // 使用本地化语言

import AppLayout from '@/components/layout/app-layout'
import { StartupSplashOverlay } from '@/components/layout/startup-splash-overlay'
import JotaiProvider from '@/components/providers/jotai-provider'
import TanStackProvider from '@/components/providers/tanstack-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { APP_NAME_MAX_LENGTH, APP_SETTINGS_STORAGE_KEY } from '@/lib/settings/app-settings'
import { BORDERLESS_STORAGE_KEY, DEFAULT_LAYOUT_SETTINGS } from '@/lib/settings/layout-settings'
import { GameWebMcpTools } from '@/webmcp/game'
import { GuideWebMcpTools } from '@/webmcp/guide'
import { OstWebMcpTools } from '@/webmcp/ost'
import { QuoteWebMcpTools } from '@/webmcp/quote'

export const metadata: Metadata = {
  // %s 会被子页面的 title 替换
  title: {
    template: '%s - vnweb',
    default: 'vnweb', // 如果没有子页面 title，则显示这个
  },
  description: '网站描述',
}

const borderlessScript = `
  try {
    const stored = localStorage.getItem(${JSON.stringify(BORDERLESS_STORAGE_KEY)});
    const value = JSON.parse(stored);
    if (typeof value === 'boolean') {
      document.documentElement.toggleAttribute('data-borderless', value);
    }
  } catch {}
`

const appBrandingScript = `
  try {
    var rawApp = localStorage.getItem(${JSON.stringify(APP_SETTINGS_STORAGE_KEY)});
    if (rawApp) {
      var parsedApp = JSON.parse(rawApp);
      if (parsedApp && typeof parsedApp === 'object') {
        var customName = typeof parsedApp.name === 'string' ? parsedApp.name.trim().slice(0, ${APP_NAME_MAX_LENGTH}) : '';
        var customIcon = typeof parsedApp.iconPath === 'string' ? parsedApp.iconPath.trim() : '';
        var isSafeCustomIcon = customIcon.indexOf('/assets/app/') === 0 && customIcon.indexOf('..') === -1 && customIcon.indexOf('\\\\') === -1 && customIcon.indexOf('%') === -1;
        var applyInitHead = function () {
          if (customName && document.title) {
            var expectedSuffix = ' - ' + customName;
            if (document.title !== customName && !document.title.endsWith(expectedSuffix)) {
              var base = document.title === 'vnweb' ? '' : (document.title.endsWith(' - vnweb') ? document.title.slice(0, -8) : document.title);
              window.__VNWEB_BASE_TITLE__ = base;
              window.__VNWEB_APPLIED_APP_NAME__ = customName;
              document.title = base ? (base + expectedSuffix) : customName;
            }
          }
          if (isSafeCustomIcon && document.head) {
            var links = document.head.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
            for (var i = 0; i < links.length; i++) {
              links[i].removeAttribute('type');
              links[i].removeAttribute('sizes');
              if (links[i].getAttribute('href') !== customIcon) {
                links[i].setAttribute('href', customIcon);
              }
            }
            if (!document.head.querySelector('link[data-vnweb-app-icon="true"]')) {
              var link = document.createElement('link');
              link.rel = 'icon';
              link.setAttribute('data-vnweb-app-icon', 'true');
              link.href = customIcon;
              document.head.appendChild(link);
            }
          }
        };
        applyInitHead();
        if (document.head && typeof MutationObserver !== 'undefined') {
          var obs = new MutationObserver(function () { applyInitHead(); });
          obs.observe(document.head, { childList: true, subtree: true, characterData: true });
          window.__VNWEB_INIT_HEAD_OBSERVER__ = obs;
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function () {
            applyInitHead();
            if (window.__VNWEB_INIT_HEAD_OBSERVER__) {
              window.__VNWEB_INIT_HEAD_OBSERVER__.disconnect();
              window.__VNWEB_INIT_HEAD_OBSERVER__ = undefined;
            }
          }, { once: true });
        }
      }
    }
  } catch {}
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh"
      data-borderless={DEFAULT_LAYOUT_SETTINGS.borderless ? '' : undefined}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: borderlessScript }} />
        <script dangerouslySetInnerHTML={{ __html: appBrandingScript }} />
      </head>
      <body>
        <TanStackProvider>
          <JotaiProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <SidebarProvider>
                <TooltipProvider>
                  <AppLayout>{children}</AppLayout>
                  <StartupSplashOverlay />
                  <GameWebMcpTools />
                  <GuideWebMcpTools />
                  <OstWebMcpTools />
                  <QuoteWebMcpTools />
                  <GlobalSongPlayer />
                  <Toaster />
                </TooltipProvider>
              </SidebarProvider>
            </ThemeProvider>
          </JotaiProvider>
        </TanStackProvider>
      </body>
    </html>
  )
}
