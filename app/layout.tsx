import { Metadata } from 'next'

import '@/app/globals.css'
import { ThemeProvider } from 'next-themes'

import AppLayout from '@/components/layout/app-layout'
import TanStackProvider from '@/components/providers/tanstack-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
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
    <html lang="en" className={LXGWWenKai.className} suppressHydrationWarning>
      <body>
        <TanStackProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <TooltipProvider>
                <AppLayout>{children}</AppLayout>
              </TooltipProvider>
            </SidebarProvider>
          </ThemeProvider>
        </TanStackProvider>
      </body>
    </html>
  )
}
