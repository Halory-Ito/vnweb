'use client'

import { useAtomValue } from 'jotai'
import { useSelectedLayoutSegment } from 'next/navigation'

import GameSidebar from './game-sidebar'
import HybridGameLibraryLayout from './hybrid-game-library-layout'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useIsMobile } from '@/hooks/use-mobile'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'
import { cn } from '@/lib/utils'

export default function GameLibraryLayout({ children }: { children: React.ReactNode }) {
  const layout = useAtomValue(gameLibraryLayoutAtom)
  const section = useSelectedLayoutSegment()
  const isMobile = useIsMobile()

  if (layout === 'hybrid') {
    return <HybridGameLibraryLayout isMobile={isMobile}>{children}</HybridGameLibraryLayout>
  }

  const showSidebar = layout === 'mixed' && section !== 'home' && !isMobile

  return (
    <div className="h-full w-full min-w-0">
      <ResizablePanelGroup
        orientation="horizontal"
        disabled={!showSidebar}
        className={cn('w-full min-w-0 overflow-hidden', !showSidebar && 'touch-auto!')}
      >
        {showSidebar ? (
          <>
            <ResizablePanel
              key="game-sidebar"
              id="game-sidebar"
              className="h-full min-w-0 overflow-x-hidden"
              defaultSize="16%"
              maxSize="32%"
            >
              <GameSidebar />
            </ResizablePanel>
            <ResizableHandle key="game-sidebar-handle" className="h-full" />
          </>
        ) : null}
        <ResizablePanel
          key="game-content"
          id="game-content"
          className={cn('h-full min-w-0 overflow-x-hidden', !showSidebar && 'touch-auto!')}
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
