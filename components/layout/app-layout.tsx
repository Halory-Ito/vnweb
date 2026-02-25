'use client'

import AppHeader from './app-header'
import AppSideBar from './app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen w-screen bg-cover bg-center bg-no-repeat dark:bg-[url('/bg.png')]">
      {/* 暗色遮罩层 */}
      {/* <div className="absolute inset-0 bg-black/50 z-10"></div> */}

      {/* 内容区域，提高z-index使其位于遮罩之上 */}
      <AppSideBar />
      <div className="relative z-20 w-full">
        <AppHeader />
        <div>{children}</div>
      </div>
    </div>
  )
}
