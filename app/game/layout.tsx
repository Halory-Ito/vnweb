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
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel className="h-full" defaultSize="16%" maxSize={'32%'}>
        <GameSidebar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="75%">{children}</ResizablePanel>
    </ResizablePanelGroup>
  )
}
