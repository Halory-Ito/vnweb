import GameHome from '@/components/game/game-home'
import GameSidebar from '@/components/game/game-sidebar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function Home() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
      <ResizablePanel
        className="h-full"
        defaultSize="15%"
        minSize={'15%'}
        maxSize={'25%'}
      >
        <GameSidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="75%">
        <GameHome />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
