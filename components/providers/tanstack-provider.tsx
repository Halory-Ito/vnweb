'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 30 秒内数据视为新鲜，避免重复请求
      staleTime: 30_000,
      // 最小化/切换窗口后回到页面不自动重新拉取，数据一致性由 mutation + invalidateQueries 保证
      refetchOnWindowFocus: false,
    },
  },
})

export default function TanStackProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
