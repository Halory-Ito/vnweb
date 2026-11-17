'use client'

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import MobileHeaderMenu from './mobile-header-menu'
import MobileNav from './mobile-nav'
import R18Switch from './r18-switch'
import ThemeSwitch from './theme-switch'
import { Button } from '@/components/ui/button'
import { AgentDrawer } from '@/features/agent'
import GameHeaderControls from '@/features/game/components/game-header-controls'
import GameAddButton from '@/features/game/components/import/game-add-button'

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="flex w-full flex-wrap items-center gap-x-3 gap-y-3 border-b p-3 md:flex-nowrap md:gap-4 md:p-4">
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <div className="hidden items-center gap-4 md:flex">
          <Button onClick={router.back} variant="outline" size="icon" aria-label="返回">
            <ArrowLeftIcon />
          </Button>
          <Button onClick={router.forward} variant="outline" size="icon" aria-label="前进">
            <ArrowRightIcon />
          </Button>
          <GameAddButton desktopOnly />
        </div>
      </div>

      {pathname.startsWith('/game') ? (
        <div className="order-last w-full min-w-0 md:order-none md:w-auto md:flex-1">
          <GameHeaderControls />
        </div>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-4 md:flex">
          <R18Switch />
          <ThemeSwitch />
        </div>
        <AgentDrawer triggerClassName="size-10 md:size-9" />
        <MobileHeaderMenu />
      </div>
    </header>
  )
}
