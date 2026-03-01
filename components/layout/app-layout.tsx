'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'

import AppHeader from './app-header'
import AppSideBar from './app-sidebar'
import { bgAtom } from '@/atom/global'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [bg, _setBg] = useAtom(bgAtom)
  const { resolvedTheme } = useTheme()
  return (
    <div
      className="relative flex h-screen w-screen bg-cover bg-center bg-no-repeat"
      style={
        resolvedTheme === 'dark'
          ? {
              backgroundImage: `url(${bg})`,
            }
          : {}
      }
    >
      <AppSideBar />
      <div className="relative z-20 w-full">
        <AppHeader />
        <div>{children}</div>
      </div>
    </div>
  )
}
