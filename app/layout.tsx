import Layout from '@/components/layout/layout'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
            <TooltipProvider>
              <Layout>{children}</Layout>
            </TooltipProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
