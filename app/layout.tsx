import dayjs from 'dayjs'

import '@/app/globals.css'
import { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import 'dayjs/locale/zh-cn' // 导入本地化语言

dayjs.locale('zh-cn') // 使用本地化语言

import AppLayout from '@/components/layout/app-layout'
import WebsiteTitleUpdater from '@/components/layout/website-title-updater'
import JotaiProvider from '@/components/providers/jotai-provider'
import PluginProvider from '@/components/providers/plugin-provider'
import TanStackProvider from '@/components/providers/tanstack-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LXGWWenKai } from '@/fonts'

export const metadata: Metadata = {
  // %s 会被子页面的 title 替换
  title: {
    template: '%s',
    default: '我的网站', // 如果没有子页面 title，则显示这个
  },
  description: '网站描述',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className={LXGWWenKai.className} suppressHydrationWarning>
      <body>
        <TanStackProvider>
          <JotaiProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <PluginProvider>
                <SidebarProvider>
                  <TooltipProvider>
                    <AppLayout>{children}</AppLayout>
                    <Toaster />
                    <WebsiteTitleUpdater />
                  </TooltipProvider>
                </SidebarProvider>
              </PluginProvider>
            </ThemeProvider>
          </JotaiProvider>
        </TanStackProvider>
      </body>
    </html>
  )
}
