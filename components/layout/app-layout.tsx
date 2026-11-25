import AppAppearanceSync from './app-appearance-sync'
import AppBackground from './app-background'
import AppLayoutContent from './app-layout-content'

import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <AppAppearanceSync />
      <AppBackground />
      <AppLayoutContent>{children}</AppLayoutContent>
    </div>
  )
}
