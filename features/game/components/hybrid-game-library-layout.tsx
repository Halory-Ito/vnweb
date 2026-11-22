import { Suspense } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import LibraryCategoryNavigation from '@/features/home/components/library-category-navigation'
import { useIsMobile } from '@/hooks/use-mobile'

import type { ReactNode } from 'react'

export default function HybridGameLibraryLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile()
  const categories = (
    <Suspense fallback={null}>
      <LibraryCategoryNavigation />
    </Suspense>
  )
  const content = (
    <div className="[container-type:size] h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  )

  if (isMobile) {
    return (
      <div className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <aside className="min-w-0 border-b">{categories}</aside>
        {content}
      </div>
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-w-0 overflow-hidden">
      <ResizablePanel id="library-categories" defaultSize="22%" minSize="10rem" maxSize="45%">
        <aside className="h-full min-w-0 overflow-y-auto">{categories}</aside>
      </ResizablePanel>
      <ResizableHandle aria-label="调整游戏库面板宽度" />
      <ResizablePanel id="library-content" defaultSize="78%">
        {content}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
