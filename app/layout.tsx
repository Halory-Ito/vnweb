import { ThemeProvider } from 'next-themes'

import '@/app/globals.css'
import AppLayout from '@/components/layout/app-layout'
import TanStackProvider from '@/components/providers/tanstack-provider'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { LXGWWenKai } from '@/fonts'

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
