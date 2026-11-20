'use client'

import { useRef, useState, type ReactNode } from 'react'

import { AppHeaderActions } from './app-header'
import AppSideBar from './app-sidebar'
import LayoutEdgeHandle from './layout-edge-handle'
import MobileNav from './mobile-nav'
import { AgentDrawer } from '@/features/agent'
import { useHeaderDropdownMenu } from '@/hooks/use-header-dropdown-menu'
import { useLayoutEdgeDrag } from '@/hooks/use-layout-edge-drag'
import { useLayoutVisibility } from '@/hooks/use-layout-visibility'
import { cn } from '@/lib/utils'

export default function AppLayoutContent({ children }: { children: ReactNode }) {
  const { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden } = useLayoutVisibility()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const { open: mobileNavOpen, setOpen: setMobileNavOpen } = useHeaderDropdownMenu('mobile')
  const [agentOpen, setAgentOpen] = useState(false)
  const sidebarDrag = useLayoutEdgeDrag('left', sidebarHidden, sidebarRef, setSidebarHidden)
  const headerDrag = useLayoutEdgeDrag('top', headerHidden, headerRef, setHeaderHidden)
  const mobileNavDrag = useLayoutEdgeDrag('left', true, null, () => {
    setSidebarHidden(false)
    setMobileNavOpen(true)
  })

  return (
    <>
      <div className="relative z-20 flex h-full w-full overflow-hidden">
        <div
          ref={sidebarRef}
          inert={sidebarHidden}
          className={cn('relative hidden shrink-0', !sidebarHidden && 'md:block')}
        >
          <AppSideBar />
          {sidebarHidden ? null : (
            <LayoutEdgeHandle side="left" hidden={false} handlers={sidebarDrag} />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            ref={headerRef}
            inert={headerHidden}
            className={cn(
              'relative w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-3 border-b p-3 md:flex-nowrap md:gap-4 md:p-4',
              headerHidden ? 'hidden' : 'flex',
            )}
          >
            <AppHeaderActions
              mobileNav={
                <MobileNav
                  open={mobileNavOpen}
                  onOpenChange={setMobileNavOpen}
                  showTrigger={!sidebarHidden}
                />
              }
              onOpenAgent={() => setAgentOpen(true)}
            />
            {headerHidden ? null : (
              <LayoutEdgeHandle side="top" hidden={false} handlers={headerDrag} />
            )}
          </header>
          <div className="[container-type:size] min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
        {sidebarHidden ? (
          <LayoutEdgeHandle side="left" hidden handlers={sidebarDrag} className="hidden md:grid" />
        ) : null}
        {sidebarHidden || headerHidden ? (
          <LayoutEdgeHandle
            side="left"
            hidden
            handlers={mobileNavDrag}
            className="md:hidden"
            label="打开站点导航"
          />
        ) : null}
        {headerHidden ? <LayoutEdgeHandle side="top" hidden handlers={headerDrag} /> : null}
      </div>

      <AgentDrawer open={agentOpen} onOpenChange={setAgentOpen} />
    </>
  )
}
