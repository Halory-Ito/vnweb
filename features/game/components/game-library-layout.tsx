'use client'

import { useAtomValue } from 'jotai'
import { useSelectedLayoutSegment } from 'next/navigation'

import GameSidebar from './game-sidebar'
import HybridGameLibraryLayout from './hybrid-game-library-layout'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useIsMobile } from '@/hooks/use-mobile'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'

export default function GameLibraryLayout({ children }: { children: React.ReactNode }) {
  const layout = useAtomValue(gameLibraryLayoutAtom)
  const section = useSelectedLayoutSegment()
  const isMobile = useIsMobile()

  if (layout === 'hybrid') {
    return <HybridGameLibraryLayout>{children}</HybridGameLibraryLayout>
  }

  if (layout === 'grid' || section === 'home' || isMobile) {
    return <div className="h-full w-full min-w-0">{children}</div>
  }

  return (
    <div className="h-full">
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
  )
}
