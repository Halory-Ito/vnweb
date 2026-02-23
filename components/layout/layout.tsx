'use client'

import Header from './header'
import AppSideBar from './app-sidebar'
import { useTheme } from 'next-themes'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  return (
    <div
      className={`h-screen w-screen flex`}
      style={{
        background:
          resolvedTheme === 'dark'
            ? 'url(/bg.png) center/cover no-repeat'
            : undefined,
      }}
    >
      <AppSideBar />
      <div className="w-full">
        <Header />
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
