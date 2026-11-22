'use client'

import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'

import GameSidebar from './game-sidebar'
import HybridGameLibraryLayout from './hybrid-game-library-layout'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'

export default function GameLibraryLayout({ children }: { children: React.ReactNode }) {
  const layout = useAtomValue(gameLibraryLayoutAtom)
  const pathname = usePathname()

  if (layout === 'hybrid') {
    return <HybridGameLibraryLayout>{children}</HybridGameLibraryLayout>
  }

  if (layout === 'grid' || pathname === '/game/home') {
    return <div className="h-full w-full min-w-0">{children}</div>
  }

  return (
    <>
      <div className="hidden h-full md:block">
        <ResizablePanelGroup orientation="horizontal" className="w-full min-w-0 overflow-hidden">
          <ResizablePanel
            className="h-full min-w-0 overflow-x-hidden"
            defaultSize="16%"
            maxSize="32%"
          >
            <GameSidebar />
          </ResizablePanel>
          <ResizableHandle className="h-full" />
          <ResizablePanel className="min-w-0 overflow-x-hidden" defaultSize="75%">
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="h-full w-full md:hidden">{children}</div>
    </>
  )
}
