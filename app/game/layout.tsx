import { Metadata } from 'next'

import GameSidebar from '@/components/game/game-sidebar'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'

export const metadata: Metadata = {
  title: '我的游戏',
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="w-full min-w-0 overflow-hidden"
    >
      <ResizablePanel
        className="h-full min-w-0 overflow-x-hidden"
        defaultSize="16%"
        maxSize={'32%'}
      >
        <GameSidebar />
      </ResizablePanel>
      <ResizableHandle className="h-[calc(100vh-70px)]" />
      <ResizablePanel className="min-w-0 overflow-x-hidden" defaultSize="75%">
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
