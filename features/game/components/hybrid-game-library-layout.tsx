import { Suspense } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import LibraryCategoryNavigation from '@/features/home/components/library-category-navigation'
import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export default function HybridGameLibraryLayout({
  children,
  isMobile,
}: {
  children: ReactNode
  isMobile: boolean
}) {
  const categories = (
    <Suspense fallback={null}>
      <LibraryCategoryNavigation />
    </Suspense>
  )

  return (
    <div
      className={cn(
        'grid h-full min-h-0 min-w-0',
        isMobile ? 'grid-rows-[auto_minmax(0,1fr)]' : 'grid-rows-[minmax(0,1fr)]',
      )}
    >
      {isMobile ? <aside className="min-w-0 border-b">{categories}</aside> : null}
      <ResizablePanelGroup
        orientation="horizontal"
        disabled={isMobile}
        className={cn('min-w-0 overflow-hidden', isMobile && 'touch-auto!')}
      >
        {isMobile ? null : (
          <>
            <ResizablePanel
              key="library-categories"
              id="library-categories"
              defaultSize="22%"
              minSize="0%"
              maxSize="45%"
              collapsible
              collapsedSize="0%"
              className="h-full min-w-0 overflow-x-hidden"
            >
              <aside className="h-full min-w-0 overflow-x-hidden overflow-y-auto">
                {categories}
              </aside>
            </ResizablePanel>
            <ResizableHandle key="library-handle" aria-label="调整游戏库面板宽度" />
          </>
        )}
        <ResizablePanel
          key="library-content"
          id="library-content"
          className={cn('h-full min-w-0 overflow-hidden', isMobile && 'touch-auto!')}
        >
          <div className="[container-type:size] h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
