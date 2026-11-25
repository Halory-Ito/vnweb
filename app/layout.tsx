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
